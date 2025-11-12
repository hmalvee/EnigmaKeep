import argon2 from 'argon2-browser';

export interface Argon2Options {
  timeCost: number;
  memoryCost: number;
  parallelism: number;
  hashLength: number;
}

const DEFAULT_OPTIONS: Argon2Options = {
  timeCost: 3,
  memoryCost: 65536,
  parallelism: 4,
  hashLength: 32
};

export async function deriveKeyArgon2(
  password: string,
  salt: Uint8Array,
  options: Partial<Argon2Options> = {}
): Promise<Uint8Array> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const result = await argon2.hash({
    pass: password,
    salt: salt,
    time: opts.timeCost,
    mem: opts.memoryCost,
    parallelism: opts.parallelism,
    hashLen: opts.hashLength,
    type: argon2.ArgonType.Argon2id
  });

  return result.hash;
}

export async function importArgon2KeyForAES(keyBytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
