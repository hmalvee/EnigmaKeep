import {
  encrypt,
  decrypt,
  encryptToBytes,
  decryptFromBytes,
  type EncryptedBytes
} from '../crypto/encryption';
import {
  packVaultContainer,
  unpackVaultContainer,
  parseVaultFile,
  type VaultContainer
} from '../crypto/vaultFormat';
import { deriveRecoveryEncryptionPassword, generateRecoveryPhrase, deriveKeyFromRecoveryPhrase } from '../crypto/recoveryPhrase';
import { parseSecretKey } from '../crypto/secretKey';
import {
  buildSocialBlocks,
  openPuzzleParams,
  puzzleStart,
  openRecoveredVault,
  reconstructBestTier,
  rotatePuzzle,
  tierSeeds,
  type ParsedGuardianShare,
  type PuzzleParams
} from '../crypto/socialRecovery';
import {
  buildHiddenRegion,
  openHiddenRegion,
  randomRegion,
  regionLengthFor,
  hasHiddenCapacity,
  MIN_REGION_BYTES,
  type HiddenOpeners
} from '../crypto/hiddenVault';
import { getSessionLayout, setSessionLayout, type FileLayout } from './sessionFile';
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

function randomHex(bytes: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Mark a vault as one save newer. The counter and random id are encrypted
 * with the vault, and each device remembers the newest it has seen, which is
 * how an older file put back in place gets noticed (utils/vaultVersions.ts).
 */
export function stampSave(vault: VaultData): VaultData {
  return {
    ...vault,
    vaultId: vault.vaultId ?? randomHex(16),
    saveCount: (vault.saveCount ?? 0) + 1,
    saveId: randomHex(16)
  };
}

/**
 * Continuous rotation: give the guardian puzzle a fresh modulus before every
 * save, unless the owner turned it off. Guardian cards stay valid. A coalition
 * that solved the puzzle of one saved version can open only that version; the
 * next save needs a new solve, so what a coalition can ever read is at least
 * one delay old. Costs one RSA key generation plus a trapdoor exponentiation
 * per tier, about 35 to 65 ms.
 */
export async function prepareForSave(vault: VaultData): Promise<VaultData> {
  if (!vault.socialRecovery || vault.socialRecovery.rotateOnSave === false) return vault;
  return { ...vault, socialRecovery: await rotatePuzzle(vault.socialRecovery) };
}

let defaultRegionBytes = MIN_REGION_BYTES;

/**
 * Size of the random padding region given to files that have none yet.
 * Research scripts set 0 to reproduce the padding-free sizes of the
 * evaluated version; the application always pads.
 */
export function setDefaultRegionBytes(bytes: number): void {
  defaultRegionBytes = bytes;
}

/** Layout of a brand-new file: an (empty, to be built) visible chain and fresh random padding. */
export function defaultLayout(): FileLayout {
  return {
    kind: 'visible',
    visibleBytes: new Uint8Array(0),
    regionBytes: defaultRegionBytes > 0 ? randomRegion(defaultRegionBytes) : new Uint8Array(0)
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
 * Return a copy of `vault` carrying the key derived from its recovery phrase.
 * The key lives only inside the encrypted vault, and lets every later save
 * refresh the recovery block without the user re-entering the phrase.
 */
export async function withRecoveryKey(vault: VaultData, recoveryPhrase: string): Promise<VaultData> {
  return {
    ...vault,
    recoveryEncKey: await deriveRecoveryEncryptionPassword(recoveryPhrase)
  };
}

/**
 * Build the opaque, authenticated container for a vault. When the vault
 * carries its recovery key, the recovery block is re-encrypted from the
 * current contents on every save, so it never goes stale. Vaults from before
 * `recoveryEncKey` existed fall back to re-embedding their old recovery block
 * until the phrase is entered once (recovery or regeneration).
 */
async function buildContainer(
  vault: VaultData,
  password: string,
  existingRecovery?: EncryptedBytes
): Promise<VaultContainer> {
  const vaultJson = JSON.stringify(vault);
  let secretKey: Uint8Array | undefined;
  if (vault.secretKey) {
    const parsed = await parseSecretKey(vault.secretKey);
    if (!parsed) {
      throw new Error('Vault Secret Key is corrupted');
    }
    secretKey = parsed;
  }
  // The password copy needs password + Secret Key. The recovery copy is
  // phrase-only on purpose: it is the way back in when either is lost.
  const primary = await encryptToBytes(vaultJson, password, secretKey);

  const container: VaultContainer = { primary };

  if (vault.recoveryEncKey) {
    container.recovery = await encryptToBytes(vaultJson, vault.recoveryEncKey);
  } else if (existingRecovery) {
    container.recovery = existingRecovery;
  }

  // Guardian recovery: puzzle parameters + a living copy refreshed on every save.
  if (vault.socialRecovery && container.recovery) {
    container.extra = await buildSocialBlocks(vault.socialRecovery, vaultJson);
  }

  return container;
}

async function hiddenOpeners(vault: VaultData, password: string): Promise<HiddenOpeners> {
  const secretKey = vault.secretKey ? (await parseSecretKey(vault.secretKey)) ?? undefined : undefined;
  return {
    password,
    secretKey,
    recoveryEncKey: vault.recoveryEncKey,
    guardianSeeds: vault.socialRecovery ? tierSeeds(vault.socialRecovery) : []
  };
}

export interface EncryptedVaultFile {
  blob: Blob;
  bytes: Uint8Array;
  /** The layout after this write, to keep as the session layout. */
  layout: FileLayout;
}

/**
 * Encrypt a vault into a complete file for the given layout. A visible
 * session rewrites the block chain and copies the region; a hidden session
 * copies the visible chain (the decoy) and seals its own chain into a new
 * region. Files without a region get one, so every file looks the same.
 */
export async function encryptVaultWithLayout(
  vault: VaultData,
  password: string,
  layout: FileLayout,
  existingRecovery?: EncryptedBytes
): Promise<EncryptedVaultFile> {
  const container = await buildContainer(vault, password, existingRecovery);
  const chain = packVaultContainer(container);
  let visible: Uint8Array;
  let region: Uint8Array;
  if (layout.kind === 'hidden') {
    if (layout.visibleBytes.length === 0) {
      throw new Error('A hidden vault needs a visible decoy');
    }
    visible = layout.visibleBytes;
    region = await buildHiddenRegion(
      chain,
      await hiddenOpeners(vault, password),
      regionLengthFor(chain.length, layout.regionBytes.length)
    );
  } else {
    visible = chain;
    region = layout.regionBytes.length > 0 ? layout.regionBytes : defaultLayout().regionBytes;
  }
  const bytes = new Uint8Array(visible.length + region.length);
  bytes.set(visible);
  bytes.set(region, visible.length);
  return {
    blob: new Blob([bytes], { type: 'application/octet-stream' }),
    bytes,
    layout: { kind: layout.kind, visibleBytes: visible, regionBytes: region }
  };
}

/**
 * Encrypt a vault to an opaque binary .dat blob using the open session's
 * layout (or a fresh one). High-entropy bytes only: no magic, banners, JSON
 * or text wrappers, so packet captures and naive file scans see random data.
 */
export async function encryptVault(
  vault: VaultData,
  password: string,
  existingRecovery?: EncryptedBytes
): Promise<Blob> {
  return (await encryptVaultWithLayout(vault, password, getSessionLayout() ?? defaultLayout(), existingRecovery)).blob;
}

async function decryptContainer(
  container: VaultContainer,
  password: string,
  useRecoveryKey: boolean,
  secretKeys: Uint8Array[]
): Promise<VaultData> {
  const block = useRecoveryKey && container.recovery ? container.recovery : container.primary;
  if (!block) {
    throw new Error('Recovery data not available in this vault');
  }

  const decryptedJson = useRecoveryKey
    ? await decryptWithRecoveryPhrase(block, password)
    : await decryptFromBytes(block, password, secretKeys);

  const vault: VaultData = JSON.parse(decryptedJson);
  if (!vault.version || !Array.isArray(vault.entries)) {
    throw new Error('Invalid vault format');
  }
  return vault;
}

export type VaultOpener =
  | { kind: 'password'; password: string; secretKeys?: Uint8Array[] }
  | { kind: 'phrase'; phrase: string };

export interface OpenedVault {
  vault: VaultData;
  /** Where in the file this vault lives; keep as the session layout so saves preserve the rest. */
  layout: FileLayout;
  /** The container that opened (absent for legacy JSON files). */
  container?: VaultContainer;
}

async function decryptLegacy(parsed: any, opener: VaultOpener): Promise<VaultData> {
  // Backward compatibility with the original v1 JSON files.
  const usePhrase = opener.kind === 'phrase';
  const source = usePhrase && parsed.recoveryKeyData ? parsed.recoveryKeyData : parsed.encryptedData;
  let decryptedJson: string;
  if (usePhrase) {
    try {
      decryptedJson = await decrypt(source, await deriveRecoveryEncryptionPassword(opener.phrase));
    } catch {
      decryptedJson = await decrypt(source, opener.phrase);
    }
  } else {
    decryptedJson = await decrypt(source, opener.password);
  }
  const vault: VaultData = JSON.parse(decryptedJson);
  if (!vault.version || !Array.isArray(vault.entries)) {
    throw new Error('Invalid vault format');
  }
  return vault;
}

/**
 * Open a vault file with a password (plus Secret Key candidates) or a
 * recovery phrase. The visible chain is tried first; if it does not open,
 * the padding region is tried for a hidden vault. A wrong secret and a
 * missing hidden vault fail the same way.
 */
export async function openVaultFile(file: Blob, opener: VaultOpener): Promise<OpenedVault> {
  const buffer = await file.arrayBuffer();
  const parsed = parseVaultFile(buffer);
  if (!parsed) {
    throw new Error('Unrecognised or corrupted vault file');
  }
  if (parsed.kind === 'legacy') {
    return {
      vault: await decryptLegacy(parsed.parsed, opener),
      layout: { kind: 'visible', visibleBytes: new Uint8Array(0), regionBytes: new Uint8Array(0) }
    };
  }

  const usePhrase = opener.kind === 'phrase';
  const secret = usePhrase ? opener.phrase : opener.password;
  const secretKeys = opener.kind === 'password' ? opener.secretKeys ?? [] : [];
  let visibleError: unknown;
  try {
    const vault = await decryptContainer(parsed.container, secret, usePhrase, secretKeys);
    return {
      vault,
      layout: { kind: 'visible', visibleBytes: parsed.visibleBytes, regionBytes: parsed.region },
      container: parsed.container
    };
  } catch (err) {
    visibleError = err;
  }

  const hidden = await openHiddenRegion(
    parsed.region,
    usePhrase ? { kind: 'phrase', phrase: secret } : { kind: 'password', password: secret, secretKeys }
  );
  if (!hidden) throw visibleError;
  const vault = await decryptContainer(hidden.container, secret, usePhrase, secretKeys);
  return {
    vault,
    layout: { kind: 'hidden', visibleBytes: parsed.visibleBytes, regionBytes: parsed.region },
    container: hidden.container
  };
}

export async function decryptVault(
  blob: Blob,
  password: string,
  useRecoveryKey: boolean = false,
  secretKeys: Uint8Array[] = []
): Promise<VaultData> {
  const opener: VaultOpener = useRecoveryKey ? { kind: 'phrase', phrase: password } : { kind: 'password', password, secretKeys };
  return (await openVaultFile(blob, opener)).vault;
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
  existingRecoveryData?: EncryptedBytes
): Promise<VaultData> {
  const updatedVault = {
    ...vault,
    lastBackup: Date.now(),
    updatedAt: Date.now()
  };

  const layout = getSessionLayout() ?? defaultLayout();
  const encrypted = await encryptVaultWithLayout(updatedVault, password, layout, existingRecoveryData);

  // Snapshot first so a failed write still leaves a recoverable copy.
  await saveVaultSnapshot(fileHandle.name, await encrypted.blob.arrayBuffer());

  const writable = await fileHandle.createWritable();
  await writable.write(encrypted.blob);
  await writable.close();

  const written = await fileHandle.getFile();
  if (!(await verifyVaultFile(written))) {
    throw new Error(
      'Vault file failed verification after saving. A local backup was kept — unlock from backup and Save to a new file.'
    );
  }
  setSessionLayout(encrypted.layout);
  return updatedVault;
}

/** `secretKeys`: candidate Secret Keys (remembered on this device or just entered). */
export async function loadVaultFromFile(
  file: File,
  password: string,
  secretKeys: Uint8Array[] = []
): Promise<VaultData> {
  return await decryptVault(file, password, false, secretKeys);
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

// ── Guardian recovery ──────────────────────────────────────────────────────

export interface GuardianRecoveryStart {
  secret: Uint8Array;
  params: PuzzleParams;
  /** Puzzle starting value; t sequential squarings from here give the answer. */
  start: bigint;
  /** Which tier of the delay schedule these cards unlocked (0 = slowest). */
  tier: number;
  /** How many cards were presented. */
  cards: number;
  /** The guardian blocks the shares opened (visible chain or hidden vault). */
  blocks: EncryptedBytes[];
  /** Where the recovered vault lives, so the rewrite keeps the rest of the file. */
  layout: FileLayout;
}

/**
 * Combine guardian shares for the fastest tier they unlock and check them
 * against the vault file before any sequential work starts. The visible
 * chain is tried first, then the padding region for a hidden vault. Throws
 * if the shares are wrong or insufficient.
 */
export async function beginGuardianRecovery(
  file: Blob,
  shares: ParsedGuardianShare[]
): Promise<GuardianRecoveryStart> {
  const { secret, tier } = reconstructBestTier(shares);
  const parsed = parseVaultFile(await file.arrayBuffer());
  if (!parsed || parsed.kind !== 'v2') {
    throw new Error('Unrecognised or corrupted vault file');
  }

  const visibleBlocks = parsed.container.extra || [];
  let blocks = visibleBlocks;
  let layout: FileLayout = { kind: 'visible', visibleBytes: parsed.visibleBytes, regionBytes: parsed.region };
  let opened = visibleBlocks.length > 0 ? await openPuzzleParams(visibleBlocks, secret) : null;
  if (!opened) {
    const hidden = await openHiddenRegion(parsed.region, { kind: 'seed', seed: secret, tier });
    if (hidden && hidden.container.extra && hidden.container.extra.length > 0) {
      opened = await openPuzzleParams(hidden.container.extra, secret);
      if (opened) {
        blocks = hidden.container.extra;
        layout = { kind: 'hidden', visibleBytes: parsed.visibleBytes, regionBytes: parsed.region };
      }
    }
  }
  if (!opened) {
    throw new Error(
      visibleBlocks.length === 0 && !hasHiddenCapacity(parsed.region)
        ? 'This vault file has no guardian recovery set up'
        : 'These guardian shares do not unlock this vault file'
    );
  }
  return {
    secret,
    params: opened.params,
    start: await puzzleStart(secret, opened.params),
    tier,
    cards: shares.length,
    blocks,
    layout
  };
}

/** Open the living recovery copy with the solved puzzle answer. */
export async function finishGuardianRecovery(
  _file: Blob,
  recovery: GuardianRecoveryStart,
  answer: bigint
): Promise<VaultData> {
  const json = await openRecoveredVault(recovery.blocks, recovery.secret, recovery.params, answer);
  const vault: VaultData = JSON.parse(json);
  if (!vault.version || !Array.isArray(vault.entries)) {
    throw new Error('Invalid vault format');
  }
  // The guardian secret has now been reconstructed; a new setup is required.
  delete vault.socialRecovery;
  return vault;
}


// ── Decoy vault (duress password) ──────────────────────────────────────────

export interface DecoySetup {
  /** The real vault, now carrying its decoy configuration. */
  vault: VaultData;
  /** Hidden layout to save it with: the decoy becomes the visible chain. */
  layout: FileLayout;
  /** The decoy's own recovery phrase, shown once. */
  decoyPhrase: string;
}

/**
 * Create a decoy vault that the duress password opens. The real vault moves
 * into the file's padding region on the next save. `entries` are copied into
 * the decoy with fresh ids; the decoy gets its own recovery phrase so that it
 * looks like any other vault.
 */
export async function createDecoyVault(
  realVault: VaultData,
  realPassword: string,
  duressPassword: string,
  entries: PasswordEntry[]
): Promise<DecoySetup> {
  if (!realVault.recoveryEncKey) {
    throw new Error('Set up a recovery phrase before creating a decoy vault');
  }
  if (duressPassword === realPassword) {
    throw new Error('The duress password must differ from your master password');
  }
  const phrase = generateRecoveryPhrase();
  const now = Date.now();
  const decoy = stampSave(
    await withRecoveryKey(
      {
        ...(await createNewVault(await deriveKeyFromRecoveryPhrase(phrase))),
        settings: realVault.settings,
        secretKey: realVault.secretKey,
        entries: entries.map(e => ({ ...e, id: crypto.randomUUID(), createdAt: now, updatedAt: now }))
      },
      phrase
    )
  );
  const chain = packVaultContainer(await buildContainer(decoy, duressPassword));
  const current = getSessionLayout();
  return {
    vault: { ...realVault, decoy: { password: duressPassword, createdAt: now } },
    layout: { kind: 'hidden', visibleBytes: chain, regionBytes: current?.regionBytes ?? new Uint8Array(0) },
    decoyPhrase: phrase
  };
}

/** Bring the real vault back into the visible chain; the decoy is discarded and the region re-randomised. */
export function removeDecoyVault(realVault: VaultData): { vault: VaultData; layout: FileLayout } {
  const current = getSessionLayout();
  const vault = { ...realVault };
  delete vault.decoy;
  return {
    vault,
    layout: {
      kind: 'visible',
      visibleBytes: new Uint8Array(0),
      regionBytes: randomRegion(Math.max(current?.regionBytes.length ?? 0, MIN_REGION_BYTES))
    }
  };
}

/** Re-key the visible decoy under a new duress password; its content and recovery block are kept. */
export async function changeDuressPassword(
  layout: FileLayout,
  oldPassword: string,
  newPassword: string,
  secretKeys: Uint8Array[]
): Promise<FileLayout> {
  if (layout.kind !== 'hidden') throw new Error('No decoy vault in this file');
  const container = unpackVaultContainer(layout.visibleBytes);
  if (!container) throw new Error('The decoy vault could not be read');
  const json = await decryptFromBytes(container.primary, oldPassword, secretKeys);
  const decoy: VaultData = JSON.parse(json);
  const secretKey = decoy.secretKey ? (await parseSecretKey(decoy.secretKey)) ?? undefined : undefined;
  const primary = await encryptToBytes(json, newPassword, secretKey);
  return { ...layout, visibleBytes: packVaultContainer({ ...container, primary }) };
}
