/**
 * Module-scoped session secrets (outside React state) so passwords/phrases
 * are not kept in component state trees that serialize, log, or re-render.
 * Best-effort wipe on lock — JS strings are immutable, so this reduces exposure.
 */

let masterPassword: string | null = null;
let recoveryPhrase: string | null = null;

export function setSessionPassword(password: string): void {
  masterPassword = password;
}

export function getSessionPassword(): string | null {
  return masterPassword;
}

export function setSessionRecoveryPhrase(phrase: string | null): void {
  recoveryPhrase = phrase;
}

export function getSessionRecoveryPhrase(): string | null {
  return recoveryPhrase;
}

export function clearSessionSecrets(): void {
  masterPassword = null;
  recoveryPhrase = null;
}

export function hasSessionPassword(): boolean {
  return masterPassword !== null && masterPassword.length > 0;
}
