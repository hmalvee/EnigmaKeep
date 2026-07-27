import type { EncryptedBytes } from './encryption';

/**
 * Opaque vault container (v3 write path; v2 / stealth / JSON still readable).
 *
 * Design goals (what Wireshark / casual AI file analysis see):
 *  - No magic bytes, brand strings, version fields, PEM banners, or JSON keys
 *    in plaintext. On disk the file is high-entropy binary only.
 *  - No zero-width / base64 text wrapper on new saves (those patterns are
 *    fingerprintable and blow up size ~4–12×, which breaks large vaults).
 *  - Integrity is AES-GCM's authentication tag inside each ciphertext.
 *  - Block lengths are XOR-masked with the salt so the header does not look
 *    like a classic "uint32 length" structure in a hex dump.
 *
 * v3 block layout (each block):
 *   salt(32) | iv(12) | masked_len(4) | ciphertext+tag
 * masked_len = ciphertext_length XOR salt[0..3] as big-endian u32
 *
 * File = primary block [ + recovery block ]
 */

// Legacy v2 markers — read only.
const V2_MAGIC = [0xe7, 0x9a];
const V2_FORMAT_VERSION = 0x02;
const V2_FLAG_HAS_RECOVERY = 0x01;

const LEGACY_BEGIN = '-----BEGIN ENCODED BACKUP-----';
const LEGACY_END = '-----END ENCODED BACKUP-----';

const SALT_LEN = 32;
const IV_LEN = 12;
const LEN_FIELD = 4;
const BLOCK_HEADER = SALT_LEN + IV_LEN + LEN_FIELD; // 48
/** GCM tag is 16 bytes; reject absurd lengths to fail fast on random files. */
const MIN_CIPHER_LEN = 16;
const MAX_CIPHER_LEN = 512 * 1024 * 1024; // 512 MiB hard ceiling

export interface VaultContainer {
  primary: EncryptedBytes;
  recovery?: EncryptedBytes;
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) >>> 0) +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  );
}

function writeUint32BE(out: Uint8Array, offset: number, value: number): void {
  out[offset] = (value >>> 24) & 0xff;
  out[offset + 1] = (value >>> 16) & 0xff;
  out[offset + 2] = (value >>> 8) & 0xff;
  out[offset + 3] = value & 0xff;
}

function maskLength(salt: Uint8Array, length: number): number {
  const m =
    ((salt[0] << 24) >>> 0) +
    (salt[1] << 16) +
    (salt[2] << 8) +
    salt[3];
  return (length ^ m) >>> 0;
}

function blockByteLength(block: EncryptedBytes): number {
  return BLOCK_HEADER + block.data.length;
}

function writeBlock(out: Uint8Array, offset: number, block: EncryptedBytes): number {
  out.set(block.salt, offset);
  offset += SALT_LEN;
  out.set(block.iv, offset);
  offset += IV_LEN;
  writeUint32BE(out, offset, maskLength(block.salt, block.data.length));
  offset += LEN_FIELD;
  out.set(block.data, offset);
  return offset + block.data.length;
}

function readBlockV3(
  bytes: Uint8Array,
  offset: number
): { block: EncryptedBytes; next: number } | null {
  if (offset + BLOCK_HEADER > bytes.length) return null;

  const salt = bytes.subarray(offset, offset + SALT_LEN);
  const iv = bytes.subarray(offset + SALT_LEN, offset + SALT_LEN + IV_LEN);
  const masked = readUint32BE(bytes, offset + SALT_LEN + IV_LEN);
  const len = maskLength(salt, masked);

  if (len < MIN_CIPHER_LEN || len > MAX_CIPHER_LEN) return null;
  const dataStart = offset + BLOCK_HEADER;
  const dataEnd = dataStart + len;
  if (dataEnd > bytes.length) return null;

  return {
    block: {
      salt: salt.slice(),
      iv: iv.slice(),
      data: bytes.slice(dataStart, dataEnd)
    },
    next: dataEnd
  };
}

/**
 * Serialise to opaque high-entropy bytes (v3). No magic / version / flags.
 */
export function packVaultContainer(container: VaultContainer): Uint8Array {
  const hasRecovery = !!container.recovery;
  const total =
    blockByteLength(container.primary) +
    (hasRecovery ? blockByteLength(container.recovery!) : 0);

  const out = new Uint8Array(total);
  let offset = writeBlock(out, 0, container.primary);
  if (hasRecovery) {
    writeBlock(out, offset, container.recovery!);
  }
  return out;
}

/** Parse v3 opaque bytes. Returns null if the buffer is not a plausible vault. */
export function unpackVaultContainer(bytes: Uint8Array): VaultContainer | null {
  if (bytes.length < BLOCK_HEADER + MIN_CIPHER_LEN) return null;

  // Prefer v3 (no magic). Fall through to v2 if that fails.
  const v3 = unpackV3(bytes);
  if (v3) return v3;
  return unpackV2(bytes);
}

function unpackV3(bytes: Uint8Array): VaultContainer | null {
  const first = readBlockV3(bytes, 0);
  if (!first) return null;

  const container: VaultContainer = { primary: first.block };

  if (first.next === bytes.length) {
    return container;
  }

  const second = readBlockV3(bytes, first.next);
  if (!second || second.next !== bytes.length) {
    return null;
  }
  container.recovery = second.block;
  return container;
}

