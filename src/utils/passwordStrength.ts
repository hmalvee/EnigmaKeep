export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  feedback: string[];
  meetsMinimum: boolean;
  entropy: number;
  crackTime: string;
  isCommon: boolean;
}

import { isCommonPassword } from './commonPasswords';

function calculateEntropy(password: string): number {
  let poolSize = 0;

  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  return password.length * Math.log2(poolSize);
}

function estimateCrackTime(entropy: number): string {
  const guessesPerSecond = 1e10;
  const possibleCombinations = Math.pow(2, entropy);
  const seconds = possibleCombinations / (2 * guessesPerSecond);

  if (seconds < 1) return 'Instant';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;
  if (seconds < 3153600000) return `${Math.round(seconds / 31536000)} years`;
  return `${Math.round(seconds / 31536000000)} centuries`;
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const feedback: string[] = [];

  const entropy = calculateEntropy(password);
  const crackTime = estimateCrackTime(entropy);
  const isCommon = isCommonPassword(password);

  // Length check
  if (password.length < 8) {
    feedback.push('Password should be at least 8 characters');
  } else if (password.length < 12) {
    feedback.push('Consider using at least 12 characters for better security');
    score += 1;
  } else if (password.length >= 16) {
    score += 2;
  } else {
    score += 1.5;
  }

  // Character variety checks
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);

  if (!hasLowercase) feedback.push('Add lowercase letters');
  if (!hasUppercase) feedback.push('Add uppercase letters');
  if (!hasNumbers) feedback.push('Add numbers');
  if (!hasSymbols) feedback.push('Add symbols (!@#$%^&*)');

  const varietyCount = [hasLowercase, hasUppercase, hasNumbers, hasSymbols].filter(Boolean).length;
  score += varietyCount * 0.5;

  // Pattern checks
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeating characters');
    score -= 0.5;
  }

  if (/^[a-zA-Z]+$/.test(password)) {
    feedback.push('Mix letters with numbers and symbols');
  }

  if (/^[0-9]+$/.test(password)) {
    feedback.push('Don\'t use only numbers');
    score -= 1;
  }

  if (isCommon) {
    feedback.push('This is a commonly used password - avoid it!');
    score -= 2;
  }

  const commonPatterns = [
    /password/i,
    /123456/,
    /qwerty/i,
    /abc123/i,
    /admin/i,
    /letmein/i,
    /welcome/i
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      feedback.push('Avoid common words and patterns');
      score -= 1;
      break;
    }
  }

  // Sequential characters
  if (/abcd|bcde|cdef|1234|2345|3456|4567|5678|6789/i.test(password)) {
    feedback.push('Avoid sequential characters');
    score -= 0.5;
  }

  // Normalize score to 0-4 range
  score = Math.max(0, Math.min(4, score));

  // Determine label and color
  let label: string;
  let color: string;

  if (score < 1.5) {
    label = 'Very Weak';
    color = 'text-red-500';
  } else if (score < 2.5) {
    label = 'Weak';
    color = 'text-orange-500';
  } else if (score < 3.5) {
    label = 'Fair';
    color = 'text-yellow-500';
  } else if (score < 4) {
    label = 'Good';
    color = 'text-blue-500';
  } else {
    label = 'Strong';
    color = 'text-green-500';
  }

  // Check if meets minimum requirements
  const meetsMinimum =
    password.length >= 12 &&
    hasLowercase &&
    hasUppercase &&
    hasNumbers &&
    hasSymbols;

  if (!meetsMinimum && password.length >= 8) {
    feedback.unshift('Recommended: 12+ characters with mixed character types');
  }

  return {
    score,
    label,
    color,
    feedback,
    meetsMinimum,
    entropy,
    crackTime,
    isCommon
  };
}

export function getPasswordStrengthBarColor(score: number): string {
  if (score < 1.5) return 'bg-red-500';
  if (score < 2.5) return 'bg-orange-500';
  if (score < 3.5) return 'bg-yellow-500';
  if (score < 4) return 'bg-blue-500';
  return 'bg-green-500';
}
