/**
 * Layout of the vault file that is currently open, kept outside React state.
 *
 * A vault file is `visible block chain || region`. The region is random
 * padding that may hold a hidden vault (see crypto/hiddenVault.ts). Each
 * session only ever rewrites its own part and copies the other byte for
 * byte, which is what keeps a hidden vault alive across decoy saves and a
 * decoy alive across real saves.
 */

export interface FileLayout {
  /** 'visible': this session's vault is the visible chain. 'hidden': it lives in the region. */
  kind: 'visible' | 'hidden';
  /** Bytes of the visible block chain. Preserved by hidden sessions. */
  visibleBytes: Uint8Array;
  /** Bytes after the visible chain. Preserved by visible sessions. */
  regionBytes: Uint8Array;
}

let layout: FileLayout | null = null;

export function setSessionLayout(next: FileLayout | null): void {
  layout = next;
}

export function getSessionLayout(): FileLayout | null {
  return layout;
}

export function clearSessionLayout(): void {
  layout = null;
}
