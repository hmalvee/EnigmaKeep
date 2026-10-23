// SPDX-License-Identifier: MIT
const PBKDF2_ITERATIONS = 600000;
const SALT_LENGTH = 32;
const IV_LENGTH = 12;
const SECRET_KEY_HKDF_INFO = 'EnigmaKeep vault key + Secret Key v1';

export interface EncryptedData {
  salt: string;
  iv: string;
  data: string;
}

/**
 * Raw, byte-oriented encrypted block. Used by the opaque vault container so
 * that nothing is ever serialised as recognisable JSON on disk or on the wire.
 */
export interface EncryptedBytes {
  salt: Uint8Array;
  iv: Uint8Array;
  data: Uint8Array;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(data: string, password: string): Promise<EncryptedData> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const key = await deriveKey(password, salt);
  const encoder = new TextEncoder();
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );

  return {
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    data: arrayBufferToBase64(encryptedData)
  };
}

export async function decrypt(
  encryptedData: EncryptedData,
  password: string
): Promise<string> {
  const salt = base64ToArrayBuffer(encryptedData.salt);
  const iv = base64ToArrayBuffer(encryptedData.iv);
  const data = base64ToArrayBuffer(encryptedData.data);

  const key = await deriveKey(password, salt);

  try {
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    throw new Error('Decryption failed - incorrect password or corrupted data');
  }
}

/** PBKDF2 output for (password, salt): the expensive, brute-force-resistant step. */
async function derivePasswordBits(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    passwordKey,
    256
  );
}

/**
 * Turn PBKDF2 output into the AES key. Without a Secret Key this is exactly
 * what deriveKey() produces, so existing vaults still open. With one, the
 * Secret Key is mixed in through HKDF: the password alone is no longer enough.
 */
async function aesKeyFromPasswordBits(
  passwordBits: ArrayBuffer,
  secretKey?: Uint8Array
): Promise<CryptoKey> {
  if (!secretKey) {
    return crypto.subtle.importKey('raw', passwordBits, 'AES-GCM', false, ['encrypt', 'decrypt']);
  }
  const material = await crypto.subtle.importKey('raw', passwordBits, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: secretKey,
      info: new TextEncoder().encode(SECRET_KEY_HKDF_INFO)
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a UTF-8 string to a raw byte block (random salt + IV + AES-GCM
 * ciphertext-with-tag). The GCM authentication tag is what protects the file
 * against tampering, replacing the old unkeyed SHA-512 "signature".
 */
export async function encryptToBytes(
  data: string,
  password: string,
  secretKey?: Uint8Array
): Promise<EncryptedBytes> {
  // Encode once into a Uint8Array (avoids SubtleCrypto re-scanning a giant string).
  return encryptBytesToBytes(new TextEncoder().encode(data), password, secretKey);
}

/** Same as encryptToBytes for a binary plaintext (hidden-vault key wraps). */
export async function encryptBytesToBytes(
  plain: Uint8Array,
  password: string,
  secretKey?: Uint8Array
): Promise<EncryptedBytes> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await aesKeyFromPasswordBits(await derivePasswordBits(password, salt), secretKey);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);
  return { salt, iv, data: new Uint8Array(cipher) };
}

/**
 * Decrypt a byte block. The file does not record whether a Secret Key was
 * used, so each candidate key is tried (then none, for vaults without one).
 * PBKDF2 runs once; each extra candidate costs only an HKDF + GCM check.
 */
export async function decryptFromBytes(
  enc: EncryptedBytes,
  password: string,
  secretKeyCandidates: Uint8Array[] = []
): Promise<string> {
  return new TextDecoder().decode(await decryptBytesFromBytes(enc, password, secretKeyCandidates));
}

/** Binary counterpart of decryptFromBytes. */
export async function decryptBytesFromBytes(
  enc: EncryptedBytes,
  password: string,
  secretKeyCandidates: Uint8Array[] = []
): Promise<Uint8Array> {
  const passwordBits = await derivePasswordBits(password, enc.salt);
  for (const secretKey of [...secretKeyCandidates, undefined]) {
    try {
      const key = await aesKeyFromPasswordBits(passwordBits, secretKey);
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: enc.iv }, key, enc.data);
      return new Uint8Array(plain);
    } catch {
      /* try the next candidate */
    }
  }
  throw new Error('Decryption failed - incorrect password or corrupted data');
}

export async function verifyCrypto(): Promise<boolean> {
  try {
    const testData = 'crypto-self-test';
    const testPassword = 'test-password-123';
    const encrypted = await encrypt(testData, testPassword);
    const decrypted = await decrypt(encrypted, testPassword);
    if (decrypted !== testData) return false;

    const encBytes = await encryptToBytes(testData, testPassword);
    const decBytes = await decryptFromBytes(encBytes, testPassword);
    if (decBytes !== testData) return false;

    const testSecretKey = crypto.getRandomValues(new Uint8Array(16));
    const encSecret = await encryptToBytes(testData, testPassword, testSecretKey);
    const decSecret = await decryptFromBytes(encSecret, testPassword, [testSecretKey]);
    if (decSecret !== testData) return false;
    // Without the Secret Key the password alone must fail.
    try {
      await decryptFromBytes(encSecret, testPassword);
      return false;
    } catch {
      return true;
    }
  } catch {
    return false;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
