const PBKDF2_ITERATIONS = 600000;
const SALT_LENGTH = 32;
const IV_LENGTH = 12;

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

/**
 * Encrypt a UTF-8 string to a raw byte block (random salt + IV + AES-GCM
 * ciphertext-with-tag). The GCM authentication tag is what protects the file
 * against tampering, replacing the old unkeyed SHA-512 "signature".
 */
export async function encryptToBytes(data: string, password: string): Promise<EncryptedBytes> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);
  // Encode once into a Uint8Array (avoids SubtleCrypto re-scanning a giant string).
  const plain = new TextEncoder().encode(data);
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plain
  );
  return { salt, iv, data: new Uint8Array(cipher) };
}

export async function decryptFromBytes(enc: EncryptedBytes, password: string): Promise<string> {
  const key = await deriveKey(password, enc.salt);
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: enc.iv },
      key,
      enc.data
    );
    return new TextDecoder().decode(plain);
  } catch {
    throw new Error('Decryption failed - incorrect password or corrupted data');
  }
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
    return decBytes === testData;
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
