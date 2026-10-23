export interface PasswordOptions {
  length?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Uniform random integer in [0, max) from the system CSPRNG.
 * Rejection sampling avoids the modulo bias of `random % max`.
 */
function randomIndex(max: number): number {
  if (!Number.isInteger(max) || max <= 0 || max > 0x100000000) {
    throw new RangeError('randomIndex: max out of range');
  }
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
}

function pick(alphabet: string): string {
  return alphabet[randomIndex(alphabet.length)];
}

/** Fisher–Yates with CSPRNG indices; the sort-by-random trick is biased. */
function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function generatePassword(options: PasswordOptions = {}): string {
  const {
    length = 16,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true
  } = options;

  const alphabets: string[] = [];
  if (uppercase) alphabets.push(UPPERCASE);
  if (lowercase) alphabets.push(LOWERCASE);
  if (numbers) alphabets.push(NUMBERS);
  if (symbols) alphabets.push(SYMBOLS);
  if (alphabets.length === 0) alphabets.push(LOWERCASE, NUMBERS);

  const allChars = alphabets.join('');
  const targetLength = Math.max(Math.floor(length), alphabets.length);

  // One character from each selected class, then fill the rest uniformly.
  const chars = alphabets.map(pick);
  while (chars.length < targetLength) chars.push(pick(allChars));

  return shuffle(chars).join('');
}
