/// <reference lib="webworker" />
/**
 * Measures how fast this device squares big integers modulo an RSA modulus,
 * which is the rate at which it could solve a guardian-recovery puzzle. Runs
 * off the main thread so the page stays responsive during the measurement.
 */
import { generateModulus } from '../crypto/timelock';

export interface BenchRequest {
  /** Modulus sizes to measure, e.g. [2048, 3072]. */
  bits: number[];
  /** Length of one timed run in milliseconds. */
  runMs: number;
  /** Timed runs per modulus size. */
  runs: number;
}

export interface BenchSeries {
  bits: number;
  /** Nanoseconds per squaring, one value per run. */
  nsPerSquaring: number[];
}

export type BenchMessage =
  | { type: 'status'; message: string }
  | { type: 'progress'; bits: number; run: number; runs: number; nsPerSquaring: number }
  | { type: 'result'; series: BenchSeries[] }
  | { type: 'error'; message: string };

const post = (message: BenchMessage) => (self as DedicatedWorkerGlobalScope).postMessage(message);

function timedRun(modulus: bigint, ms: number): number {
  let x = 3n;
  let count = 0;
  const start = performance.now();
  let elapsed = 0;
  while (elapsed < ms) {
    for (let i = 0; i < 1000; i++) x = (x * x) % modulus;
    count += 1000;
    elapsed = performance.now() - start;
  }
  return (elapsed * 1e6) / count;
}

self.onmessage = async (event: MessageEvent<BenchRequest>) => {
  const { bits, runMs, runs } = event.data;
  try {
    const series: BenchSeries[] = [];
    for (const size of bits) {
      post({ type: 'status', message: `Generating a ${size}-bit modulus…` });
      const { modulus } = await generateModulus(size);
      post({ type: 'status', message: `Warming up at ${size} bits…` });
      timedRun(modulus, Math.min(runMs, 1000));
      const samples: number[] = [];
      for (let run = 0; run < runs; run++) {
        const ns = timedRun(modulus, runMs);
        samples.push(ns);
        post({ type: 'progress', bits: size, run: run + 1, runs, nsPerSquaring: ns });
      }
      series.push({ bits: size, nsPerSquaring: samples });
    }
    post({ type: 'result', series });
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : 'Benchmark failed' });
  }
};
