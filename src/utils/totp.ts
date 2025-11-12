function base32Decode(base32: string): Uint8Array {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanedBase32 = base32.replace(/\s/g, '').toUpperCase();

  let bits = '';
  for (const char of cleanedBase32) {
    const val = base32Chars.indexOf(char);
    if (val === -1) continue;
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
    if (url.host !== 'totp') return null;

    const pathParts = url.pathname.substring(1).split(':');
    const issuer = pathParts.length > 1 ? pathParts[0] : undefined;
    const accountName = pathParts.length > 1 ? pathParts[1] : pathParts[0];

    const secret = url.searchParams.get('secret');
    if (!secret) return null;

    const algorithm = (url.searchParams.get('algorithm') as 'SHA1' | 'SHA256' | 'SHA512') || 'SHA1';
    const digits = parseInt(url.searchParams.get('digits') || '6');
    const period = parseInt(url.searchParams.get('period') || '30');

    return {
      secret,
      issuer: url.searchParams.get('issuer') || issuer,
      accountName,
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
    const cleaned = secret.replace(/\s/g, '').toUpperCase();
    if (cleaned.length < 16) return false;

    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    for (const char of cleaned) {
      if (!base32Chars.includes(char)) return false;
    }

    return true;
  } catch {
    return false;
  }
}
