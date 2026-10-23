// SPDX-License-Identifier: MIT
/**
 * Shamir secret sharing over GF(2^8), applied byte-wise (Shamir 1979).
 * Field: x^8 + x^4 + x^3 + x + 1 (0x11b, the AES polynomial), generator 3.
 * Share x-coordinates are 1..n; the secret is the polynomial's value at 0.
 */

const EXP = new Uint8Array(510);
const LOG = new Uint8Array(256);

(function buildTables() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    // Multiply by the generator 3: x*2 xor x, reduced by 0x11b.
    let doubled = x << 1;
    if (doubled & 0x100) doubled ^= 0x11b;
    x = doubled ^ x;
  }
  for (let i = 255; i < 510; i++) EXP[i] = EXP[i - 255];
})();

function mul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function div(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero in GF(256)');
  if (a === 0) return 0;
  return EXP[LOG[a] + 255 - LOG[b]];
}

export interface Share {
  /** x-coordinate, 1..255 */
  index: number;
  /** y-values, one per secret byte */
  data: Uint8Array;
}

/** Split `secret` into `n` shares, any `k` of which reconstruct it. */
export function splitSecret(secret: Uint8Array, n: number, k: number): Share[] {
  if (!Number.isInteger(n) || !Number.isInteger(k) || k < 2 || n < k || n > 255) {
    throw new Error('Need 2 <= k <= n <= 255');
  }
  // coeffs[j] holds the degree-1..k-1 coefficients for byte j.
  const coeffs = crypto.getRandomValues(new Uint8Array(secret.length * (k - 1)));
  const shares: Share[] = [];
  for (let x = 1; x <= n; x++) {
    const data = new Uint8Array(secret.length);
    for (let j = 0; j < secret.length; j++) {
      // Horner evaluation from the highest coefficient down to the secret.
      let y = 0;
      for (let d = k - 2; d >= 0; d--) {
        y = mul(y, x) ^ coeffs[j * (k - 1) + d];
      }
      data[j] = mul(y, x) ^ secret[j];
    }
    shares.push({ index: x, data });
  }
  return shares;
}

/**
 * Reconstruct the secret from at least k distinct shares (Lagrange
 * interpolation at x = 0). With fewer than k shares the result is a random
 * value; callers detect that through authenticated decryption.
 */
export function combineShares(shares: Share[]): Uint8Array {
  if (shares.length < 2) throw new Error('Need at least two shares');
  const indices = new Set(shares.map(s => s.index));
  if (indices.size !== shares.length || indices.has(0)) {
    throw new Error('Shares must have distinct, non-zero indices');
  }
  const length = shares[0].data.length;
  if (shares.some(s => s.data.length !== length)) {
    throw new Error('Shares have different lengths');
  }

  const secret = new Uint8Array(length);
  for (let i = 0; i < shares.length; i++) {
    // Lagrange basis l_i(0) = prod_{m != i} x_m / (x_m - x_i); subtraction is xor.
    let basis = 1;
    for (let m = 0; m < shares.length; m++) {
      if (m === i) continue;
      basis = mul(basis, div(shares[m].index, shares[m].index ^ shares[i].index));
    }
    for (let j = 0; j < length; j++) {
      secret[j] ^= mul(shares[i].data[j], basis);
    }
  }
  return secret;
}
