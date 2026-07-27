/**
 * Single path for copying secrets: auto-clear after TTL, cancel prior timers,
 * and support an immediate wipe on vault lock.
 */

let clearTimer: number | undefined;
let lastCopied: string | null = null;

export async function secureCopy(
  text: string,
  ttlMs: number = 15_000
): Promise<void> {
  if (clearTimer !== undefined) {
    window.clearTimeout(clearTimer);
    clearTimer = undefined;
  }

  await navigator.clipboard.writeText(text);
  lastCopied = text;

  if (ttlMs > 0) {
    clearTimer = window.setTimeout(() => {
      void clearSecureClipboard();
    }, ttlMs);
  }
}

/** Wipe clipboard if it still holds our last secure copy (best-effort). */
export async function clearSecureClipboard(): Promise<void> {
  if (clearTimer !== undefined) {
    window.clearTimeout(clearTimer);
    clearTimer = undefined;
  }

  try {
    if (lastCopied !== null) {
      const current = await navigator.clipboard.readText().catch(() => null);
      if (current === null || current === lastCopied) {
        await navigator.clipboard.writeText('');
      }
    } else {
      await navigator.clipboard.writeText('');
    }
  } catch {
    try {
      await navigator.clipboard.writeText('');
    } catch {
      /* clipboard may be unavailable when document is not focused */
    }
  } finally {
    lastCopied = null;
  }
}
