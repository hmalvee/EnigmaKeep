// SPDX-License-Identifier: MIT
/**
 * Delayed guardian recovery without a server, with a graded delay.
 *
 * The owner chooses a schedule of tiers (t_1, D_1), …, (t_k, D_k) with
 * t_1 < t_2 < … and D_1 > D_2 > …: the more guardians cooperate, the shorter
 * the wait. Each tier j has its own independent seed S_j, Shamir-shared with
 * threshold t_j among the same n guardians, so a coalition of c guardians
 * reconstructs exactly the seeds of the tiers with t_j <= c and nothing about
 * the others.
 *
 * Setup (owner, instant):
 *   N  <- fresh RSA modulus (trapdoor phi(N) used once, then discarded)
 *   for each tier j:
 *     S_j <- 32 random bytes;  shares_j <- Shamir(S_j, t_j of n)
 *     a_j =  Start(S_j, N)                  // only computable from S_j
 *     b_j =  a_j^(2^{T_j}) mod N via phi(N) // T_j calibrated to D_j
 *   guardian i's card = (share_{1,i}, …, share_{k,i})
 *   on every save, with a fresh random data key K:
 *     P_j = AEAD_{HKDF(S_j)}(N, T_j, j, schedule, AEAD_{HKDF(S_j || b_j)}(K))
 *     D   = AEAD_K(current vault)           // one living recovery copy
 *
 * Recovery (c guardians + the vault file):
 *   pick the fastest tier j with t_j <= c; S_j = Combine(shares_j);
 *   open P_j (proves the shares are right); a_j = Start(S_j, N);
 *   b_j = T_j sequential squarings; unwrap K; open D.
 *
 * Because every a_j depends on S_j, no sequential work can start before a
 * quorum of that tier has combined its shares: the delay is measured from
 * reconstruction, and a smaller coalition cannot borrow a larger coalition's
 * shorter puzzle. The owner keeps the seeds and answers inside the encrypted
 * vault so every save refreshes D, and can rotate N (veto / re-key) without
 * new shares. A single-tier schedule is the original protocol.
 */

import type { EncryptedBytes } from './encryption';
import { splitSecret, combineShares, type Share } from './shamir';
import { toBase32, fromBase32 } from './secretKey';
import {
  generateModulus,
  deriveStart,
  solveWithTrapdoor,
  bytesToBigInt,
  bigIntToBytes
} from './timelock';

export const SECRET_BYTES = 32;
export const MAX_TIERS = 4;
const SET_ID_BYTES = 8;
const SHARE_VERSION_V1 = 1;
const SHARE_VERSION_V2 = 2;
const SHARE_PREFIX_V1 = 'EKG1';
const SHARE_PREFIX_V2 = 'EKG2';
const CHECKSUM_BYTES = 2;
const DATA_KEY_BYTES = 32;
const PARAMS_INFO = 'EnigmaKeep guardian recovery params v1';
const DATA_INFO = 'EnigmaKeep guardian recovery data v1';
const DATA_KEY_INFO = 'EnigmaKeep guardian recovery data key v2';
const WRAP_INFO = 'EnigmaKeep guardian recovery key wrap v2';

export interface GuardianInfo {
  index: number;
  label: string;
}

/** One rung of the delay schedule. Stored inside the encrypted vault. */
export interface DelayTier {
  /** Guardians needed to unlock this tier. */
  threshold: number;
  delaySeconds: number;
  squarings: number;
  /** S_j, base64 */
  secret: string;
  /** b_j = a_j^(2^T_j) mod N, hex (computed by the owner via the trapdoor) */
  answer: string;
}

