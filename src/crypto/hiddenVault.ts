// SPDX-License-Identifier: MIT
/**
 * Hidden vault inside the file's padding region (plausible deniability).
 *
 * Every vault file is `visible block chain || region`, where the region is
 * random padding of at least MIN_REGION_BYTES. With a decoy configured, the
 * visible chain is the decoy vault (opened by the duress password) and the
 * real vault is sealed inside the region:
 *
 *   blob    = iv || AES-GCM_K(chain)          at a random offset in the region
 *   trailer = six fixed-size wrap slots at the end of the region, each
 *             AEAD(K || iv || offsetFromEnd || blobLength) under one opener:
 *             slot 0 master password + Secret Key, slot 1 recovery phrase,
 *             slots 2..5 guardian tiers; unused slots stay random
 *
 * `chain` is an ordinary vault container (primary, recovery and guardian
 * blocks), so every existing recovery path works on a hidden vault once its
 * slot opens. Without a key the region is indistinguishable from random,
 * and a file without a decoy has the same layout with a fully random region,
 * so holding the file (or the duress password) proves nothing about whether
 * a hidden vault exists. What it does not hide: several versions of the same
 * file over time, where the region changes only when the hidden vault is
 * saved.
 */

import { encryptBytesToBytes, decryptBytesFromBytes, type EncryptedBytes } from './encryption';
import { deriveRecoveryEncryptionPassword } from './recoveryPhrase';
import { unpackVaultContainer, regionStartLooksLikeBlock, BLOCK_HEADER_BYTES, type VaultContainer } from './vaultFormat';

const SALT_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;
/** key || iv || offsetFromEnd (u32) || blobLength (u32) */
const WRAP_PLAIN_BYTES = KEY_BYTES + IV_BYTES + 4 + 4;
export const WRAP_SLOT_BYTES = SALT_BYTES + IV_BYTES + WRAP_PLAIN_BYTES + TAG_BYTES; // 112
export const WRAP_SLOTS = 6;
export const TRAILER_BYTES = WRAP_SLOTS * WRAP_SLOT_BYTES; // 672
export const MAX_GUARDIAN_SLOTS = WRAP_SLOTS - 2;
export const MIN_REGION_BYTES = 1 << 20;
const REGION_CLASSES = [1, 4, 16, 64, 256].map(mb => mb << 20);
const REGION_STEP = 64 << 20;
const MARGIN_BYTES = 64 << 10;
/** The blob never starts in the first block header's worth of bytes, which the writer re-randomises. */
const MIN_BLOB_OFFSET = BLOCK_HEADER_BYTES;
const SEED_WRAP_INFO = 'EnigmaKeep hidden vault wrap v1';

export function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  for (let offset = 0; offset < length; offset += 65536) {
    crypto.getRandomValues(out.subarray(offset, Math.min(offset + 65536, length)));
  }
  return out;
}

function randomBelow(max: number): number {
  if (max <= 1) return 0;
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
}

/**
 * Smallest size class that fits a hidden chain of `chainLength` bytes, never
 * shrinking below the region the file already has.
 */
export function regionLengthFor(chainLength: number, currentRegionLength = 0): number {
  const needed = chainLength + IV_BYTES + TAG_BYTES + TRAILER_BYTES + MIN_BLOB_OFFSET + MARGIN_BYTES;
  const size = REGION_CLASSES.find(c => c >= needed) ?? Math.ceil(needed / REGION_STEP) * REGION_STEP;
  return Math.max(size, currentRegionLength);
}

/** Make sure the region cannot be mistaken for more vault blocks. */
function avoidBlockHeader(region: Uint8Array): void {
  if (region.length < BLOCK_HEADER_BYTES) return;
  for (let attempt = 0; attempt < 64 && regionStartLooksLikeBlock(region); attempt++) {
    crypto.getRandomValues(region.subarray(0, BLOCK_HEADER_BYTES));
  }
  if (regionStartLooksLikeBlock(region)) throw new Error('Could not generate padding');
}

/** A fully random region (no hidden vault). */
export function randomRegion(length = MIN_REGION_BYTES): Uint8Array {
  const region = randomBytes(length);
  avoidBlockHeader(region);
  return region;
}

export function hasHiddenCapacity(region: Uint8Array): boolean {
  return region.length >= TRAILER_BYTES + MIN_BLOB_OFFSET + IV_BYTES + TAG_BYTES;
}

export interface HiddenOpeners {
  password: string;
  secretKey?: Uint8Array;
  /** Derived recovery key (VaultData.recoveryEncKey); without it the phrase cannot find the hidden vault. */
  recoveryEncKey?: string;
  /** One seed per guardian tier, ascending threshold. */
  guardianSeeds?: Uint8Array[];
}

function serialiseSlot(enc: EncryptedBytes): Uint8Array {
  const out = new Uint8Array(SALT_BYTES + IV_BYTES + enc.data.length);
  out.set(enc.salt);
  out.set(enc.iv, SALT_BYTES);
  out.set(enc.data, SALT_BYTES + IV_BYTES);
  if (out.length !== WRAP_SLOT_BYTES) throw new Error('Unexpected wrap size');
  return out;
}

