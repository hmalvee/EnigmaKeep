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
