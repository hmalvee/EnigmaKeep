/**
 * Client-side exponential backoff after failed unlock attempts.
 * Offline-only slowdown against casual password stuffing on a stolen device.
 * The counter lives in localStorage so that opening a new tab does not reset it.
 */

const STORAGE_KEY = 'enigmakeep_unlock_failures';
const MAX_DELAY_MS = 30_000;
const BASE_DELAY_MS = 500;
/** Forget old failures after this long without a new one. */
const FORGET_AFTER_MS = 60 * 60 * 1000;

interface FailureState {
  count: number;
  lastAt: number;
}

function readState(): FailureState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, lastAt: 0 };
    const parsed = JSON.parse(raw) as FailureState;
    if (typeof parsed.count !== 'number' || typeof parsed.lastAt !== 'number') {
      return { count: 0, lastAt: 0 };
    }
    if (Date.now() - parsed.lastAt > FORGET_AFTER_MS) {
      return { count: 0, lastAt: 0 };
    }
    return parsed;
  } catch {
    return { count: 0, lastAt: 0 };
  }
}

function writeState(state: FailureState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private mode */
  }
}

export function getUnlockFailureCount(): number {
  return readState().count;
}

export function getUnlockDelayMs(): number {
  const { count } = readState();
  if (count <= 0) return 0;
  const delay = BASE_DELAY_MS * Math.pow(2, Math.min(count - 1, 6));
  return Math.min(delay, MAX_DELAY_MS);
}

export function recordUnlockFailure(): void {
  const prev = readState();
  writeState({ count: prev.count + 1, lastAt: Date.now() });
}

export function clearUnlockFailures(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Wait out any pending backoff before an unlock attempt. */
export async function waitForUnlockBackoff(): Promise<number> {
  const delay = getUnlockDelayMs();
  if (delay <= 0) return 0;
  await new Promise(resolve => setTimeout(resolve, delay));
  return delay;
}
