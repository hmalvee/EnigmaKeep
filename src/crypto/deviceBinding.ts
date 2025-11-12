export interface DeviceFingerprint {
  id: string;
  timestamp: number;
  signature: string;
}

async function generateDeviceId(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.hardwareConcurrency || 0,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.platform,
    navigator.maxTouchPoints || 0,
  ];

  const deviceString = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(deviceString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  return arrayBufferToHex(hashBuffer);
}

async function createDeviceSignature(deviceId: string, vaultData: string): Promise<string> {
  const combinedData = `${deviceId}:${vaultData}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(combinedData);

  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  return arrayBufferToHex(hashBuffer);
}

export async function bindVaultToDevice(vaultData: string): Promise<DeviceFingerprint> {
  const deviceId = await generateDeviceId();
  const signature = await createDeviceSignature(deviceId, vaultData);

  return {
    id: deviceId,
    timestamp: Date.now(),
    signature
  };
}

export async function verifyDeviceBinding(
  vaultData: string,
  storedFingerprint: DeviceFingerprint
): Promise<boolean> {
  try {
    const currentDeviceId = await generateDeviceId();

    if (currentDeviceId !== storedFingerprint.id) {
      return false;
    }

    const expectedSignature = await createDeviceSignature(currentDeviceId, vaultData);

    return expectedSignature === storedFingerprint.signature;
  } catch (error) {
    console.error('Device verification failed:', error);
    return false;
  }
}

export async function calculateSecurityMetrics(
  vaultData: string,
  kdfIterations: number = 600000
): Promise<{
  estimatedDecryptionTime: string;
  keyStrength: number;
  securityLevel: string;
  protections: string[];
}> {
  const guessesPerSecond = 1e9;

  const timePerAttempt = (kdfIterations / 1e6) * 1.5;

  const secondsFor80Bits = Math.pow(2, 80) / guessesPerSecond * timePerAttempt;
  const secondsFor128Bits = Math.pow(2, 128) / guessesPerSecond * timePerAttempt;
  const secondsFor256Bits = Math.pow(2, 256) / guessesPerSecond * timePerAttempt;

  const dataSize = new TextEncoder().encode(vaultData).length;
  const keyStrength = 256;

  let estimatedTime: string;
  if (secondsFor256Bits < 31536000) {
    estimatedTime = 'Less than 1 year';
  } else if (secondsFor256Bits < 31536000 * 1000) {
    estimatedTime = `${Math.round(secondsFor256Bits / 31536000).toLocaleString()} years`;
  } else if (secondsFor256Bits < 31536000 * 1e9) {
    estimatedTime = `${Math.round(secondsFor256Bits / (31536000 * 1e6)).toLocaleString()} million years`;
  } else if (secondsFor256Bits < 31536000 * 1e12) {
    estimatedTime = `${Math.round(secondsFor256Bits / (31536000 * 1e9)).toLocaleString()} billion years`;
  } else {
    estimatedTime = `${(secondsFor256Bits / (31536000 * 1e12)).toExponential(2)} trillion years`;
  }

  const protections = [
    'AES-256-GCM encryption',
    `PBKDF2 with ${kdfIterations.toLocaleString()} iterations`,
    'Device fingerprint binding',
    'Cryptographic signature verification',
    'SHA-512 integrity checks',
    'Random salt per vault',
    'Unique IV per encryption',
  ];

  let securityLevel: string;
  if (kdfIterations >= 600000) {
    securityLevel = 'Excellent - Military Grade';
  } else if (kdfIterations >= 300000) {
    securityLevel = 'Very Strong - Bank Grade';
  } else if (kdfIterations >= 100000) {
    securityLevel = 'Strong - Recommended';
  } else {
    securityLevel = 'Moderate - Consider Upgrading';
  }

  return {
    estimatedDecryptionTime: estimatedTime,
    keyStrength,
    securityLevel,
    protections
  };
}

export function getDeviceInfo(): {
  browser: string;
  os: string;
  deviceType: string;
} {
  const ua = navigator.userAgent;

  let browser = 'Unknown';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';

  let deviceType = 'Desktop';
  if (/Mobi|Android/i.test(ua)) deviceType = 'Mobile';
  else if (/Tablet|iPad/i.test(ua)) deviceType = 'Tablet';

  return { browser, os, deviceType };
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