/** Stored inside the encrypted vault (never in plaintext). */
export interface SocialRecoveryConfig {
  setId: string;
  /** S of the base tier (same as tiers[0].secret), base64 */
  secret: string;
  /** Threshold of the base tier (same as tiers[0].threshold) */
  threshold: number;
  guardians: GuardianInfo[];
  /** N, hex, shared by every tier */
  modulus: string;
  /** Base tier values, mirrored from tiers[0] for older code paths */
  squarings: number;
  answer: string;
  delaySeconds: number;
  assumedSquaringsPerSecond: number;
  epoch: number;
  createdAt: number;
  /** Delay schedule, ascending threshold. Absent on configs from before graded delay. */
  tiers?: DelayTier[];
  /**
   * Replace the puzzle on every save (default). A coalition then never reads
   * a version younger than the delay, however long it has been working:
   * finishing one puzzle only opens the file it was taken from.
   */
  rotateOnSave?: boolean;
}

export interface ScheduleEntry {
  threshold: number;
  delaySeconds: number;
}

/** Plaintext of a tier's parameter block (only readable with that tier's seed). */
export interface PuzzleParams {
  setId: string;
  modulus: string;
  squarings: number;
  delaySeconds: number;
  assumedSquaringsPerSecond: number;
  epoch: number;
  /** Index of this tier in the schedule (0 on files from before graded delay). */
  tier?: number;
  threshold?: number;
  /** The whole schedule, so the requester can see what more cards would buy. */
  schedule?: ScheduleEntry[];
  /** AEAD_{HKDF(S_j || b_j)}(K): salt || iv || ciphertext, hex. Absent on old files. */
  dataKeyWrap?: string;
}

export interface ParsedGuardianShare {
  setId: string;
  /** Guardian index (x-coordinate), the same in every tier. */
  index: number;
  /** One share component per tier, ascending threshold. */
  tiers: { threshold: number; share: Share }[];
  /** Base tier, mirrored from tiers[0]. */
  threshold: number;
  share: Share;
}

// ── encoding helpers ──────────────────────────────────────────────────────

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(text: string): Uint8Array {
  const binary = atob(text);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function modulusByteLength(modulus: bigint): number {
  return Math.ceil(modulus.toString(16).length / 2);
}

async function checksum(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)).slice(0, CHECKSUM_BYTES);
}

/** The schedule as a list of tiers, for configs with or without `tiers`. */
export function configTiers(config: SocialRecoveryConfig): DelayTier[] {
  if (config.tiers && config.tiers.length > 0) return config.tiers;
  return [{
    threshold: config.threshold,
    delaySeconds: config.delaySeconds,
    squarings: config.squarings,
    secret: config.secret,
    answer: config.answer
  }];
}

/** Raw seeds of every tier, for sealing data that each tier's quorum may open. */
export function tierSeeds(config: SocialRecoveryConfig): Uint8Array[] {
  return configTiers(config).map(t => fromBase64(t.secret));
}

export function configSchedule(config: SocialRecoveryConfig): ScheduleEntry[] {
  return configTiers(config).map(t => ({ threshold: t.threshold, delaySeconds: t.delaySeconds }));
}

/** Check a schedule: thresholds strictly rising, delays strictly falling. */
export function validateSchedule(schedule: ScheduleEntry[], guardians: number): string | null {
  if (schedule.length === 0) return 'Choose at least one tier';
  if (schedule.length > MAX_TIERS) return `At most ${MAX_TIERS} tiers`;
  for (let i = 0; i < schedule.length; i++) {
    const { threshold, delaySeconds } = schedule[i];
    if (!Number.isInteger(threshold) || threshold < 2 || threshold > guardians) {
      return `Each tier needs between 2 and ${guardians} guardians`;
    }
    if (!(delaySeconds > 0)) return 'Each tier needs a positive delay';
    if (i > 0) {
      if (threshold <= schedule[i - 1].threshold) return 'Each tier must need more guardians than the one before';
      if (delaySeconds >= schedule[i - 1].delaySeconds) return 'Each tier must have a shorter delay than the one before';
    }
  }
  return null;
}

// ── guardian shares ───────────────────────────────────────────────────────

/**
 * Text form printed under each guardian's QR code. One tier gives the
 * original "EKG1-…" card; a schedule gives an "EKG2-…" card that carries one
 * share component per tier.
 */
