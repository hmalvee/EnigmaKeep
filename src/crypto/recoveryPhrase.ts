import * as bip39 from 'bip39';
import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

export function generateRecoveryPhrase(): string {
  return bip39.generateMnemonic(128);
}

export function validateRecoveryPhrase(phrase: string): boolean {
  return bip39.validateMnemonic(phrase);
}

function bitsToBase64(bits: ArrayBuffer): string {
  const bytes = new Uint8Array(bits);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Fingerprint of the recovery phrase (stored inside the encrypted vault JSON).
 * Not used as an encryption password.
 */
export async function deriveKeyFromRecoveryPhrase(phrase: string): Promise<string> {
  if (!validateRecoveryPhrase(phrase)) {
    throw new Error('Invalid recovery phrase');
  }

  const seed = await bip39.mnemonicToSeed(phrase);
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    seed.slice(0, 32),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode('EnigmaKeep-Recovery-Salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  const hashBuffer = await crypto.subtle.digest('SHA-256', derivedBits);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * High-entropy password material for encrypting the recovery block.
 * Prefer this over the raw mnemonic so the on-disk recovery ciphertext
 * is not encrypted under a low-entropy English phrase.
 */
export async function deriveRecoveryEncryptionPassword(phrase: string): Promise<string> {
  if (!validateRecoveryPhrase(phrase)) {
    throw new Error('Invalid recovery phrase');
  }

  const seed = await bip39.mnemonicToSeed(phrase);
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    seed.slice(0, 32),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode('EnigmaKeep-Recovery-Enc-v1'),
      iterations: 600000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  return bitsToBase64(derivedBits);
}

export function splitPhraseIntoWords(phrase: string): string[] {
  return phrase.trim().split(/\s+/);
}

export function getRandomWordIndices(totalWords: number, count: number): number[] {
  const indices: number[] = [];
  while (indices.length < count) {
    const randomIndex = Math.floor(Math.random() * totalWords);
    if (!indices.includes(randomIndex)) {
      indices.push(randomIndex);
    }
  }
  return indices.sort((a, b) => a - b);
}
