// SPDX-License-Identifier: MIT
/**
 * Secret Key: 128 random bits mixed into the vault encryption key alongside
 * the master password. It is kept on the user's devices (and their printed
 * Emergency Kit), never in the vault file, so a stolen file cannot be
 * brute-forced from the password alone.
 *
 * Display format: "EK1-" + base32 of (16 key bytes + 2 checksum bytes),
 * grouped in fives. The checksum catches typos before an unlock attempt.
 */

const KEY_BYTES = 16;
const CHECKSUM_BYTES = 2;
const PREFIX = 'EK1';
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const DEVICE_STORAGE_KEY = 'enigmakeep_secret_keys';
const MAX_DEVICE_KEYS = 20;

async function checksum(key: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', key);
  return new Uint8Array(digest).slice(0, CHECKSUM_BYTES);
}

export function toBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += BASE32[(value << (5 - bits)) & 31];
  }
  return out;
}

export function fromBase32(text: string): Uint8Array | null {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of text) {
    const index = BASE32.indexOf(ch);
    if (index < 0) return null;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

async function formatKey(key: Uint8Array): Promise<string> {
  const payload = new Uint8Array(KEY_BYTES + CHECKSUM_BYTES);
  payload.set(key);
  payload.set(await checksum(key), KEY_BYTES);
  const groups = toBase32(payload).match(/.{1,5}/g) || [];
  return [PREFIX, ...groups].join('-');
}

export async function generateSecretKey(): Promise<string> {
  return formatKey(crypto.getRandomValues(new Uint8Array(KEY_BYTES)));
}

/**
 * Parse a typed, pasted or scanned Secret Key. Tolerates lowercase, spaces,
 * missing dashes and the look-alikes 0/1/8 for O/I/B. Returns null when the
 * text is not a Secret Key or the checksum does not match (typo).
 */
export async function parseSecretKey(input: string): Promise<Uint8Array | null> {
  let text = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (text.startsWith(PREFIX)) {
    text = text.slice(PREFIX.length);
  }
  text = text.replace(/0/g, 'O').replace(/1/g, 'I').replace(/8/g, 'B');

  const bytes = fromBase32(text);
  if (!bytes || bytes.length !== KEY_BYTES + CHECKSUM_BYTES) return null;

  const key = bytes.slice(0, KEY_BYTES);
  const expected = await checksum(key);
  if (bytes[KEY_BYTES] !== expected[0] || bytes[KEY_BYTES + 1] !== expected[1]) {
    return null;
  }
  return key;
}

/** Canonical display form of a valid Secret Key (or null if invalid). */
export async function normalizeSecretKey(input: string): Promise<string | null> {
  const key = await parseSecretKey(input);
  return key ? formatKey(key) : null;
}

// ── Keys remembered on this device ─────────────────────────────────────────

function readDeviceKeys(): string[] {
  try {
    const raw = localStorage.getItem(DEVICE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(k => typeof k === 'string') : [];
  } catch {
    return [];
  }
}

/** Remember a Secret Key so this device only needs the master password. */
export function rememberSecretKey(formatted: string): void {
  const keys = [formatted, ...readDeviceKeys().filter(k => k !== formatted)].slice(0, MAX_DEVICE_KEYS);
  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(keys));
  } catch {
    /* storage unavailable (private mode): the key must be entered each time */
  }
}

/** All Secret Keys this device knows, as raw bytes, for trying at unlock. */
export async function getDeviceSecretKeys(): Promise<Uint8Array[]> {
  const parsed = await Promise.all(readDeviceKeys().map(parseSecretKey));
  return parsed.filter((k): k is Uint8Array => k !== null);
}
