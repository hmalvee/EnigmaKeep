const LAST_VAULT_KEY = 'lastVaultPath';
const LAST_VAULT_HANDLE_KEY = 'lastVaultHandle';

export function saveLastVaultPath(path: string): void {
  try {
    localStorage.setItem(LAST_VAULT_KEY, path);
  } catch (err) {
    console.error('Failed to save last vault path:', err);
  }
}

export function getLastVaultPath(): string | null {
  try {
    return localStorage.getItem(LAST_VAULT_KEY);
  } catch (err) {
    console.error('Failed to get last vault path:', err);
    return null;
  }
}

export function clearLastVaultPath(): void {
  try {
    localStorage.removeItem(LAST_VAULT_KEY);
    localStorage.removeItem(LAST_VAULT_HANDLE_KEY);
  } catch (err) {
    console.error('Failed to clear last vault path:', err);
  }
}

export async function saveLastVaultHandle(handle: FileSystemFileHandle): Promise<void> {
  if (!('indexedDB' in window)) return;

  try {
    const db = await openHandleDatabase();
    const transaction = db.transaction(['handles'], 'readwrite');
    const store = transaction.objectStore('handles');
    await store.put(handle, LAST_VAULT_HANDLE_KEY);
    db.close();
  } catch (err) {
    console.error('Failed to save vault handle:', err);
  }
}

export async function getLastVaultHandle(): Promise<FileSystemFileHandle | null> {
  if (!('indexedDB' in window)) return null;

  try {
    const db = await openHandleDatabase();
    const transaction = db.transaction(['handles'], 'readonly');
    const store = transaction.objectStore('handles');
    const request = store.get(LAST_VAULT_HANDLE_KEY);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        resolve(request.result || null);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('Failed to get vault handle:', err);
    return null;
  }
}

export async function verifyHandleAccess(handle: FileSystemFileHandle): Promise<boolean> {
  try {
    const permission = await handle.queryPermission({ mode: 'read' });
    if (permission === 'granted') {
      await handle.getFile();
      return true;
    }

    const requestedPermission = await handle.requestPermission({ mode: 'read' });
    if (requestedPermission === 'granted') {
      await handle.getFile();
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}

function openHandleDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VaultHandles', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('handles')) {
        db.createObjectStore('handles');
      }
    };
  });
}