function readSlot(region: Uint8Array, index: number): EncryptedBytes {
  const start = region.length - TRAILER_BYTES + index * WRAP_SLOT_BYTES;
  return {
    salt: region.slice(start, start + SALT_BYTES),
    iv: region.slice(start + SALT_BYTES, start + SALT_BYTES + IV_BYTES),
    data: region.slice(start + SALT_BYTES + IV_BYTES, start + WRAP_SLOT_BYTES)
  };
}

async function seedKey(seed: Uint8Array, salt: Uint8Array, usage: KeyUsage): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', seed, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info: new TextEncoder().encode(SEED_WRAP_INFO) },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    [usage]
  );
}

async function sealWithSeed(seed: Uint8Array, plain: Uint8Array): Promise<EncryptedBytes> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await seedKey(seed, salt, 'encrypt');
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);
  return { salt, iv, data: new Uint8Array(data) };
}

async function openWithSeed(seed: Uint8Array, enc: EncryptedBytes): Promise<Uint8Array> {
  const key = await seedKey(seed, enc.salt, 'decrypt');
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: enc.iv }, key, enc.data));
}

/**
 * Seal `chain` (a packed vault container) into a fresh random region of
 * `regionLength` bytes that every opener in `openers` can find.
 */
export async function buildHiddenRegion(
  chain: Uint8Array,
  openers: HiddenOpeners,
  regionLength: number
): Promise<Uint8Array> {
  if (regionLength < regionLengthFor(chain.length)) {
    throw new Error('Padding region too small for the hidden vault');
  }
  const key = randomBytes(KEY_BYTES);
  const iv = randomBytes(IV_BYTES);
  const aesKey = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt']);
  const blob = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, chain));

  const region = randomBytes(regionLength);
  const maxOffset = regionLength - TRAILER_BYTES - blob.length;
  const offset = MIN_BLOB_OFFSET + randomBelow(maxOffset - MIN_BLOB_OFFSET + 1);
  region.set(blob, offset);

  const plain = new Uint8Array(WRAP_PLAIN_BYTES);
  plain.set(key);
  plain.set(iv, KEY_BYTES);
  const view = new DataView(plain.buffer);
  view.setUint32(KEY_BYTES + IV_BYTES, regionLength - offset);
  view.setUint32(KEY_BYTES + IV_BYTES + 4, blob.length);

  const trailerStart = regionLength - TRAILER_BYTES;
  const put = (index: number, enc: EncryptedBytes) => region.set(serialiseSlot(enc), trailerStart + index * WRAP_SLOT_BYTES);
  put(0, await encryptBytesToBytes(plain, openers.password, openers.secretKey));
  if (openers.recoveryEncKey) put(1, await encryptBytesToBytes(plain, openers.recoveryEncKey));
  const seeds = (openers.guardianSeeds || []).slice(0, MAX_GUARDIAN_SLOTS);
  for (let j = 0; j < seeds.length; j++) put(2 + j, await sealWithSeed(seeds[j], plain));

  plain.fill(0);
  key.fill(0);
  avoidBlockHeader(region);
  return region;
}

export type HiddenOpener =
  | { kind: 'password'; password: string; secretKeys: Uint8Array[] }
  | { kind: 'phrase'; phrase: string }
  | { kind: 'seed'; seed: Uint8Array; tier: number };

export interface HiddenVault {
  container: VaultContainer;
  chain: Uint8Array;
}

/**
 * Try to open the hidden vault in `region` with one opener. Returns null when
 * the opener is wrong or there is no hidden vault; the two cases are
 * deliberately not distinguishable.
 */
export async function openHiddenRegion(region: Uint8Array, opener: HiddenOpener): Promise<HiddenVault | null> {
  if (!hasHiddenCapacity(region)) return null;
  let plain: Uint8Array;
  try {
    if (opener.kind === 'password') {
      plain = await decryptBytesFromBytes(readSlot(region, 0), opener.password, opener.secretKeys);
    } else if (opener.kind === 'phrase') {
      plain = await decryptBytesFromBytes(readSlot(region, 1), await deriveRecoveryEncryptionPassword(opener.phrase));
    } else {
      if (opener.tier < 0 || opener.tier >= MAX_GUARDIAN_SLOTS) return null;
      plain = await openWithSeed(opener.seed, readSlot(region, 2 + opener.tier));
    }
  } catch {
    return null;
  }
  if (plain.length !== WRAP_PLAIN_BYTES) return null;

  const view = new DataView(plain.buffer, plain.byteOffset, plain.byteLength);
  const offsetFromEnd = view.getUint32(KEY_BYTES + IV_BYTES);
  const blobLength = view.getUint32(KEY_BYTES + IV_BYTES + 4);
  const start = region.length - offsetFromEnd;
  if (blobLength <= TAG_BYTES || start < 0 || start + blobLength > region.length - TRAILER_BYTES) return null;

  try {
    const aesKey = await crypto.subtle.importKey('raw', plain.subarray(0, KEY_BYTES), 'AES-GCM', false, ['decrypt']);
    const chain = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: plain.subarray(KEY_BYTES, KEY_BYTES + IV_BYTES) },
        aesKey,
        region.subarray(start, start + blobLength)
      )
    );
    const container = unpackVaultContainer(chain);
    return container ? { container, chain } : null;
  } catch {
    return null;
  } finally {
    plain.fill(0);
  }
}
