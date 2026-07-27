import type { StoredFile, VaultFolder } from '../types/vault';

/** Per-file ceiling. The whole vault is re-encrypted on every save and files are
 *  base64-embedded, so very large files slow saves — but users asked for room. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB — keeps vault re-encrypts practical

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x2000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export async function fileToStoredFile(file: File, folderId: string | null = null): Promise<StoredFile> {
  const buffer = await file.arrayBuffer();
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name: file.name,
    mimeType: file.type || guessMimeFromName(file.name),
    size: file.size,
    data: bytesToBase64(new Uint8Array(buffer)),
    folderId,
    createdAt: now,
    updatedAt: now
  };
}

/** Trigger a browser download of a decrypted stored file. */
export function downloadStoredFile(stored: StoredFile): void {
  const bytes = base64ToBytes(stored.data);
  const blob = new Blob([bytes as unknown as BlobPart], { type: stored.mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = stored.name;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Text preview / edit ──────────────────────────────────────────────

const TEXT_EXTENSIONS = [
  'txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'xml', 'yaml', 'yml', 'log',
  'ini', 'conf', 'cfg', 'env', 'js', 'ts', 'jsx', 'tsx', 'css', 'html', 'htm',
  'py', 'rb', 'go', 'rs', 'java', 'c', 'h', 'cpp', 'sh', 'bat', 'sql'
];

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
}

export function isTextFile(file: StoredFile): boolean {
  if (file.mimeType.startsWith('text/')) return true;
  if (file.mimeType === 'application/json' || file.mimeType === 'application/xml') return true;
  return TEXT_EXTENSIONS.includes(fileExtension(file.name));
}

export function isImageFile(file: StoredFile): boolean {
  return file.mimeType.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(fileExtension(file.name));
}

export function storedFileToText(file: StoredFile): string {
  return new TextDecoder().decode(base64ToBytes(file.data));
}

/** Build an object-URL for previewing (e.g. images). Caller must revoke it. */
export function storedFileObjectUrl(file: StoredFile): string {
  const bytes = base64ToBytes(file.data);
  const blob = new Blob([bytes as unknown as BlobPart], { type: file.mimeType });
  return URL.createObjectURL(blob);
}

/** Produce updated {data,size} for a stored text file after an in-app edit. */
export function textToStoredData(text: string): { data: string; size: number } {
  const bytes = new TextEncoder().encode(text);
  return { data: bytesToBase64(bytes), size: bytes.length };
}

function guessMimeFromName(name: string): string {
  const ext = fileExtension(name);
  const map: Record<string, string> = {
    txt: 'text/plain', md: 'text/markdown', csv: 'text/csv', json: 'application/json',
    xml: 'application/xml', html: 'text/html', png: 'image/png', jpg: 'image/jpeg',
    jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
    pdf: 'application/pdf', zip: 'application/zip'
  };
  return map[ext] || 'application/octet-stream';
}

// ── Folder-upload structure building ─────────────────────────────────

export interface FolderUploadResult {
  folders: VaultFolder[];
  files: StoredFile[];
}

/**
 * Turn a `<input webkitdirectory>` FileList into folders + files, recreating
 * the uploaded directory tree underneath `parentId`. Each file carries a
 * `webkitRelativePath` like "myfolder/sub/photo.png".
 */
export async function buildFolderUpload(
  fileList: File[],
  parentId: string | null
): Promise<FolderUploadResult> {
  const folders: VaultFolder[] = [];
  const files: StoredFile[] = [];
  // Map "myfolder/sub" -> folder id, so shared prefixes reuse the same folder.
  const pathToId = new Map<string, string>();

  const ensureFolder = (segments: string[]): string | null => {
    let currentParent = parentId;
    let accum = '';
    for (const segment of segments) {
      accum = accum ? `${accum}/${segment}` : segment;
      let id = pathToId.get(accum);
      if (!id) {
        id = crypto.randomUUID();
        pathToId.set(accum, id);
        folders.push({
          id,
          name: segment,
          parentId: currentParent,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      currentParent = id;
    }
    return currentParent;
  };

  for (const file of fileList) {
    const rel = (file as any).webkitRelativePath as string | undefined;
    const parts = rel ? rel.split('/') : [file.name];
    const dirSegments = parts.slice(0, -1);
    const folderId = ensureFolder(dirSegments);
    files.push(await fileToStoredFile(file, folderId));
  }

  return { folders, files };
}

/** All descendant folder ids of a folder (inclusive of itself). */
export function descendantFolderIds(folders: VaultFolder[], rootId: string): Set<string> {
  const ids = new Set<string>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const f of folders) {
      if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) {
        ids.add(f.id);
        added = true;
      }
    }
  }
  return ids;
}
