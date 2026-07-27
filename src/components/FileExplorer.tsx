import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Folder, FolderPlus, Upload, File as FileIcon, FileText, FileImage, FileArchive,
  LayoutGrid, List as ListIcon, ChevronRight, Download, Trash2, Pencil, Search,
  Home, ShieldCheck, Check, X
} from 'lucide-react';
import type { StoredFile, VaultFolder } from '../types/vault';
import { formatBytes, MAX_FILE_BYTES, isImageFile, isTextFile, fileExtension } from '../utils/fileStorage';
import { FilePreviewModal } from './FilePreviewModal';

interface FileExplorerProps {
  folders: VaultFolder[];
  files: StoredFile[];
  onUploadFiles: (list: FileList, folderId: string | null) => void;
  onUploadFolder: (list: FileList, parentId: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onRenameFile: (id: string, name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFile: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onDownloadFile: (file: StoredFile) => void;
  onSaveFileText: (id: string, text: string) => void;
}

function fileIcon(file: StoredFile) {
  if (isImageFile(file)) return FileImage;
  const ext = fileExtension(file.name);
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return FileArchive;
  if (isTextFile(file)) return FileText;
  return FileIcon;
}

function fileKind(file: StoredFile): string {
  const ext = fileExtension(file.name);
  if (ext) return `${ext.toUpperCase()} file`;
  if (file.mimeType) return file.mimeType;
  return 'File';
}

export function FileExplorer({
  folders, files,
  onUploadFiles, onUploadFolder, onCreateFolder,
  onRenameFile, onRenameFolder, onDeleteFile, onDeleteFolder,
  onDownloadFile, onSaveFileText
}: FileExplorerProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [query, setQuery] = useState('');
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState<{ id: string; kind: 'file' | 'folder' } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // webkitdirectory / directory aren't typed on the input element.
    const el = folderInputRef.current;
    if (el) {
      el.setAttribute('webkitdirectory', '');
      el.setAttribute('directory', '');
    }
  }, []);

  // Reset preview if the underlying file disappears (deleted elsewhere).
  useEffect(() => {
    if (previewFile && !files.some(f => f.id === previewFile.id)) setPreviewFile(null);
  }, [files, previewFile]);

  const folderMap = useMemo(() => {
    const m = new Map<string, VaultFolder>();
    folders.forEach(f => m.set(f.id, f));
    return m;
  }, [folders]);

  const breadcrumb = useMemo(() => {
    const chain: VaultFolder[] = [];
    let id = currentFolderId;
    while (id) {
      const f = folderMap.get(id);
      if (!f) break;
      chain.unshift(f);
      id = f.parentId;
    }
    return chain;
  }, [currentFolderId, folderMap]);

