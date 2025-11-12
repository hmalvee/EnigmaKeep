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

export interface VaultData {
  version: number;
  entries: PasswordEntry[];
  notes?: Note[];
  totpEntries?: TotpEntry[];
  categories?: string[];
  createdAt: number;
  updatedAt: number;
  recoveryPhraseHash?: string;
  lastBackup?: number;
  encryptionType?: string;
  kdfIterations?: number;
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
