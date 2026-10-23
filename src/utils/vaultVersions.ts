/**
 * Rollback detection for vault files, per device and without a server.
 *
 * Every save stamps the vault (inside the ciphertext, so it is authenticated)
 * with a monotonic save counter and a random save id. This module remembers
 * the newest stamp seen on this device for each vault, so that a file that is
 * older than one this device already opened, or a different file claiming the
 * same counter, is reported before it is opened.
 *
 * The record is encrypted under a key derived from the vault's own id and
 * stored among fixed-size random decoy slots, so the device reveals neither
 * which vaults were opened here nor how many.
 */

import type { VaultData } from '../types/vault';

const STORAGE_KEY = 'enigmakeep_vault_versions';
const SLOTS = 16;
const ID_HEX_CHARS = 32;
const PLAINTEXT_BYTES = 96;
const SLOT_DATA_BYTES = 12 + PLAINTEXT_BYTES + 16; // iv + padded plaintext + GCM tag
const INDEX_INFO = 'EnigmaKeep vault version index v1';
const KEY_INFO = 'EnigmaKeep vault version record v1';

export interface VersionRecord {
  saveCount: number;
  saveId: string;
  /** When this device last saw that version. */
  at: number;
}

export type VersionStatus = 'ok' | 'older' | 'diverged';

export interface VersionCheck {
  status: VersionStatus;
  /** The newest version this device had seen, when there was one. */
  record?: VersionRecord;
}

interface Slot {
  id: string;
  data: string;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(text: string): Uint8Array | null {
  try {
    const binary = atob(text);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function randomSlot(): Slot {
  return {
    id: toHex(crypto.getRandomValues(new Uint8Array(ID_HEX_CHARS / 2))),
    data: toBase64(crypto.getRandomValues(new Uint8Array(SLOT_DATA_BYTES)))
  };
}

function readSlots(): Slot[] {
  let slots: Slot[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) {
      slots = parsed.filter(
        (s): s is Slot => !!s && typeof s === 'object' && typeof (s as Slot).id === 'string' && typeof (s as Slot).data === 'string'
      );
    }
  } catch {
    slots = [];
  }
  while (slots.length < SLOTS) slots.push(randomSlot());
  return slots.slice(0, SLOTS);
}

function writeSlots(slots: Slot[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  } catch {
    /* storage unavailable: detection is best effort */
  }
}

async function slotIdentity(vaultId: string): Promise<{ id: string; key: CryptoKey }> {
  const encoder = new TextEncoder();
  const idDigest = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(INDEX_INFO + vaultId)));
  const material = await crypto.subtle.importKey('raw', encoder.encode(vaultId), 'HKDF', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: idDigest, info: encoder.encode(KEY_INFO) },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  return { id: toHex(idDigest).slice(0, ID_HEX_CHARS), key };
}

async function openRecord(slot: Slot, key: CryptoKey): Promise<VersionRecord | null> {
  const bytes = fromBase64(slot.data);
  if (!bytes || bytes.length !== SLOT_DATA_BYTES) return null;
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(0, 12) }, key, bytes.subarray(12));
    const parsed = JSON.parse(new TextDecoder().decode(plain).trim()) as Partial<VersionRecord>;
    if (typeof parsed.saveCount !== 'number' || typeof parsed.saveId !== 'string' || typeof parsed.at !== 'number') return null;
    return { saveCount: parsed.saveCount, saveId: parsed.saveId, at: parsed.at };
  } catch {
    return null;
  }
}

async function sealRecord(record: VersionRecord, key: CryptoKey): Promise<string> {
  const json = JSON.stringify(record);
  if (json.length > PLAINTEXT_BYTES) throw new Error('Version record too long');
  const plain = new TextEncoder().encode(json.padEnd(PLAINTEXT_BYTES, ' '));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
  const out = new Uint8Array(12 + cipher.length);
  out.set(iv);
  out.set(cipher, 12);
  return toBase64(out);
}

/** Pure comparison, so it can be tested without storage. */
export function compareVersion(record: VersionRecord | null, vault: VaultData): VersionStatus {
  if (!record || typeof vault.saveCount !== 'number') return 'ok';
  if (vault.saveCount < record.saveCount) return 'older';
  if (vault.saveCount === record.saveCount && vault.saveId !== record.saveId) return 'diverged';
  return 'ok';
}

/** Compare a just-decrypted vault with the newest version this device has seen. */
export async function checkVaultVersion(vault: VaultData): Promise<VersionCheck> {
  if (!vault.vaultId || typeof vault.saveCount !== 'number') return { status: 'ok' };
  try {
    const { id, key } = await slotIdentity(vault.vaultId);
    const slot = readSlots().find(s => s.id === id);
    const record = slot ? await openRecord(slot, key) : null;
    return { status: compareVersion(record, vault), record: record ?? undefined };
  } catch {
    return { status: 'ok' };
  }
}

/** Remember this vault version as the newest seen on this device (only if it is newer). */
export async function recordVaultVersion(vault: VaultData): Promise<void> {
  if (!vault.vaultId || typeof vault.saveCount !== 'number' || !vault.saveId) return;
  try {
    const { id, key } = await slotIdentity(vault.vaultId);
    const slots = readSlots();
    let index = slots.findIndex(s => s.id === id);
    if (index >= 0) {
      const existing = await openRecord(slots[index], key);
      if (existing && existing.saveCount > vault.saveCount) return;
    } else {
      // Evict a random slot: a real record of another vault may go, which only
      // costs that vault its rollback memory on this device.
      index = Math.floor((crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000) * SLOTS);
    }
    slots[index] = { id, data: await sealRecord({ saveCount: vault.saveCount, saveId: vault.saveId, at: Date.now() }, key) };
    writeSlots(slots);
  } catch {
    /* best effort */
  }
}

/** Forget what this device knows about a vault (used when a vault is deleted or re-created). */
export async function forgetVaultVersion(vaultId: string): Promise<void> {
  try {
    const { id } = await slotIdentity(vaultId);
    const slots = readSlots();
    const index = slots.findIndex(s => s.id === id);
    if (index >= 0) {
      slots[index] = randomSlot();
      writeSlots(slots);
    }
  } catch {
    /* ignore */
  }
}
