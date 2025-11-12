import { encrypt, decrypt } from '../crypto/encryption';
import { bindVaultToDevice, verifyDeviceBinding } from '../crypto/deviceBinding';
import type { VaultData, PasswordEntry, VaultFileFormat } from '../types/vault';

const VAULT_VERSION = 1;

export async function createNewVault(recoveryPhraseHash?: string): Promise<VaultData> {
  return {
    version: VAULT_VERSION,
    entries: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    recoveryPhraseHash,
    encryptionType: 'AES-256-GCM',
    kdfIterations: 100000
  };
}

export async function encryptVault(vault: VaultData, password: string, recoveryPhrase?: string): Promise<Blob> {
  const vaultJson = JSON.stringify(vault);
  const encrypted = await encrypt(vaultJson, password);

  const deviceBinding = await bindVaultToDevice(vaultJson);

  const vaultFile: VaultFileFormat = {
    metadata: {
      version: vault.version,
      recoveryPhraseHash: vault.recoveryPhraseHash,
      deviceBinding
    },
    encryptedData: encrypted
  };

  if (recoveryPhrase && vault.recoveryPhraseHash) {
    const recoveryEncrypted = await encrypt(vaultJson, recoveryPhrase);
    vaultFile.recoveryKeyData = recoveryEncrypted;
  }

  const fileJson = JSON.stringify(vaultFile);
  const encoder = new TextEncoder();
  const data = encoder.encode(fileJson);
  const signatureBuffer = await crypto.subtle.digest('SHA-512', data);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

  vaultFile.signature = signature;

  const finalJson = JSON.stringify(vaultFile);
  return new Blob([finalJson], { type: 'application/octet-stream' });
}

export async function decryptVault(blob: Blob, password: string, useRecoveryKey: boolean = false): Promise<VaultData> {
  const text = await blob.text();
  const parsed = JSON.parse(text);

  if (parsed.signature) {
    const vaultCopy = { ...parsed };
    const storedSignature = vaultCopy.signature;
    delete vaultCopy.signature;

    const fileJson = JSON.stringify(vaultCopy);
    const encoder = new TextEncoder();
    const data = encoder.encode(fileJson);
    const signatureBuffer = await crypto.subtle.digest('SHA-512', data);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const calculatedSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (calculatedSignature !== storedSignature) {
      throw new Error('Vault file signature verification failed - file may be corrupted or tampered with');
    }
  }

  let encrypted;
  if (parsed.metadata && parsed.encryptedData) {
    if (useRecoveryKey && parsed.recoveryKeyData) {
      encrypted = parsed.recoveryKeyData;
    } else {
      encrypted = parsed.encryptedData;
    }
  } else {
    encrypted = parsed;
  }

  const decryptedJson = await decrypt(encrypted, password);
  const vault: VaultData = JSON.parse(decryptedJson);

  if (!vault.version || !Array.isArray(vault.entries)) {
    throw new Error('Invalid vault format');
  }

  if (parsed.metadata?.deviceBinding) {
    const isDeviceValid = await verifyDeviceBinding(decryptedJson, parsed.metadata.deviceBinding);

    if (!isDeviceValid) {
      console.warn('Device verification warning: This vault was created on a different device/browser.');
    }
  }

  return vault;
}

export async function decryptVaultWithRecovery(blob: Blob, recoveryPhrase: string): Promise<VaultData> {
  return decryptVault(blob, recoveryPhrase, true);
}

export async function saveVaultToFile(
  fileHandle: FileSystemFileHandle,
  vault: VaultData,
  password: string,
  recoveryPhrase?: string,
  existingRecoveryData?: any
): Promise<void> {
  const updatedVault = {
    ...vault,
    lastBackup: Date.now(),
    updatedAt: Date.now()
  };
  const vaultJson = JSON.stringify(updatedVault);
  const encrypted = await encrypt(vaultJson, password);

  const deviceBinding = await bindVaultToDevice(vaultJson);

  const vaultFile: VaultFileFormat = {
    metadata: {
      version: updatedVault.version,
      recoveryPhraseHash: updatedVault.recoveryPhraseHash,
      deviceBinding
    },
    encryptedData: encrypted
  };

  if (recoveryPhrase && updatedVault.recoveryPhraseHash) {
    const recoveryEncrypted = await encrypt(vaultJson, recoveryPhrase);
    vaultFile.recoveryKeyData = recoveryEncrypted;
  } else if (existingRecoveryData) {
    vaultFile.recoveryKeyData = existingRecoveryData;
  }

  const fileJson = JSON.stringify(vaultFile);
  const encoder = new TextEncoder();
  const data = encoder.encode(fileJson);
  const signatureBuffer = await crypto.subtle.digest('SHA-512', data);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

  vaultFile.signature = signature;

  const finalJson = JSON.stringify(vaultFile);
  const blob = new Blob([finalJson], { type: 'application/octet-stream' });

  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
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

export async function getVaultMetadata(file: File): Promise<VaultFileFormat['metadata'] | null> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    return parsed.metadata || null;
  } catch {
    return null;
  }
}
