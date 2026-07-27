import {
  encrypt,
  decrypt,
  encryptToBytes,
  decryptFromBytes,
  type EncryptedBytes
} from '../crypto/encryption';
import {
  packVaultContainer,
  parseVaultFile,
  type VaultContainer
} from '../crypto/vaultFormat';
import { deriveRecoveryEncryptionPassword } from '../crypto/recoveryPhrase';
import { saveVaultSnapshot } from './vaultSnapshots';
import type { VaultData, PasswordEntry } from '../types/vault';

const VAULT_VERSION = 1;

export async function createNewVault(recoveryPhraseHash?: string): Promise<VaultData> {
  return {
    version: VAULT_VERSION,
    entries: [],
    files: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    recoveryPhraseHash,
    encryptionType: 'AES-256-GCM',
    kdfIterations: 600000
  };
}

/**
 * Decrypt a recovery block: try derived high-entropy key first, then the
 * raw mnemonic (legacy vaults created before Recovery-Enc-v1).
 */
async function decryptWithRecoveryPhrase(
  block: EncryptedBytes,
  recoveryPhrase: string
): Promise<string> {
  try {
    const derived = await deriveRecoveryEncryptionPassword(recoveryPhrase);
    return await decryptFromBytes(block, derived);
  } catch {
    return await decryptFromBytes(block, recoveryPhrase);
  }
}

/**
 * Build the opaque, authenticated container for a vault. The recovery
 * phrase (when present) independently re-encrypts the same vault so the
 * vault can be reopened from the phrase alone. Nothing about the vault —
 * not the recovery hash, version, or device info — appears in plaintext.
 */
async function buildContainer(
  vault: VaultData,
  password: string,
  recoveryPhrase?: string,
  existingRecovery?: EncryptedBytes
): Promise<VaultContainer> {
  const vaultJson = JSON.stringify(vault);
  const primary = await encryptToBytes(vaultJson, password);

  const container: VaultContainer = { primary };

  if (recoveryPhrase && vault.recoveryPhraseHash) {
    const recoveryKey = await deriveRecoveryEncryptionPassword(recoveryPhrase);
    container.recovery = await encryptToBytes(vaultJson, recoveryKey);
  } else if (existingRecovery) {
    container.recovery = existingRecovery;
  }

  return container;
}

/**
 * Encrypt a vault to an opaque binary .dat blob.
 * High-entropy bytes only — no magic, banners, JSON, or text wrappers —
 * so packet captures / naive AI file scans see random data, not structure.
 * Large vaults stay 1:1 with ciphertext size (no zero-width / base64 bloat).
 */
export async function encryptVault(
  vault: VaultData,
  password: string,
  recoveryPhrase?: string,
  existingRecovery?: EncryptedBytes
): Promise<Blob> {
  const container = await buildContainer(vault, password, recoveryPhrase, existingRecovery);
  const bytes = packVaultContainer(container);
  // Copy into a fresh ArrayBuffer-backed view for Blob (avoids SharedArrayBuffer issues).
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: 'application/octet-stream' });
}

async function decryptContainer(
  container: VaultContainer,
  password: string,
  useRecoveryKey: boolean
): Promise<VaultData> {
  const block = useRecoveryKey && container.recovery ? container.recovery : container.primary;
  if (!block) {
    throw new Error('Recovery data not available in this vault');
  }

  const decryptedJson = useRecoveryKey
    ? await decryptWithRecoveryPhrase(block, password)
    : await decryptFromBytes(block, password);

  const vault: VaultData = JSON.parse(decryptedJson);
  if (!vault.version || !Array.isArray(vault.entries)) {
    throw new Error('Invalid vault format');
  }
  return vault;
}

export async function decryptVault(
  blob: Blob,
  password: string,
  useRecoveryKey: boolean = false
): Promise<VaultData> {
  const buffer = await blob.arrayBuffer();
  const parsed = parseVaultFile(buffer);

  if (!parsed) {
    throw new Error('Unrecognised or corrupted vault file');
  }

  if (parsed.kind === 'legacy') {
    // Backward compatibility with the original v1 JSON files.
    const source = useRecoveryKey && parsed.parsed.recoveryKeyData
      ? parsed.parsed.recoveryKeyData
      : parsed.parsed.encryptedData;

    let decryptedJson: string;
    if (useRecoveryKey) {
      try {
        const derived = await deriveRecoveryEncryptionPassword(password);
        decryptedJson = await decrypt(source, derived);
      } catch {
        decryptedJson = await decrypt(source, password);
      }
    } else {
      decryptedJson = await decrypt(source, password);
    }

    const vault: VaultData = JSON.parse(decryptedJson);
    if (!vault.version || !Array.isArray(vault.entries)) {
      throw new Error('Invalid vault format');
    }
    return vault;
  }

  return decryptContainer(parsed.container, password, useRecoveryKey);
}

