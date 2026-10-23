/**
 * Biometric unlock backed by the WebAuthn PRF extension.
 *
 * The master password is wrapped with an AES-GCM key derived (HKDF) from the
 * authenticator's PRF output. That output only exists after a successful
 * user-verified WebAuthn ceremony, so the wrapped password cannot be opened by
 * script on the page or by someone copying the browser profile — the key lives
 * in the platform authenticator (TPM / Secure Enclave), not in browser storage.
 *
 * Authenticators without PRF support are refused rather than falling back to a
 * key stored next to the ciphertext.
 */

export interface BiometricCapability {
  available: boolean;
  types: string[];
}

interface StoredBiometricUnlock {
  credentialId: string;
  prfSalt: string;
  iv: string;
  ciphertext: string;
}

const STORAGE_KEY = 'biometric_unlock_v2';
const HKDF_INFO = 'EnigmaKeep biometric unlock v1';

// Storage used by the old scheme (password wrapped by a key kept in IndexedDB).
const LEGACY_LOCAL_KEYS = [
  'biometric_credential_id',
  'biometric_enabled',
  'vault_password_encrypted',
  'vault_file_data'
];
const LEGACY_KEY_DB = 'BiometricKeyStore';

type PrfExtensionOutput = {
  prf?: { enabled?: boolean; results?: { first?: BufferSource } };
};

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

function readStored(): StoredBiometricUnlock | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredBiometricUnlock;
    if (!parsed.credentialId || !parsed.prfSalt || !parsed.iv || !parsed.ciphertext) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function isBiometricEnabled(): boolean {
  return readStored() !== null;
}

function prfFirst(credential: PublicKeyCredential): ArrayBuffer | null {
  const ext = credential.getClientExtensionResults() as PrfExtensionOutput;
  const first = ext.prf?.results?.first;
  if (!first) return null;
  return first instanceof ArrayBuffer
    ? first
    : (first.buffer.slice(first.byteOffset, first.byteOffset + first.byteLength) as ArrayBuffer);
}

async function wrappingKeyFromPrf(prfOutput: ArrayBuffer): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', prfOutput, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0),
      info: new TextEncoder().encode(HKDF_INFO)
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Run a user-verified assertion and return the PRF output for `prfSalt`. */
async function evaluatePrf(credentialId: Uint8Array, prfSalt: Uint8Array): Promise<ArrayBuffer> {
  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ id: credentialId, type: 'public-key', transports: ['internal'] }],
      userVerification: 'required',
      timeout: 60000,
      extensions: { prf: { eval: { first: prfSalt } } } as AuthenticationExtensionsClientInputs
    }
  })) as PublicKeyCredential | null;

  if (!assertion) {
    throw new Error('Biometric verification was cancelled');
  }

  const output = prfFirst(assertion);
  if (!output) {
    throw new Error('This authenticator does not support secure biometric unlock (WebAuthn PRF).');
  }
  return output;
}

/**
 * Register a platform credential and store `password` wrapped under a key that
 * only the authenticator can reproduce. Throws with a user-facing message.
 */
export async function enableBiometric(password: string): Promise<void> {
  if (!password) {
    throw new Error('Unlock the vault with your master password first');
  }

  const prfSalt = crypto.getRandomValues(new Uint8Array(32));

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: 'EnigmaKeep', id: window.location.hostname },
      user: {
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: 'EnigmaKeep vault',
        displayName: 'EnigmaKeep vault'
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' }
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'discouraged'
      },
      timeout: 60000,
      attestation: 'none',
      extensions: { prf: { eval: { first: prfSalt } } } as AuthenticationExtensionsClientInputs
    }
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Biometric registration was cancelled');
  }

  const ext = credential.getClientExtensionResults() as PrfExtensionOutput;
  if (ext.prf?.enabled === false) {
    throw new Error('This authenticator does not support secure biometric unlock (WebAuthn PRF).');
  }

  const credentialId = new Uint8Array(credential.rawId);
  // Some platforms return the PRF result at creation; others need an assertion.
  const prfOutput = prfFirst(credential) ?? (await evaluatePrf(credentialId, prfSalt));

  const key = await wrappingKeyFromPrf(prfOutput);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: credentialId },
    key,
    new TextEncoder().encode(password)
  );

  clearLegacyBiometricData();
  const stored: StoredBiometricUnlock = {
    credentialId: bytesToBase64(credentialId),
    prfSalt: bytesToBase64(prfSalt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext))
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

/** Prompt for biometric verification and return the unwrapped master password. */
export async function unlockWithBiometric(): Promise<string> {
  const stored = readStored();
  if (!stored) {
    throw new Error('Biometric unlock is not set up on this device');
  }

  const credentialId = base64ToBytes(stored.credentialId);
  const prfOutput = await evaluatePrf(credentialId, base64ToBytes(stored.prfSalt));
  const key = await wrappingKeyFromPrf(prfOutput);

  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(stored.iv), additionalData: credentialId },
      key,
      base64ToBytes(stored.ciphertext)
    );
    return new TextDecoder().decode(plain);
  } catch {
    throw new Error('Biometric credential could not be decrypted. Please use your master password.');
  }
}

export async function disableBiometric(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
  clearLegacyBiometricData();
}

/**
 * Remove data left by the old biometric scheme, whose wrapping key sat in
 * IndexedDB and could be used without any biometric check.
 */
export function clearLegacyBiometricData(): void {
  try {
    for (const key of LEGACY_LOCAL_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
  try {
    indexedDB.deleteDatabase(LEGACY_KEY_DB);
  } catch {
    /* ignore */
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
