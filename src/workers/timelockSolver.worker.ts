/// <reference lib="webworker" />
/**
 * Runs the sequential squarings for guardian recovery off the main thread and
 * reports progress after every chunk so the page can checkpoint it.
 */
import { solveSteps } from '../crypto/timelock';

export interface SolverStart {
  modulus: string; // hex
  value: string; // hex, current x
  done: number;
  total: number;
}

export type SolverMessage =
  | { type: 'progress'; value: string; done: number }
  | { type: 'done'; value: string };

const CHUNK = 50_000;

self.onmessage = (event: MessageEvent<SolverStart>) => {
  const { modulus, total } = event.data;
  const n = BigInt('0x' + modulus);
  let progress = { value: BigInt('0x' + event.data.value), done: event.data.done };
  while (progress.done < total) {
    progress = solveSteps(progress, total, n, CHUNK);
    (self as DedicatedWorkerGlobalScope).postMessage({
      type: 'progress',
      value: progress.value.toString(16),
      done: progress.done
    } satisfies SolverMessage);
  }
  (self as DedicatedWorkerGlobalScope).postMessage({
    type: 'done',
    value: progress.value.toString(16)
  } satisfies SolverMessage);
};