function readBlockV2(
  bytes: Uint8Array,
  offset: number
): { block: EncryptedBytes; next: number } | null {
  if (offset + 48 > bytes.length) return null;
  const salt = bytes.slice(offset, offset + 32);
  const iv = bytes.slice(offset + 32, offset + 44);
  const len = readUint32BE(bytes, offset + 44);
  if (len < MIN_CIPHER_LEN || len > MAX_CIPHER_LEN) return null;
  const dataStart = offset + 48;
  const dataEnd = dataStart + len;
  if (dataEnd > bytes.length) return null;
  return {
    block: { salt, iv, data: bytes.slice(dataStart, dataEnd) },
    next: dataEnd
  };
}

function unpackV2(bytes: Uint8Array): VaultContainer | null {
  if (
    bytes.length < 4 ||
    bytes[0] !== V2_MAGIC[0] ||
    bytes[1] !== V2_MAGIC[1] ||
    bytes[2] !== V2_FORMAT_VERSION
  ) {
    return null;
  }
  const flags = bytes[3];
  const primary = readBlockV2(bytes, 4);
  if (!primary) return null;
  const container: VaultContainer = { primary: primary.block };
  if (flags & V2_FLAG_HAS_RECOVERY) {
    const recovery = readBlockV2(bytes, primary.next);
    if (!recovery) return null;
    container.recovery = recovery.block;
  } else if (primary.next !== bytes.length) {
    return null;
  }
  return container;
}

// ── Legacy text wrappers (read only) ───────────────────────────────────────

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64.replace(/\s+/g, ''));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

const ZW = ['\u200b', '\u200c', '\u200d', '\u2060'] as const;
const ZW_SET = new Set<string>(ZW);
const ZW_MAGIC = '\u200b\u200c\u200d\u2060\u200b\u200c';

function decodeInvisible(text: string): Uint8Array | null {
  let filtered = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ZW_SET.has(ch)) filtered += ch;
  }
  if (!filtered.startsWith(ZW_MAGIC)) return null;
  const payload = filtered.slice(ZW_MAGIC.length);
  if (payload.length % 4 !== 0 || payload.length === 0) return null;

  const out = new Uint8Array(payload.length / 4);
  for (let i = 0, j = 0; i < payload.length; i += 4, j++) {
    const a = ZW.indexOf(payload[i] as (typeof ZW)[number]);
    const b = ZW.indexOf(payload[i + 1] as (typeof ZW)[number]);
    const c = ZW.indexOf(payload[i + 2] as (typeof ZW)[number]);
    const d = ZW.indexOf(payload[i + 3] as (typeof ZW)[number]);
    if (a < 0 || b < 0 || c < 0 || d < 0) return null;
    out[j] = (a << 6) | (b << 4) | (c << 2) | d;
  }
  return out;
}

/**
 * @deprecated New vaults write raw binary via packVaultContainer. Kept so
 * older empty-looking / base64 .txt files still unlock.
 */
export function wrapAsStealthText(container: VaultContainer): string {
  // Intentionally unused on the write path; retained for any old callers.
  const bytes = packVaultContainer(container);
  let binary = '';
  const chunk = 0x2000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as unknown as number[]
    );
  }
  return btoa(binary);
}

export function unwrapStealthText(text: string): VaultContainer | null {
  try {
    const invisible = decodeInvisible(text);
    if (invisible) {
      const container = unpackVaultContainer(invisible);
      if (container) return container;
    }
  } catch {
    /* fall through */
  }

  const begin = text.indexOf(LEGACY_BEGIN);
  const end = text.indexOf(LEGACY_END);
  const base64 =
    begin !== -1 && end !== -1 && end > begin
      ? text.slice(begin + LEGACY_BEGIN.length, end)
      : text;
  try {
    const cleaned = base64.replace(/[\u200b\u200c\u200d\u2060]/g, '');
    // Heuristic: skip obvious non-base64 (avoids throwing on binary mis-decoded as text)
    if (!/^[A-Za-z0-9+/=\s]+$/.test(cleaned.slice(0, Math.min(64, cleaned.length)))) {
      return null;
    }
    const bytes = base64ToBytes(cleaned);
    return unpackVaultContainer(bytes);
  } catch {
    return null;
  }
}

export type ParsedVaultFile =
  | { kind: 'v2'; container: VaultContainer }
  | { kind: 'legacy'; parsed: any };

/**
 * Detect and parse any supported vault file from its raw bytes.
 * Order: opaque binary (v3/v2) → stealth text → legacy JSON.
 */
export function parseVaultFile(buffer: ArrayBuffer): ParsedVaultFile | null {
  const bytes = new Uint8Array(buffer);

  const rawContainer = unpackVaultContainer(bytes);
  if (rawContainer) {
    return { kind: 'v2', container: rawContainer };
  }

  // Only attempt text decode for modest buffers — huge binary misread as UTF-8
  // is slow and pointless.
  if (bytes.length > 64 * 1024 * 1024) {
    return null;
  }

  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return null;
  }

  // Skip stealth path if the buffer is clearly binary (NUL / high control density).
  let nulCount = 0;
  const sample = Math.min(bytes.length, 4096);
  for (let i = 0; i < sample; i++) {
    if (bytes[i] === 0) nulCount++;
  }
  if (nulCount < sample * 0.01) {
    const stealth = unwrapStealthText(text);
    if (stealth) {
      return { kind: 'v2', container: stealth };
    }
  }

  try {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.includes('encryptedData')) {
      const parsed = JSON.parse(trimmed);
      if (parsed && parsed.encryptedData) {
        return { kind: 'legacy', parsed };
      }
    }
  } catch {
    /* not JSON */
  }

  return null;
}
