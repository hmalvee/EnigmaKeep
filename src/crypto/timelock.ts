// SPDX-License-Identifier: MIT
/**
 * RSW time-lock puzzle (Rivest, Shamir, Wagner 1996): computing
 * a^(2^t) mod N takes t sequential squarings for anyone who cannot factor N,
 * but the creator, knowing phi(N), computes it with one modular
 * exponentiation by e = 2^t mod phi(N).
 *
 * Here the starting value `a` is derived from a secret (see deriveStart), so
 * the sequential work cannot begin until that secret is known.
 */

export interface TimeLockPuzzle {
  /** RSA modulus, big-endian bytes */
  modulus: Uint8Array;
  /** Number of sequential squarings */
  squarings: number;
}

export interface SolveProgress {
  /** Current value x = a^(2^done) mod N */
  value: bigint;
  /** Squarings completed so far */
  done: number;
}

export function bytesToBigInt(bytes: Uint8Array): bigint {
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex ? BigInt('0x' + hex) : 0n;
}

export function bigIntToBytes(value: bigint, length: number): Uint8Array {
  let hex = value.toString(16);
  if (hex.length > length * 2) throw new Error('Value does not fit');
  hex = hex.padStart(length * 2, '0');
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function base64UrlToBigInt(text: string): bigint {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytesToBigInt(bytes);
}

export function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = 1n;
  let b = base % modulus;
  let e = exponent;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % modulus;
    b = (b * b) % modulus;
    e >>= 1n;
  }
  return result;
}

/**
 * Generate a fresh RSA modulus and return it with phi(N). The primes come from
 * WebCrypto's RSA key generation; the private key is used once and discarded.
 */
export async function generateModulus(bits = 2048): Promise<{ modulus: bigint; phi: bigint }> {
  const pair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: bits,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['sign', 'verify']
  );
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  if (!jwk.n || !jwk.p || !jwk.q) throw new Error('RSA key export failed');
  const p = base64UrlToBigInt(jwk.p);
  const q = base64UrlToBigInt(jwk.q);
  return { modulus: base64UrlToBigInt(jwk.n), phi: (p - 1n) * (q - 1n) };
}

/**
 * Map a secret to a puzzle starting value in [2, N-2]. Expands with SHA-512
 * in counter mode to 128 bits beyond the modulus size, so the reduction bias
 * is negligible.
 */
export async function deriveStart(secret: Uint8Array, modulus: bigint): Promise<bigint> {
  const modulusBytes = Math.ceil(modulus.toString(16).length / 2);
  const needed = modulusBytes + 16;
  const label = new TextEncoder().encode('EnigmaKeep time-lock start v1');
  const nBytes = bigIntToBytes(modulus, modulusBytes);
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (let counter = 0; total < needed; counter++) {
    const input = new Uint8Array(label.length + 4 + secret.length + nBytes.length);
    input.set(label);
    new DataView(input.buffer).setUint32(label.length, counter);
    input.set(secret, label.length + 4);
    input.set(nBytes, label.length + 4 + secret.length);
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-512', input));
    chunks.push(digest);
    total += digest.length;
  }
  const expanded = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    expanded.set(c, offset);
    offset += c.length;
  }
  return (bytesToBigInt(expanded.subarray(0, needed)) % (modulus - 3n)) + 2n;
}

/** Puzzle creator's shortcut: a^(2^t) mod N via the trapdoor phi(N). */
export function solveWithTrapdoor(start: bigint, squarings: number, modulus: bigint, phi: bigint): bigint {
  const exponent = modPow(2n, BigInt(squarings), phi);
  return modPow(start, exponent, modulus);
}

/**
 * Advance the sequential computation by up to `steps` squarings. Callers loop
 * (e.g. in a Web Worker) and persist the returned progress, so a solve that
 * takes days survives reloads and restarts.
 */
export function solveSteps(
  progress: SolveProgress,
  totalSquarings: number,
  modulus: bigint,
  steps: number
): SolveProgress {
  let x = progress.value;
  const end = Math.min(totalSquarings, progress.done + steps);
  for (let i = progress.done; i < end; i++) {
    x = (x * x) % modulus;
  }
  return { value: x, done: end };
}

/**
 * Delay assumption used when creating puzzles: sequential 2048-bit squarings
 * per second on a fast desktop CPU with GMP (measured ~1.75M/s on an Intel
 * i5-14600K, rounded up). The "specialised hardware" option multiplies this;
 * 20x corresponds to the ~25 ns/squaring reached in the VDF FPGA competition
 * (for 1024-bit moduli; no 2048-bit FPGA/ASIC figure is published).
 */
export const FAST_CPU_SQUARINGS_PER_SECOND = 2_000_000;
export const SPECIALISED_HARDWARE_FACTOR = 20;

/** Measure this device's squaring speed for about `ms` milliseconds. */
export function measureSquaringsPerSecond(modulus: bigint, ms = 300): number {
  let x = 3n;
  let count = 0;
  const startTime = performance.now();
  while (performance.now() - startTime < ms) {
    for (let i = 0; i < 1000; i++) x = (x * x) % modulus;
    count += 1000;
  }
  return count / ((performance.now() - startTime) / 1000);
}
