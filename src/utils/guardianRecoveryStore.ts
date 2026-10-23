/**
 * Checkpoints for an in-progress guardian recovery, so days of sequential
 * work survive reloads. A checkpoint is an intermediate power of the puzzle
 * start; it is useless without the guardian secret, which is never stored.
 */

const PREFIX = 'enigmakeep_guardian_progress:';
/** Abandoned checkpoints are dropped after this long. */
const MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

export interface SolveCheckpoint {
  value: string; // hex
  done: number;
  total: number;
  updatedAt: number;
}

function key(setId: string, epoch: number, tier: number): string {
  return `${PREFIX}${setId}:${epoch}:${tier}`;
}

/**
 * Only a checkpoint with the expected shape and the same total is returned;
 * anything else (hand-edited storage, an older puzzle) restarts from zero
 * rather than feeding the worker a value it cannot parse.
 */
export function loadCheckpoint(setId: string, epoch: number, tier: number, expectedTotal?: number): SolveCheckpoint | null {
  try {
    const raw = localStorage.getItem(key(setId, epoch, tier));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SolveCheckpoint> | null;
    if (
      !parsed ||
      typeof parsed.value !== 'string' ||
      !/^[0-9a-f]+$/i.test(parsed.value) ||
      !Number.isInteger(parsed.done) ||
      !Number.isInteger(parsed.total) ||
      typeof parsed.updatedAt !== 'number' ||
      parsed.done! < 0 ||
      parsed.done! > parsed.total! ||
      (expectedTotal !== undefined && parsed.total !== expectedTotal) ||
      Date.now() - parsed.updatedAt > MAX_AGE_MS
    ) {
      clearCheckpoint(setId, epoch, tier);
      return null;
    }
    return parsed as SolveCheckpoint;
  } catch {
    return null;
  }
}

export function saveCheckpoint(setId: string, epoch: number, tier: number, checkpoint: SolveCheckpoint): void {
  try {
    localStorage.setItem(key(setId, epoch, tier), JSON.stringify(checkpoint));
  } catch {
    /* storage unavailable: progress is kept only while the page stays open */
  }
}

export function clearCheckpoint(setId: string, epoch: number, tier: number): void {
  try {
    localStorage.removeItem(key(setId, epoch, tier));
  } catch {
    /* ignore */
  }
}
