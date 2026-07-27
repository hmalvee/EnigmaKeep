/**
 * Rotating local backups of the *encrypted* vault file (opaque binary).
 *
 * Only ciphertext is stored — a snapshot is exactly as safe as the vault file.
 */

const DB_NAME = 'VaultSnapshots';
const DB_VERSION = 2;
const STORE = 'snapshots';

export const MAX_SNAPSHOTS = 8;
const MAX_SNAPSHOT_BYTES = 40 * 1024 * 1024;
const SNAPSHOT_SPACING_MS = 5 * 60 * 1000;

export interface VaultSnapshot {
  id: number;
  name: string;
  /** Opaque encrypted bytes (v2+). Legacy rows may still hold a string. */
  content: ArrayBuffer | string;
  size: number;
  createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function contentByteLength(content: ArrayBuffer | string): number {
  return typeof content === 'string' ? content.length : content.byteLength;
}

/** Store an encrypted vault copy and prune the oldest beyond MAX_SNAPSHOTS. */
export async function saveVaultSnapshot(
  name: string,
  content: ArrayBuffer
): Promise<boolean> {
  if (content.byteLength > MAX_SNAPSHOT_BYTES) return false;

  try {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const now = Date.now();

      const existing = (await requestToPromise(store.getAll())) as VaultSnapshot[];
      existing.sort((a, b) => b.createdAt - a.createdAt);

      const newest = existing[0];
      if (newest && now - newest.createdAt < SNAPSHOT_SPACING_MS) {
        store.delete(newest.id);
      }

      await requestToPromise(
        store.add({
          name,
          content,
          size: content.byteLength,
          createdAt: now
        })
      );

      const all = (await requestToPromise(store.getAll())) as VaultSnapshot[];
      all.sort((a, b) => b.createdAt - a.createdAt);
      for (const stale of all.slice(MAX_SNAPSHOTS)) {
        store.delete(stale.id);
      }

      return true;
    } finally {
      db.close();
    }
  } catch (err) {
    console.error('Failed to store vault snapshot:', err);
    return false;
  }
}

/** Newest first. */
export async function listVaultSnapshots(): Promise<VaultSnapshot[]> {
  try {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE, 'readonly');
      const all = (await requestToPromise(tx.objectStore(STORE).getAll())) as VaultSnapshot[];
      return all.sort((a, b) => b.createdAt - a.createdAt);
    } finally {
      db.close();
    }
  } catch (err) {
    console.error('Failed to list vault snapshots:', err);
    return [];
  }
}

/** Rebuild a File from a snapshot so it can go through the normal unlock path. */
export function snapshotToFile(snapshot: VaultSnapshot): File {
  const data =
    typeof snapshot.content === 'string'
      ? snapshot.content
      : snapshot.content;
  return new File([data], snapshot.name, { type: 'application/octet-stream' });
}

export async function deleteVaultSnapshot(id: number): Promise<void> {
  try {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE, 'readwrite');
      await requestToPromise(tx.objectStore(STORE).delete(id));
    } finally {
      db.close();
    }
  } catch (err) {
    console.error('Failed to delete vault snapshot:', err);
  }
}

export async function clearVaultSnapshots(): Promise<void> {
  try {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE, 'readwrite');
      await requestToPromise(tx.objectStore(STORE).clear());
    } finally {
      db.close();
    }
  } catch (err) {
    console.error('Failed to clear vault snapshots:', err);
  }
}

export { contentByteLength };
