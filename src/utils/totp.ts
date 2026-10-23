function base32Decode(base32: string): Uint8Array {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanedBase32 = base32.replace(/\s/g, '').toUpperCase();

  let bits = '';
  for (const char of cleanedBase32) {
    if (char === '=') continue; // padding
    const val = base32Chars.indexOf(char);
    if (val === -1) {
      // Dropping the character would silently derive a different key.
      throw new Error('Invalid base32 secret');
    }
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }

  return bytes;
}

function base32Encode(bytes: Uint8Array): string {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';

  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, '0');
  }

  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substr(i, 5).padEnd(5, '0');
    result += base32Chars[parseInt(chunk, 2)];
  }

  return result;
}

async function hmac(algorithm: string, key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(signature);
}

function dynamicTruncate(hmacResult: Uint8Array, digits: number): string {
  const offset = hmacResult[hmacResult.length - 1] & 0x0f;
  const binary =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, '0');
}

export async function generateTOTP(
  secret: string,
  options: {
    algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
    digits?: number;
    period?: number;
  } = {}
): Promise<{ code: string; timeRemaining: number }> {
  const algorithm = options.algorithm || 'SHA1';
  const digits = options.digits || 6;
  const period = options.period || 30;

  const secretBytes = base32Decode(secret);
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / period);

  const counterBytes = new Uint8Array(8);
  let tempCounter = BigInt(counter);
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = Number(tempCounter & BigInt(0xff));
    tempCounter >>= BigInt(8);
  }

  const hmacResult = await hmac(`SHA-${algorithm.substring(3)}`, secretBytes, counterBytes);
  const code = dynamicTruncate(hmacResult, digits);

  const timeRemaining = period - (now % period);

  return { code, timeRemaining };
}

export function generateSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

export function parseOtpAuthUri(uri: string): {
  secret: string;
  issuer?: string;
  accountName?: string;
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  digits?: number;
  period?: number;
} | null {
  try {
    const url = new URL(uri);
    if (url.protocol !== 'otpauth:') return null;
    if (url.host.toLowerCase() !== 'totp') return null;

    let label = url.pathname.substring(1);
    try {
      label = decodeURIComponent(label);
    } catch {
      /* keep the raw label */
    }
    const colon = label.indexOf(':');
    const issuer = colon >= 0 ? label.slice(0, colon).trim() : undefined;
    const accountName = (colon >= 0 ? label.slice(colon + 1) : label).trim();

    const secret = (url.searchParams.get('secret') || '').replace(/\s/g, '').toUpperCase();
    if (!validateSecret(secret)) return null;

    // Everything from a scanned/pasted URI is untrusted: unknown algorithms
    // or absurd digit/period values would make code generation throw later.
    const rawAlgorithm = (url.searchParams.get('algorithm') || 'SHA1').toUpperCase();
    const algorithm: 'SHA1' | 'SHA256' | 'SHA512' =
      rawAlgorithm === 'SHA256' || rawAlgorithm === 'SHA512' ? rawAlgorithm : 'SHA1';
    const digitsParam = parseInt(url.searchParams.get('digits') || '6', 10);
    const digits = digitsParam === 7 || digitsParam === 8 ? digitsParam : 6;
    const periodParam = parseInt(url.searchParams.get('period') || '30', 10);
    const period = Number.isInteger(periodParam) && periodParam >= 15 && periodParam <= 120 ? periodParam : 30;

    return {
      secret,
      issuer: url.searchParams.get('issuer') || issuer || undefined,
      accountName: accountName || undefined,
      algorithm,
      digits,
      period
    };
  } catch {
    return null;
  }
}

export function generateOtpAuthUri(
  secret: string,
  issuer: string,
  accountName: string,
  options: {
    algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
    digits?: number;
    period?: number;
  } = {}
): string {
  const algorithm = options.algorithm || 'SHA1';
  const digits = options.digits || 6;
  const period = options.period || 30;

  const label = issuer ? `${issuer}:${accountName}` : accountName;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm,
    digits: digits.toString(),
    period: period.toString()
  });

  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}

export function validateSecret(secret: string): boolean {
  try {
    const cleaned = secret.replace(/\s/g, '').toUpperCase().replace(/=+$/, '');
    if (cleaned.length < 16 || cleaned.length > 256) return false;

    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    for (const char of cleaned) {
      if (!base32Chars.includes(char)) return false;
    }

    return true;
  } catch {
    return false;
  }
}