export async function encodeGuardianShare(
  setId: string,
  threshold: number,
  share: Share,
  moreTiers: { threshold: number; share: Share }[] = []
): Promise<string> {
  const tiers = [{ threshold, share }, ...moreTiers];
  let body: Uint8Array;
  let prefix: string;
  if (tiers.length === 1) {
    body = new Uint8Array(1 + SET_ID_BYTES + 2 + share.data.length);
    body[0] = SHARE_VERSION_V1;
    body.set(fromHex(setId), 1);
    body[1 + SET_ID_BYTES] = threshold;
    body[2 + SET_ID_BYTES] = share.index;
    body.set(share.data, 3 + SET_ID_BYTES);
    prefix = SHARE_PREFIX_V1;
  } else {
    if (tiers.some(t => t.share.index !== share.index)) {
      throw new Error('All tiers of one card must carry the same guardian index');
    }
    body = new Uint8Array(1 + SET_ID_BYTES + 2 + tiers.length * (1 + SECRET_BYTES));
    body[0] = SHARE_VERSION_V2;
    body.set(fromHex(setId), 1);
    body[1 + SET_ID_BYTES] = tiers.length;
    body[2 + SET_ID_BYTES] = share.index;
    let offset = 3 + SET_ID_BYTES;
    for (const tier of tiers) {
      body[offset++] = tier.threshold;
      body.set(tier.share.data, offset);
      offset += SECRET_BYTES;
    }
    prefix = SHARE_PREFIX_V2;
  }
  const payload = new Uint8Array(body.length + CHECKSUM_BYTES);
  payload.set(body);
  payload.set(await checksum(body), body.length);
  const groups = toBase32(payload).match(/.{1,5}/g) || [];
  return [prefix, ...groups].join('-');
}

/** Parse a typed or scanned guardian share (either card version); null on typo or wrong format. */
export async function parseGuardianShare(input: string): Promise<ParsedGuardianShare | null> {
  let text = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (text.startsWith(SHARE_PREFIX_V1)) text = text.slice(SHARE_PREFIX_V1.length);
  else if (text.startsWith(SHARE_PREFIX_V2)) text = text.slice(SHARE_PREFIX_V2.length);
  text = text.replace(/0/g, 'O').replace(/1/g, 'I').replace(/8/g, 'B');
  const bytes = fromBase32(text);
  if (!bytes || bytes.length < 1 + SET_ID_BYTES + 2 + SECRET_BYTES + CHECKSUM_BYTES) return null;
  const version = bytes[0];
  let bodyLength: number;
  if (version === SHARE_VERSION_V1) {
    bodyLength = 1 + SET_ID_BYTES + 2 + SECRET_BYTES;
  } else if (version === SHARE_VERSION_V2) {
    const tierCount = bytes[1 + SET_ID_BYTES];
    if (tierCount < 1 || tierCount > MAX_TIERS) return null;
    bodyLength = 1 + SET_ID_BYTES + 2 + tierCount * (1 + SECRET_BYTES);
  } else {
    return null;
  }
  if (bytes.length !== bodyLength + CHECKSUM_BYTES) return null;
  const body = bytes.slice(0, bodyLength);
  const expected = await checksum(body);
  if (bytes[bodyLength] !== expected[0] || bytes[bodyLength + 1] !== expected[1]) return null;

  const setId = toHex(body.slice(1, 1 + SET_ID_BYTES));
  const index = body[2 + SET_ID_BYTES];
  const tiers: { threshold: number; share: Share }[] = [];
  if (version === SHARE_VERSION_V1) {
    tiers.push({ threshold: body[1 + SET_ID_BYTES], share: { index, data: body.slice(3 + SET_ID_BYTES) } });
  } else {
    const tierCount = body[1 + SET_ID_BYTES];
    let offset = 3 + SET_ID_BYTES;
    for (let j = 0; j < tierCount; j++) {
      const threshold = body[offset++];
      tiers.push({ threshold, share: { index, data: body.slice(offset, offset + SECRET_BYTES) } });
      offset += SECRET_BYTES;
      if (j > 0 && threshold <= tiers[j - 1].threshold) return null;
    }
  }
  return { setId, index, tiers, threshold: tiers[0].threshold, share: tiers[0].share };
}