export async function decryptVaultWithRecovery(blob: Blob, recoveryPhrase: string): Promise<VaultData> {
  return decryptVault(blob, recoveryPhrase, true);
}

/**
 * Read the raw recovery block from a saved file (without decrypting it) so it
 * can be re-embedded when the vault is saved after a normal password unlock.
 */
export async function readVaultRecoverySection(file: File): Promise<EncryptedBytes | null> {
  try {
    const buffer = await file.arrayBuffer();
    const parsed = parseVaultFile(buffer);
    if (!parsed) return null;
    if (parsed.kind === 'legacy') {
      // Legacy recovery blocks use a different in-memory shape; they are not
      // re-embedded into v2 files. Re-set a recovery phrase to restore it.
      return null;
    }
    return parsed.container.recovery || null;
  } catch {
    return null;
  }
}

/**
 * Confirm a saved file still parses as a vault container. Catches truncated
 * writes / sync corruption while the data is still in memory.
 */
export async function verifyVaultFile(file: File): Promise<boolean> {
  try {
    const buffer = await file.arrayBuffer();
    const parsed = parseVaultFile(buffer);
    if (!parsed) return false;
    if (parsed.kind === 'legacy') return !!parsed.parsed.encryptedData;
    return parsed.container.primary.data.length > 0;
  } catch {
    return false;
  }
}

export async function saveVaultToFile(
  fileHandle: FileSystemFileHandle,
  vault: VaultData,
  password: string,
  recoveryPhrase?: string,
  existingRecoveryData?: EncryptedBytes
): Promise<void> {
  const updatedVault = {
    ...vault,
    lastBackup: Date.now(),
    updatedAt: Date.now()
  };

  const blob = await encryptVault(updatedVault, password, recoveryPhrase, existingRecoveryData);
  const buffer = await blob.arrayBuffer();

  // Snapshot first so a failed write still leaves a recoverable copy.
  await saveVaultSnapshot(fileHandle.name, buffer);

  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();

  const written = await fileHandle.getFile();
  if (!(await verifyVaultFile(written))) {
    throw new Error(
      'Vault file failed verification after saving. A local backup was kept — unlock from backup and Save to a new file.'
    );
  }
}

export async function loadVaultFromFile(
  file: File,
  password: string
): Promise<VaultData> {
  return await decryptVault(file, password);
}

export function addEntry(vault: VaultData, entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): VaultData {
  const now = Date.now();
  const newEntry: PasswordEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now
  };

  return {
    ...vault,
    entries: [...vault.entries, newEntry],
    updatedAt: now
  };
}

export function updateEntry(vault: VaultData, entryId: string, updates: Partial<PasswordEntry>): VaultData {
  const now = Date.now();
  return {
    ...vault,
    entries: vault.entries.map(entry =>
      entry.id === entryId
        ? { ...entry, ...updates, updatedAt: now }
        : entry
    ),
    updatedAt: now
  };
}

export function deleteEntry(vault: VaultData, entryId: string): VaultData {
  return {
    ...vault,
    entries: vault.entries.filter(entry => entry.id !== entryId),
    updatedAt: Date.now()
  };
}

export function searchEntries(vault: VaultData, query: string): PasswordEntry[] {
  if (!query.trim()) {
    return vault.entries;
  }

  const lowerQuery = query.toLowerCase();
  return vault.entries.filter(entry =>
    entry.title.toLowerCase().includes(lowerQuery) ||
    entry.username.toLowerCase().includes(lowerQuery) ||
    entry.url?.toLowerCase().includes(lowerQuery) ||
    entry.notes?.toLowerCase().includes(lowerQuery)
  );
}

export function updateVaultMetadata(vault: VaultData, metadata: Partial<VaultData>): VaultData {
  return {
    ...vault,
    ...metadata,
    updatedAt: Date.now()
  };
}

/**
 * Legacy files exposed metadata (recovery hash, version) in plaintext. The v2
 * format deliberately does not, so this now returns null for hardened files.
 * A wrong recovery phrase simply fails AES-GCM authentication on decrypt.
 */
export async function getVaultMetadata(file: File): Promise<{ recoveryPhraseHash?: string; version?: number } | null> {
  try {
    const buffer = await file.arrayBuffer();
    const parsed = parseVaultFile(buffer);
    if (parsed?.kind === 'legacy') {
      return parsed.parsed.metadata || null;
    }
    return null;
  } catch {
    return null;
  }
}

// Kept so existing imports of `encrypt`/`decrypt`/`packVaultContainer` continue to resolve.
export { encrypt, decrypt, packVaultContainer };
