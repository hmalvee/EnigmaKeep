import { calculatePasswordStrength } from './passwordStrength';

/**
 * Offline-attack estimate for a stolen vault file. The AES key is 256-bit, but
 * an attacker never attacks it directly: they guess master passwords, each
 * guess costing one PBKDF2 run. So the master password sets the real limit.
 */

// One high-end GPU manages roughly 15k PBKDF2-SHA256 guesses/s at 600k
// iterations; assume a well-funded attacker with 100 of them.
const GUESSES_PER_SECOND_AT_600K = 1.5e6;
const SECONDS_PER_YEAR = 31536000;

export interface SecurityMetrics {
  estimatedCrackTime: string;
  passwordEntropyBits: number;
  securityLevel: string;
  levelTone: 'success' | 'warning' | 'danger';
  protections: string[];
}

function formatDuration(seconds: number): string {
  if (seconds < 1) return 'Instantly';
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < SECONDS_PER_YEAR) return `${Math.round(seconds / 86400)} days`;
  const years = seconds / SECONDS_PER_YEAR;
  if (years < 1e3) return `${Math.round(years).toLocaleString()} years`;
  if (years < 1e6) return `${Math.round(years / 1e3).toLocaleString()} thousand years`;
  if (years < 1e9) return `${Math.round(years / 1e6).toLocaleString()} million years`;
  return 'Billions of years or more';
}

export function calculateSecurityMetrics(
  masterPassword: string,
  kdfIterations: number = 600000,
  recoveryAlwaysCurrent: boolean = false
): SecurityMetrics {
  const strength = calculatePasswordStrength(masterPassword);
  // Common/dictionary passwords fall to wordlists regardless of length.
  const entropy = strength.isCommon ? 0 : Math.round(strength.entropy);

  const guessesPerSecond = GUESSES_PER_SECOND_AT_600K * (600000 / kdfIterations);
  // On average the attacker finds it halfway through the search space.
  const seconds = Math.pow(2, entropy) / 2 / guessesPerSecond;

  let securityLevel: string;
  let levelTone: SecurityMetrics['levelTone'];
  if (entropy >= 80) {
    securityLevel = 'Strong';
    levelTone = 'success';
  } else if (entropy >= 60) {
    securityLevel = 'Moderate';
    levelTone = 'warning';
  } else {
    securityLevel = 'Weak — use a longer master password';
    levelTone = 'danger';
  }

  return {
    estimatedCrackTime: formatDuration(seconds),
    passwordEntropyBits: entropy,
    securityLevel,
    levelTone,
    protections: [
      'AES-256-GCM authenticated encryption',
      `PBKDF2-SHA256 with ${kdfIterations.toLocaleString()} iterations`,
      'Random 256-bit salt and unique IV on every save',
      'Opaque vault file (no readable headers or metadata)',
      ...(recoveryAlwaysCurrent ? ['Recovery copy re-encrypted on every save'] : []),
      'Clipboard cleared automatically after copying'
    ]
  };
}