export interface TierChoice {
  /** Index into the schedule. */
  tier: number;
  threshold: number;
  secret: Uint8Array;
}

/** Which tiers do these cards unlock? Checks the cards belong together first. */
function checkSameSet(shares: ParsedGuardianShare[]): void {
  if (shares.length === 0) throw new Error('No shares');
  const { setId, tiers } = shares[0];
  if (shares.some(s => s.setId !== setId)) {
    throw new Error('These shares belong to different recovery setups');
  }
  const sameSchedule = (s: ParsedGuardianShare) =>
    s.tiers.length === tiers.length && s.tiers.every((t, j) => t.threshold === tiers[j].threshold);
  if (shares.some(s => !sameSchedule(s))) {
    throw new Error('These cards carry different delay schedules');
  }
  if (new Set(shares.map(s => s.index)).size !== shares.length) {
    throw new Error('The same guardian card was entered twice');
  }
}

/**
 * Reconstruct the seed of the fastest tier these cards unlock. With c cards,
 * that is the tier with the largest threshold t_j <= c. Throws when even the
 * base tier needs more cards.
 */
export function reconstructBestTier(shares: ParsedGuardianShare[]): TierChoice {
  checkSameSet(shares);
  const schedule = shares[0].tiers;
  let best = -1;
  for (let j = 0; j < schedule.length; j++) {
    if (schedule[j].threshold <= shares.length) best = j;
  }
  if (best < 0) {
    throw new Error(`Need ${schedule[0].threshold} guardian shares, have ${shares.length}`);
  }
  const threshold = schedule[best].threshold;
  const secret = combineShares(shares.slice(0, threshold).map(s => s.tiers[best].share));
  return { tier: best, threshold, secret };
}

/** Base-tier reconstruction, kept for callers of the original API. */
export function reconstructSecret(shares: ParsedGuardianShare[]): Uint8Array {
  checkSameSet(shares);
  const { threshold } = shares[0].tiers[0];
  if (shares.length < threshold) {
    throw new Error(`Need ${threshold} guardian shares, have ${shares.length}`);
  }
  return combineShares(shares.slice(0, threshold).map(s => s.tiers[0].share));
}

// ── setup and rotation (owner) ────────────────────────────────────────────

interface TierInput {
  threshold: number;
  delaySeconds: number;
}

async function buildTiers(
  seeds: Uint8Array[],
  schedule: TierInput[],
  assumedSquaringsPerSecond: number
): Promise<{ modulus: string; tiers: DelayTier[] }> {
  // One modulus for the whole schedule: the tiers are independent RSW
  // instances because their starting values come from independent seeds.
  const { modulus, phi } = await generateModulus(2048);
  const length = modulusByteLength(modulus);
  const tiers: DelayTier[] = [];
  for (let j = 0; j < schedule.length; j++) {
    const squarings = Math.ceil(schedule[j].delaySeconds * assumedSquaringsPerSecond);
    const start = await deriveStart(seeds[j], modulus);
    const answer = solveWithTrapdoor(start, squarings, modulus, phi);
    tiers.push({
      threshold: schedule[j].threshold,
      delaySeconds: schedule[j].delaySeconds,
      squarings,
      secret: toBase64(seeds[j]),
      answer: toHex(bigIntToBytes(answer, length))
    });
  }
  return { modulus: toHex(bigIntToBytes(modulus, length)), tiers };
}

export interface CreateOptions {
  guardianLabels: string[];
  /** Base tier (used when `schedule` is absent). */
  threshold: number;
  delaySeconds: number;
  /** Fastest sequential squaring rate the delay must hold against. */
  assumedSquaringsPerSecond: number;
  /** Full graded schedule, ascending threshold; overrides threshold/delaySeconds. */
  schedule?: ScheduleEntry[];
}

