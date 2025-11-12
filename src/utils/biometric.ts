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

export function disableBiometric(): void {
  localStorage.removeItem('biometric_credential_id');
  localStorage.removeItem('biometric_enabled');
  clearBiometricVaultData();
}

export function clearBiometricVaultData(): void {
  localStorage.removeItem('vault_password_encrypted');
  localStorage.removeItem('vault_file_data');
}

export async function updateBiometricVaultData(password: string, vaultData: string, fileName: string): Promise<boolean> {
  if (!isBiometricEnabled()) {
    return false;
  }

  try {
    localStorage.setItem('vault_password_encrypted', btoa(password));
    localStorage.setItem('vault_file_data', JSON.stringify({ name: fileName, content: vaultData }));
    return true;
  } catch (error) {
    console.error('Failed to update biometric vault data:', error);
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

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