  const q = query.trim().toLowerCase();
  const subfolders = folders
    .filter(f => (f.parentId ?? null) === currentFolderId)
    .filter(f => !q || f.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));
  const filesHere = files
    .filter(f => (f.folderId ?? null) === currentFolderId)
    .filter(f => !q || f.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));

  const isEmpty = subfolders.length === 0 && filesHere.length === 0 && !creating;

  const commitNewFolder = () => {
    const name = newName.trim();
    if (name) onCreateFolder(name, currentFolderId);
    setNewName('');
    setCreating(false);
  };

  const startRename = (id: string, kind: 'file' | 'folder', current: string) => {
    setRenaming({ id, kind });
    setRenameValue(current);
  };
  const commitRename = () => {
    if (!renaming) return;
    const name = renameValue.trim();
    if (name) {
      if (renaming.kind === 'folder') onRenameFolder(renaming.id, name);
      else onRenameFile(renaming.id, name);
    }
    setRenaming(null);
    setRenameValue('');
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div
      className="flex-1 overflow-auto p-6"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) onUploadFiles(e.dataTransfer.files, currentFolderId);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length) onUploadFiles(e.target.files, currentFolderId);
          e.target.value = '';
        }}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length) onUploadFolder(e.target.files, currentFolderId);
          e.target.value = '';
        }}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button onClick={() => setCreating(true)} className="btn-ghost !py-2 !px-3 text-sm flex items-center gap-2">
          <FolderPlus size={16} /> New Folder
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="btn-ghost !py-2 !px-3 text-sm flex items-center gap-2">
          <Upload size={16} /> Upload Files
        </button>
        <button onClick={() => folderInputRef.current?.click()} className="btn-ghost !py-2 !px-3 text-sm flex items-center gap-2">
          <Folder size={16} /> Upload Folder
        </button>

        <div className="flex-1" />

        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this folder"
            className="ai-input !py-2 !pl-9 !pr-3 text-sm w-52"
          />
        </div>
        <div className="flex rounded-lg border border-line overflow-hidden">
          <button
            onClick={() => setView('list')}
            className={`p-2 ${view === 'list' ? 'bg-accent/15 text-accent' : 'text-muted hover:text-ink'}`}
            aria-label="List view"
          >
            <ListIcon size={16} />
          </button>
          <button
            onClick={() => setView('grid')}
            className={`p-2 ${view === 'grid' ? 'bg-accent/15 text-accent' : 'text-muted hover:text-ink'}`}
            aria-label="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm mb-4 flex-wrap">
        <button
          onClick={() => setCurrentFolderId(null)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-surface2 ${currentFolderId === null ? 'text-ink' : 'text-muted'}`}
        >
          <Home size={14} /> Files
        </button>
        {breadcrumb.map((f) => (
          <span key={f.id} className="flex items-center gap-1">
            <ChevronRight size={14} className="text-muted" />
            <button
              onClick={() => setCurrentFolderId(f.id)}
              className={`px-2 py-1 rounded-md hover:bg-surface2 ${f.id === currentFolderId ? 'text-ink' : 'text-muted'}`}
            >
              {f.name}
            </button>
          </span>
        ))}
      </div>

      {/* Info row */}
      <div className="flex items-center gap-2 text-xs text-muted mb-3">
        <ShieldCheck size={14} className="text-accent" />
        <span>
          {subfolders.length} folder{subfolders.length === 1 ? '' : 's'} · {filesHere.length} file{filesHere.length === 1 ? '' : 's'} · encrypted in vault · up to {formatBytes(MAX_FILE_BYTES)} per file
        </span>
      </div>

      {/* New folder inline input */}
      {creating && (
        <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-surface2 border border-line">
          <Folder size={18} className="text-accent" />
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commitNewFolder(); if (e.key === 'Escape') { setCreating(false); setNewName(''); } }}
            placeholder="Folder name"
            className="ai-input !py-1.5 flex-1 text-sm"
          />
          <button onClick={commitNewFolder} className="p-1.5 rounded-md text-success hover:bg-surface"><Check size={16} /></button>
          <button onClick={() => { setCreating(false); setNewName(''); }} className="p-1.5 rounded-md text-muted hover:bg-surface"><X size={16} /></button>
        </div>
      )}

      {isEmpty ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer text-center py-20 rounded-2xl border-2 border-dashed transition-colors ${dragOver ? 'border-accent bg-accent/5' : 'border-line hover:border-accent/50'}`}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 mb-4">
            <Upload className="text-accent" size={28} />
          </div>
          <h3 className="text-xl font-semibold text-ink mb-1">This folder is empty</h3>
          <p className="text-muted">Drag files here, or use Upload Files / Upload Folder above.</p>
        </div>
      ) : view === 'list' ? (
        /* ── LIST VIEW ── */
        <div className="rounded-xl border border-line overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_110px_140px] gap-2 px-4 py-2.5 bg-surface2 text-xs font-medium text-muted border-b border-line">
            <span>Name</span>
            <span>Type</span>
            <span>Size</span>
            <span>Modified</span>
          </div>

          {subfolders.map((folder) => (
            <div
              key={folder.id}
              onDoubleClick={() => setCurrentFolderId(folder.id)}
              className="group grid grid-cols-[1fr_120px_110px_140px] gap-2 px-4 py-2.5 items-center border-b border-line/60 hover:bg-surface2 cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Folder size={18} className="text-accent flex-shrink-0" />
                {renaming?.id === folder.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(null); }}
                    onClick={(e) => e.stopPropagation()}
                    className="ai-input !py-1 text-sm"
                  />
                ) : (
                  <button onClick={() => setCurrentFolderId(folder.id)} className="truncate text-ink hover:text-accent text-sm text-left">
                    {folder.name}
                  </button>
                )}
              </div>
              <span className="text-xs text-muted">Folder</span>
              <span className="text-xs text-muted">—</span>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">{formatDate(folder.updatedAt)}</span>
                <RowActions
                  onRename={() => startRename(folder.id, 'folder', folder.name)}
                  onDelete={() => onDeleteFolder(folder.id)}
                />
              </div>
            </div>
          ))}

          {filesHere.map((file) => {
            const Icon = fileIcon(file);
            return (
              <div
                key={file.id}
                onDoubleClick={() => setPreviewFile(file)}
                className="group grid grid-cols-[1fr_120px_110px_140px] gap-2 px-4 py-2.5 items-center border-b border-line/60 last:border-b-0 hover:bg-surface2 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon size={18} className="text-muted flex-shrink-0" />
                  {renaming?.id === file.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(null); }}
                      onClick={(e) => e.stopPropagation()}
                      className="ai-input !py-1 text-sm"
                    />
                  ) : (
                    <button onClick={() => setPreviewFile(file)} className="truncate text-ink hover:text-accent text-sm text-left" title={file.name}>
                      {file.name}
                    </button>
                  )}
                </div>
                <span className="text-xs text-muted truncate">{fileKind(file)}</span>
                <span className="text-xs text-muted">{formatBytes(file.size)}</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">{formatDate(file.updatedAt)}</span>
                  <RowActions
                    onDownload={() => onDownloadFile(file)}
                    onRename={() => startRename(file.id, 'file', file.name)}
                    onDelete={() => onDeleteFile(file.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── GRID VIEW ── */
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {subfolders.map((folder) => (
            <button
              key={folder.id}
              onDoubleClick={() => setCurrentFolderId(folder.id)}
              onClick={() => setCurrentFolderId(folder.id)}
              className="surface-card p-4 text-center hover:border-accent/40 transition-colors"
            >
              <Folder size={40} className="text-accent mx-auto mb-2" fill="currentColor" fillOpacity={0.15} />
              <p className="text-sm text-ink truncate" title={folder.name}>{folder.name}</p>
            </button>
          ))}
          {filesHere.map((file) => {
            const Icon = fileIcon(file);
            return (
              <button
                key={file.id}
                onDoubleClick={() => setPreviewFile(file)}
                onClick={() => setPreviewFile(file)}
                className="surface-card p-4 text-center hover:border-accent/40 transition-colors"
              >
                <Icon size={38} className="text-muted mx-auto mb-2" />
                <p className="text-sm text-ink truncate" title={file.name}>{file.name}</p>
                <p className="text-xs text-muted mt-0.5">{formatBytes(file.size)}</p>
              </button>
            );
          })}
        </div>
      )}

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onSaveText={onSaveFileText}
          onDownload={onDownloadFile}
        />
      )}
    </div>
  );
}

function RowActions({ onDownload, onRename, onDelete }: { onDownload?: () => void; onRename: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
      {onDownload && (
        <button onClick={onDownload} className="p-1.5 rounded-md text-muted hover:text-accent hover:bg-surface" aria-label="Download">
          <Download size={15} />
        </button>
      )}
      <button onClick={onRename} className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-surface" aria-label="Rename">
        <Pencil size={15} />
      </button>
      <button onClick={onDelete} className="p-1.5 rounded-md text-muted hover:text-danger hover:bg-surface" aria-label="Delete">
        <Trash2 size={15} />
      </button>
    </div>
  );
}