export async function createSocialRecovery(
  options: CreateOptions
): Promise<{ config: SocialRecoveryConfig; shares: string[] }> {
  const n = options.guardianLabels.length;
  const schedule: TierInput[] = options.schedule && options.schedule.length > 0
    ? options.schedule
    : [{ threshold: options.threshold, delaySeconds: options.delaySeconds }];
  const problem = validateSchedule(schedule, n);
  if (problem) throw new Error(problem);

  const setId = toHex(crypto.getRandomValues(new Uint8Array(SET_ID_BYTES)));
  const seeds = schedule.map(() => crypto.getRandomValues(new Uint8Array(SECRET_BYTES)));
  // splitSecret assigns x = 1..n in order, so guardian i has the same index in every tier.
  const sharesByTier = schedule.map((tier, j) => splitSecret(seeds[j], n, tier.threshold));
  const { modulus, tiers } = await buildTiers(seeds, schedule, options.assumedSquaringsPerSecond);

  const config: SocialRecoveryConfig = {
    setId,
    secret: tiers[0].secret,
    threshold: tiers[0].threshold,
    guardians: options.guardianLabels.map((label, i) => ({ index: sharesByTier[0][i].index, label })),
    modulus,
    squarings: tiers[0].squarings,
    answer: tiers[0].answer,
    delaySeconds: tiers[0].delaySeconds,
    assumedSquaringsPerSecond: options.assumedSquaringsPerSecond,
    epoch: 1,
    createdAt: Date.now(),
    tiers
  };
  const shares = await Promise.all(
    options.guardianLabels.map((_, i) =>
      encodeGuardianShare(
        setId,
        schedule[0].threshold,
        sharesByTier[0][i],
        schedule.slice(1).map((tier, j) => ({ threshold: tier.threshold, share: sharesByTier[j + 1][i] }))
      )
    )
  );
  for (const seed of seeds) seed.fill(0);
  return { config, shares };
}

/**
 * Owner veto / re-key: a fresh modulus with the same guardian seeds. Any
 * puzzle work done against an older vault file does not help with files
 * written after the rotation, and guardians keep their existing cards.
 * `delaySeconds` changes the base tier's delay; faster tiers keep theirs.
 */
export async function rotatePuzzle(
  config: SocialRecoveryConfig,
  delaySeconds = config.delaySeconds
): Promise<SocialRecoveryConfig> {
  const current = configTiers(config);
  const schedule: TierInput[] = current.map((t, j) => ({
    threshold: t.threshold,
    delaySeconds: j === 0 ? delaySeconds : Math.min(t.delaySeconds, delaySeconds)
  }));
  const { modulus, tiers } = await buildTiers(
    current.map(t => fromBase64(t.secret)),
    schedule,
    config.assumedSquaringsPerSecond
  );
  return {
    ...config,
    modulus,
    answer: tiers[0].answer,
    squarings: tiers[0].squarings,
    delaySeconds: tiers[0].delaySeconds,
    epoch: config.epoch + 1,
    tiers
  };
}

// ── vault blocks ──────────────────────────────────────────────────────────

async function aeadKey(ikm: Uint8Array, salt: Uint8Array, info: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info: new TextEncoder().encode(info) },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function sealBlock(ikm: Uint8Array, info: string, plaintext: string): Promise<EncryptedBytes> {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await aeadKey(ikm, salt, info);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
  return { salt, iv, data: new Uint8Array(data) };
}

async function openBlock(ikm: Uint8Array, info: string, block: EncryptedBytes): Promise<string | null> {
  try {
    const key = await aeadKey(ikm, block.salt, info);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: block.iv }, key, block.data);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

function dataKeyMaterial(secret: Uint8Array, answer: Uint8Array): Uint8Array {
  const ikm = new Uint8Array(secret.length + answer.length);
  ikm.set(secret);
  ikm.set(answer, secret.length);
  return ikm;
}

function packWrap(block: EncryptedBytes): string {
  return toHex(block.salt) + toHex(block.iv) + toHex(block.data);
}

