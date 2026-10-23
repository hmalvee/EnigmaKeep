import type { SocialRecoveryConfig } from '../crypto/socialRecovery';

export type EntryType = 'password' | 'note' | 'card' | 'totp';

export interface PasswordHistory {
  password: string;
  changedAt: number;
}

export interface PasswordEntry {
  id: string;
  type: EntryType;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category?: string;
  tags?: string[];
  favorite?: boolean;
  passwordHistory?: PasswordHistory[];
  customFields?: { [key: string]: string };
  createdAt: number;
  updatedAt: number;
  lastAccessed?: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  favorite?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TotpEntry {
  id: string;
  title: string;
  secret: string;
  issuer?: string;
  accountName?: string;
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  digits?: number;
  period?: number;
  notes?: string;
  favorite?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface StoredFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  /** Base64-encoded file bytes, encrypted at rest as part of the vault blob. */
  data: string;
  /** Parent folder id, or null when the file lives at the vault root. */
  folderId?: string | null;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface VaultFolder {
  id: string;
  name: string;
  /** Parent folder id, or null for a top-level folder. */
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface VaultData {
  version: number;
  entries: PasswordEntry[];
  notes?: Note[];
  totpEntries?: TotpEntry[];
  files?: StoredFile[];
  folders?: VaultFolder[];
  categories?: string[];
  createdAt: number;
  updatedAt: number;
  recoveryPhraseHash?: string;
  /**
   * Key derived from the recovery phrase, used to re-encrypt the recovery
   * block on every save. Only ever stored inside the encrypted vault.
   */
  recoveryEncKey?: string;
  /**
   * Secret Key (display form) required with the master password. Kept here so
   * it can be shown again and survives phrase recovery; the copy that matters
   * for security lives on the user's devices and Emergency Kit.
   */
  secretKey?: string;
  /** Delayed guardian recovery (see crypto/socialRecovery.ts). */
  socialRecovery?: SocialRecoveryConfig;
  /**
   * Decoy vault opened by a duress password. When set, this (real) vault lives
   * hidden in the file's padding region and the visible blocks hold the decoy.
   */
  decoy?: DecoyConfig;
  /** Random id assigned on first save; keys this device's rollback record. */
  vaultId?: string;
  /** Monotonic save counter and random id of the last save (rollback detection). */
  saveCount?: number;
  saveId?: string;
  lastBackup?: number;
  encryptionType?: string;
  kdfIterations?: number;
  /** Persisted lock / clipboard preferences (encrypted with the vault). */
  settings?: VaultSettings;
}

export interface DecoyConfig {
  /** The duress password, kept so the decoy can be re-keyed; only ever stored inside the encrypted real vault. */
  password: string;
  createdAt: number;
}

export interface VaultSettings {
  idleTimeout: number;
  clipboardTimeout: number;
  lockOnTabClose?: boolean;
  lockOnDeviceSleep?: boolean;
  requirePasswordEvery?: number;
  passwordRequirementInterval?: number;
  allowScreenshots?: boolean;
  autoLockOnMinimize?: boolean;
  clearClipboardOnLock?: boolean;
}

export interface VaultState {
  isLocked: boolean;
  isLoading: boolean;
  vault: VaultData | null;
  fileHandle: FileSystemFileHandle | null;
  lastActivity: number;
}

export interface DeviceFingerprint {
  id: string;
  timestamp: number;
  signature: string;
}

export interface VaultFileFormat {
  metadata: {
    recoveryPhraseHash?: string;
    version: number;
    deviceBinding?: DeviceFingerprint;
  };
  encryptedData: any;
  recoveryKeyData?: any;
  signature?: string;
}
