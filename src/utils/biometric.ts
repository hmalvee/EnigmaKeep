export interface BiometricCapability {
  available: boolean;
  types: string[];
}

export async function checkBiometricSupport(): Promise<BiometricCapability> {
  if (!window.PublicKeyCredential) {
    return { available: false, types: [] };
  }

  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

    if (available) {
      return {
        available: true,
        types: ['platform']
      };
    }
  } catch (error) {
    console.error('Biometric check failed:', error);
  }

  return { available: false, types: [] };
}

export async function registerBiometric(username: string): Promise<string | null> {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'EnigmaKeep',
        id: window.location.hostname
      },
      user: {
        id: new TextEncoder().encode(username),
        name: username,
        displayName: username
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' }
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        requireResidentKey: false
      },
      timeout: 60000,
      attestation: 'none'
    };

    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Failed to create credential');
    }

    const credentialId = arrayBufferToBase64(credential.rawId);

    localStorage.setItem('biometric_credential_id', credentialId);
    localStorage.setItem('biometric_enabled', 'true');

    return credentialId;
  } catch (error) {
    console.error('Biometric registration failed:', error);
    return null;
  }
}

export async function authenticateWithBiometric(username: string): Promise<boolean> {
  try {
    const credentialIdStr = localStorage.getItem('biometric_credential_id');

    if (!credentialIdStr) {
      throw new Error('No biometric credential found');
    }

    const credentialId = base64ToArrayBuffer(credentialIdStr);
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: [
        {
          id: credentialId,
          type: 'public-key',
          transports: ['internal']
        }
      ],
      userVerification: 'required',
      timeout: 60000
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    }) as PublicKeyCredential;

    if (!assertion) {
      throw new Error('Authentication failed');
    }

    return true;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return false;
  }
}

export function isBiometricEnabled(): boolean {
  return localStorage.getItem('biometric_enabled') === 'true';
}

// IndexedDB-backed key store for biometric encryption
const BIOMETRIC_DB_NAME = 'BiometricKeyStore';
const BIOMETRIC_DB_VERSION = 1;
const BIOMETRIC_STORE_NAME = 'keys';
const BIOMETRIC_KEY_ID = 'biometric-encryption-key';

async function openBiometricKeyDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(BIOMETRIC_DB_NAME, BIOMETRIC_DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BIOMETRIC_STORE_NAME)) {
        db.createObjectStore(BIOMETRIC_STORE_NAME);
      }
    };
  });
}

async function getOrCreateBiometricKey(): Promise<CryptoKey> {
  const db = await openBiometricKeyDB();

  try {
    // Try to retrieve existing key
    const existingKey = await new Promise<CryptoKey | undefined>((resolve, reject) => {
      const tx = db.transaction(BIOMETRIC_STORE_NAME, 'readonly');
      const store = tx.objectStore(BIOMETRIC_STORE_NAME);
      const request = store.get(BIOMETRIC_KEY_ID);
      request.onsuccess = () => resolve(request.result as CryptoKey | undefined);
      request.onerror = () => reject(request.error);
    });

    if (existingKey) {
      return existingKey;
    }

    // Generate a new AES-GCM key (non-exportable)
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Store the key in IndexedDB
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(BIOMETRIC_STORE_NAME, 'readwrite');
      const store = tx.objectStore(BIOMETRIC_STORE_NAME);
      const request = store.put(key, BIOMETRIC_KEY_ID);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return key;
  } finally {
    db.close();
  }
}

async function encryptForBiometric(plaintext: string): Promise<string> {
  const key = await getOrCreateBiometricKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  // Combine IV + ciphertext as base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  const binary = String.fromCharCode(...combined);
  return btoa(binary);
}

async function decryptForBiometric(encryptedBase64: string): Promise<string> {
  const key = await getOrCreateBiometricKey();
  const binary = atob(encryptedBase64);
  const combined = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    combined[i] = binary.charCodeAt(i);
  }
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

async function deleteBiometricKey(): Promise<void> {
  try {
    const db = await openBiometricKeyDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(BIOMETRIC_STORE_NAME, 'readwrite');
      const store = tx.objectStore(BIOMETRIC_STORE_NAME);
      const request = store.delete(BIOMETRIC_KEY_ID);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    db.close();
  } catch (error) {
    console.error('Failed to delete biometric key:', error);
  }
}

export async function disableBiometric(): Promise<void> {
  localStorage.removeItem('biometric_credential_id');
  localStorage.removeItem('biometric_enabled');
  clearBiometricVaultData();
  await deleteBiometricKey();
}

export function clearBiometricVaultData(): void {
  localStorage.removeItem('vault_password_encrypted');
  // Legacy: full vault ciphertext used to be cached here — always purge it.
  localStorage.removeItem('vault_file_data');
}

/**
 * Store only the master password (wrapped with a non-exportable IndexedDB key).
 * The vault file itself must be read from the File System handle — never cached
 * as a second plaintext-adjacent copy in localStorage.
 */
export async function updateBiometricVaultData(password: string): Promise<boolean> {
  if (!isBiometricEnabled()) {
    return false;
  }

  try {
    const encryptedPassword = await encryptForBiometric(password);
    localStorage.setItem('vault_password_encrypted', encryptedPassword);
    localStorage.removeItem('vault_file_data');
    return true;
  } catch (error) {
    console.error('Failed to update biometric vault data:', error);
    return false;
  }
}

export async function decryptBiometricPassword(): Promise<string | null> {
  const stored = localStorage.getItem('vault_password_encrypted');
  if (!stored) return null;
  try {
    return await decryptForBiometric(stored);
  } catch (error) {
    console.error('Failed to decrypt biometric password:', error);
    return null;
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

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