function unpackWrap(hex: string): EncryptedBytes | null {
  if (hex.length < 2 * (32 + 12 + 16)) return null;
  const bytes = fromHex(hex);
  return { salt: bytes.slice(0, 32), iv: bytes.slice(32, 44), data: bytes.slice(44) };
}

/**
 * The blocks appended to the vault file on every save: one parameter block
 * per tier, then the living recovery copy under a fresh random data key.
 */
export async function buildSocialBlocks(
  config: SocialRecoveryConfig,
  vaultJson: string
): Promise<EncryptedBytes[]> {
  const tiers = configTiers(config);
  const schedule = tiers.map(t => ({ threshold: t.threshold, delaySeconds: t.delaySeconds }));
  const dataKey = crypto.getRandomValues(new Uint8Array(DATA_KEY_BYTES));
  const blocks: EncryptedBytes[] = [];
  for (let j = 0; j < tiers.length; j++) {
    const secret = fromBase64(tiers[j].secret);
    const wrap = await sealBlock(dataKeyMaterial(secret, fromHex(tiers[j].answer)), WRAP_INFO, toBase64(dataKey));
    const params: PuzzleParams = {
      setId: config.setId,
      modulus: config.modulus,
      squarings: tiers[j].squarings,
      delaySeconds: tiers[j].delaySeconds,
      assumedSquaringsPerSecond: config.assumedSquaringsPerSecond,
      epoch: config.epoch,
      tier: j,
      threshold: tiers[j].threshold,
      schedule,
      dataKeyWrap: packWrap(wrap)
    };
    blocks.push(await sealBlock(secret, PARAMS_INFO, JSON.stringify(params)));
  }
  blocks.push(await sealBlock(dataKey, DATA_KEY_INFO, vaultJson));
  dataKey.fill(0);
  return blocks;
}

/**
 * Find and open the puzzle-parameter block with a reconstructed seed.
 * Returns null if no block opens, meaning wrong shares or no guardian
 * recovery in this file. This check runs before any sequential work.
 */
export async function openPuzzleParams(
  blocks: EncryptedBytes[],
  secret: Uint8Array
): Promise<{ params: PuzzleParams; blockIndex: number } | null> {
  for (let i = 0; i < blocks.length; i++) {
    const json = await openBlock(secret, PARAMS_INFO, blocks[i]);
    if (json) return { params: JSON.parse(json) as PuzzleParams, blockIndex: i };
  }
  return null;
}

/** Starting value for the sequential squarings, derived from the seed. */
export async function puzzleStart(secret: Uint8Array, params: PuzzleParams): Promise<bigint> {
  return deriveStart(secret, bytesToBigInt(fromHex(params.modulus)));
}

export function puzzleModulus(params: PuzzleParams): bigint {
  return bytesToBigInt(fromHex(params.modulus));
}

/** Open the living recovery copy once the tier's puzzle answer is known. */
export async function openRecoveredVault(
  blocks: EncryptedBytes[],
  secret: Uint8Array,
  params: PuzzleParams,
  answer: bigint
): Promise<string> {
  const answerBytes = bigIntToBytes(answer, params.modulus.length / 2);
  const ikm = dataKeyMaterial(secret, answerBytes);
  const failure = 'Recovery copy did not open: the puzzle answer or vault file does not match';

  if (params.dataKeyWrap) {
    const wrap = unpackWrap(params.dataKeyWrap);
    const keyText = wrap ? await openBlock(ikm, WRAP_INFO, wrap) : null;
    if (!keyText) throw new Error(failure);
    const dataKey = fromBase64(keyText);
    for (const block of blocks) {
      const json = await openBlock(dataKey, DATA_KEY_INFO, block);
      if (json) return json;
    }
    throw new Error(failure);
  }

  // Files written before graded delay: the copy is sealed directly under S || b.
  for (const block of blocks) {
    const json = await openBlock(ikm, DATA_INFO, block);
    if (json) return json;
  }
  throw new Error(failure);
}
