import { useEffect, useRef, useState } from 'react';
import { Copy, Check, Play, Loader } from 'lucide-react';
import { VaultShell } from '../components/VaultShell';
import { FAST_CPU_SQUARINGS_PER_SECOND } from '../crypto/timelock';
import type { BenchMessage, BenchRequest, BenchSeries } from '../workers/squaringBench.worker';

const BITS = [2048, 3072];
const RUN_MS = 2000;
const RUNS = 5;
const DELAY_DAYS = [1, 7, 30];

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function sd(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}

function deviceInfo() {
  const nav = navigator as Navigator & { deviceMemory?: number; userAgentData?: { platform?: string } };
  return {
    userAgent: navigator.userAgent,
    cores: navigator.hardwareConcurrency ?? 0,
    memoryGb: nav.deviceMemory ?? 0,
    platform: nav.userAgentData?.platform ?? ''
  };
}

function browserName(userAgent: string): string {
  if (/Firefox\//.test(userAgent)) return 'Firefox';
  if (/Edg\//.test(userAgent)) return 'Edge';
  if (/OPR\//.test(userAgent)) return 'Opera';
  if (/Chrome\//.test(userAgent) && !/Chromium/.test(userAgent)) return 'Chrome';
  if (/Chromium/.test(userAgent)) return 'Chromium';
  if (/Safari\//.test(userAgent) && !/Chrome/.test(userAgent)) return 'Safari';
  return 'Unknown';
}

/**
 * Public benchmark page (/bench): measures this device's sequential squaring
 * rate, which sets how long an honest guardian recovery takes here, and
 * produces CSV lines for the research dataset.
 */
export function Bench() {
  const [label, setLabel] = useState('');
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState<{ bits: number; run: number; runs: number } | null>(null);
  const [series, setSeries] = useState<BenchSeries[] | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => () => workerRef.current?.terminate(), []);

  const run = () => {
    setRunning(true);
    setSeries(null);
    setError('');
    setProgress(null);
    const worker = new Worker(new URL('../workers/squaringBench.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onerror = () => {
      setError('The benchmark worker failed to start.');
      setRunning(false);
    };
    worker.onmessage = (event: MessageEvent<BenchMessage>) => {
      const msg = event.data;
      if (msg.type === 'status') setStatus(msg.message);
      else if (msg.type === 'progress') {
        setStatus(`${msg.bits}-bit: run ${msg.run} of ${msg.runs}, ${msg.nsPerSquaring.toFixed(0)} ns per squaring`);
        setProgress({ bits: msg.bits, run: msg.run, runs: msg.runs });
      } else if (msg.type === 'result') {
        setSeries(msg.series);
        setRunning(false);
        setStatus('');
        worker.terminate();
      } else {
        setError(msg.message);
        setRunning(false);
        worker.terminate();
      }
    };
    worker.postMessage({ bits: BITS, runMs: RUN_MS, runs: RUNS } satisfies BenchRequest);
  };

  const info = deviceInfo();
  const csv = series
    ? [
        'device_label,browser,user_agent,cores,memory_gb,bits,run,ns_per_squaring',
        ...series.flatMap(s =>
          s.nsPerSquaring.map((ns, i) =>
            [
              JSON.stringify(label || 'unnamed'),
              browserName(info.userAgent),
              JSON.stringify(info.userAgent),
              info.cores,
              info.memoryGb,
              s.bits,
              i,
              ns.toFixed(2)
            ].join(',')
          )
        )
      ].join('\n')
    : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(csv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy; select the text below and copy it by hand.');
    }
  };

  const totalRuns = BITS.length * RUNS;
  const doneRuns = progress ? BITS.indexOf(progress.bits) * RUNS + progress.run : 0;
  const base = series?.find(s => s.bits === 2048);
  const ns2048 = base ? mean(base.nsPerSquaring) : null;

  return (
    <VaultShell>
      <div className="glass-card w-full max-w-2xl p-6 sm:p-8 animate-scaleIn">
        <h1 className="text-2xl font-semibold text-ink">Device squaring benchmark</h1>
        <p className="mt-2 text-sm text-muted">
          Guardian recovery makes a computer perform a long chain of modular squarings. This page measures how fast this
          device does them, in a background thread, for about {Math.round((BITS.length * (RUNS * RUN_MS + 1000)) / 1000)}{' '}
          seconds. Nothing leaves your device; copy the result yourself if you want to share it.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="text-sm text-ink">
            Device name (optional, for the results table)
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="ai-input mt-1"
              placeholder="e.g. Pixel 8, MacBook Air M2"
              disabled={running}
            />
          </label>
          <button onClick={run} disabled={running} className="btn-primary gap-2 disabled:opacity-50">
            {running ? <Loader size={16} className="animate-spin" /> : <Play size={16} />}
            {running ? 'Measuring…' : series ? 'Run again' : 'Run benchmark'}
          </button>
        </div>

        {running && (
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
              <div className="h-full bg-accent transition-all" style={{ width: `${(doneRuns / totalRuns) * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted" aria-live="polite">{status}</p>
          </div>
        )}
        {error && <p className="mt-4 text-sm text-danger">{error}</p>}

        {series && (
          <div className="mt-6 space-y-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="pb-2 font-medium">Modulus</th>
                  <th className="pb-2 font-medium">ns per squaring</th>
                  <th className="pb-2 font-medium">Squarings per second</th>
                  <th className="pb-2 font-medium">vs. assumed attacker</th>
                </tr>
              </thead>
              <tbody className="text-ink">
                {series.map(s => {
                  const m = mean(s.nsPerSquaring);
                  return (
                    <tr key={s.bits} className="border-t border-line">
                      <td className="py-2">{s.bits}-bit</td>
                      <td className="py-2 tabular-nums">{m.toFixed(0)} ± {sd(s.nsPerSquaring).toFixed(0)}</td>
                      <td className="py-2 tabular-nums">{Math.round(1e9 / m).toLocaleString()}</td>
                      <td className="py-2 tabular-nums">
                        {s.bits === 2048 ? `${(FAST_CPU_SQUARINGS_PER_SECOND / (1e9 / m)).toFixed(1)}× slower` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {ns2048 && (
              <div className="rounded-lg border border-line bg-surface2 px-4 py-3 text-sm text-ink">
                <p className="font-medium">What a recovery would take on this device</p>
                <p className="mt-1 text-muted">
                  The owner sets the delay against an assumed attacker at {FAST_CPU_SQUARINGS_PER_SECOND.toLocaleString()}{' '}
                  squarings per second. At this device's rate, that delay becomes:
                </p>
                <ul className="mt-2 grid gap-1 sm:grid-cols-3">
                  {DELAY_DAYS.map(d => (
                    <li key={d} className="tabular-nums">
                      {d} day{d > 1 ? 's' : ''} → {(d * FAST_CPU_SQUARINGS_PER_SECOND * ns2048 * 1e-9).toFixed(1)} days
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">Results as CSV</p>
                <button onClick={copy} className="btn-ghost gap-2 text-sm">
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <textarea
                readOnly
                value={csv}
                rows={6}
                className="ai-input mt-2 w-full font-mono text-xs"
                aria-label="Benchmark results as CSV"
              />
              <p className="mt-1 text-xs text-muted">
                Browser: {browserName(info.userAgent)} · {info.cores || '?'} cores · {info.memoryGb ? `${info.memoryGb} GB` : 'memory unknown'}
              </p>
            </div>
          </div>
        )}
      </div>
    </VaultShell>
  );
}
