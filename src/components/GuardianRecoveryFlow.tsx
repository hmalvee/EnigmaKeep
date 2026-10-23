import { useEffect, useRef, useState } from 'react';
import { Upload, QrCode, Plus, Loader, Check, Users } from 'lucide-react';
import type { VaultData } from '../types/vault';
import type { FileLayout } from '../utils/sessionFile';
import { parseGuardianShare, puzzleModulus, type ParsedGuardianShare } from '../crypto/socialRecovery';
import { measureSquaringsPerSecond } from '../crypto/timelock';
import {
  beginGuardianRecovery,
  finishGuardianRecovery,
  type GuardianRecoveryStart
} from '../utils/vaultManager';
import { loadCheckpoint, saveCheckpoint, clearCheckpoint } from '../utils/guardianRecoveryStore';
import type { SolverMessage, SolverStart } from '../workers/timelockSolver.worker';
import { SecretKeyScanner } from './SecretKeyScanner';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { calculatePasswordStrength } from '../utils/passwordStrength';

interface Props {
  onRecovered: (vault: VaultData, newPassword: string, file: File, handle: FileSystemFileHandle | null, layout: FileLayout) => Promise<void>;
}

type Stage = 'collect' | 'solving' | 'password';

const ESTIMATE_MARGIN = 1.1;

function formatDuration(seconds: number): string {
  if (!isFinite(seconds)) return '…';
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} min`;
  if (seconds < 2 * 86400) return `${Math.round(seconds / 3600)} h`;
  return `${Math.round((seconds / 86400) * 10) / 10} days`;
}

export function GuardianRecoveryFlow({ onRecovered }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [handle, setHandle] = useState<FileSystemFileHandle | null>(null);
  const [shareInputs, setShareInputs] = useState<string[]>(['', '']);
  const [scanningIndex, setScanningIndex] = useState<number | null>(null);
  const [stage, setStage] = useState<Stage>('collect');
  const [recovery, setRecovery] = useState<GuardianRecoveryStart | null>(null);
  const [done, setDone] = useState(0);
  const [rate, setRate] = useState(0);
  const [recoveredVault, setRecoveredVault] = useState<VaultData | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  // What the cards typed so far would unlock, computed before any file is needed.
  const [preview, setPreview] = useState<{ cards: number; tier: number; thresholds: number[] } | null>(null);

  useEffect(() => () => workerRef.current?.terminate(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const parsed = await Promise.all(shareInputs.filter(s => s.trim()).map(parseGuardianShare));
      const valid = parsed.filter((p): p is ParsedGuardianShare => p !== null);
      if (cancelled || valid.length === 0) {
        if (!cancelled) setPreview(null);
        return;
      }
      const thresholds = valid[0].tiers.map(t => t.threshold);
      let tier = -1;
      for (let j = 0; j < thresholds.length; j++) if (thresholds[j] <= valid.length) tier = j;
      setPreview({ cards: valid.length, tier, thresholds });
    })();
    return () => {
      cancelled = true;
    };
  }, [shareInputs]);

  const pickFile = async () => {
    try {
      if ('showOpenFilePicker' in window) {
        const [h] = await (window as unknown as {
          showOpenFilePicker: (o: object) => Promise<FileSystemFileHandle[]>;
        }).showOpenFilePicker({
          types: [{ description: 'Vault File', accept: { 'application/octet-stream': ['.dat', '.enc'] } }]
        });
        setHandle(h);
        setFile(await h.getFile());
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.dat,.enc';
        input.onchange = () => {
          const f = input.files?.[0];
          if (f) {
            setFile(f);
            setHandle(null);
          }
        };
        input.click();
      }
    } catch {
      /* picker cancelled */
    }
  };

  const startSolving = (start: GuardianRecoveryStart) => {
    const { params } = start;
    const tier = params.tier ?? 0;
    const checkpoint = loadCheckpoint(params.setId, params.epoch, tier, params.squarings);
    const initial: SolverStart = {
      modulus: params.modulus,
      value: checkpoint?.value ?? start.start.toString(16),
      done: checkpoint?.done ?? 0,
      total: params.squarings
    };
    setDone(initial.done);
    setRate(measureSquaringsPerSecond(puzzleModulus(params)));
    setStage('solving');

    const worker = new Worker(new URL('../workers/timelockSolver.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onerror = () => {
      // A crashed worker would otherwise leave the screen on "in progress" forever.
      worker.terminate();
      workerRef.current = null;
      clearCheckpoint(params.setId, params.epoch, tier);
      setError('The recovery computation failed. Please check the shares and start again.');
      setStage('collect');
    };
    worker.onmessage = async (event: MessageEvent<SolverMessage>) => {
      const msg = event.data;
      if (msg.type === 'progress') {
        setDone(msg.done);
        saveCheckpoint(params.setId, params.epoch, tier, {
          value: msg.value,
          done: msg.done,
          total: params.squarings,
          updatedAt: Date.now()
        });
        return;
      }
      worker.terminate();
      workerRef.current = null;
      try {
        const vault = await finishGuardianRecovery(file!, start, BigInt('0x' + msg.value));
        clearCheckpoint(params.setId, params.epoch, tier);
        setRecoveredVault(vault);
        setStage('password');
      } catch (err: unknown) {
        clearCheckpoint(params.setId, params.epoch, tier);
        setError(err instanceof Error ? err.message : 'Recovery failed');
        setStage('collect');
      }
    };
    worker.postMessage(initial);
  };

  const handleCheckShares = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const parsed = await Promise.all(shareInputs.filter(s => s.trim()).map(parseGuardianShare));
      if (parsed.some(p => p === null)) {
        setError('One of the guardian cards has a typo. Check it or scan the QR code.');
        return;
      }
      const start = await beginGuardianRecovery(file, parsed as ParsedGuardianShare[]);
      setRecovery(start);
      startSolving(start);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'These cards do not unlock this vault file');
    } finally {
      setBusy(false);
    }
  };

  const handleFinish = async () => {
    if (!recoveredVault || !file || !recovery || newPassword !== confirmPassword) return;
    const strength = calculatePasswordStrength(newPassword);
    if (!strength.meetsMinimum || strength.isCommon) {
      setError('Choose a stronger master password.');
      return;
    }
    setBusy(true);
    try {
      await onRecovered(recoveredVault, newPassword, file, handle, recovery.layout);
    } finally {
      setBusy(false);
    }
  };

  if (stage === 'solving' && recovery) {
    const total = recovery.params.squarings;
    // Browser workers run ~5-8% slower than the calibration loop; pad the estimate.
    const remaining = rate > 0 ? ((total - done) / rate) * ESTIMATE_MARGIN : Infinity;
    const percent = Math.min(100, (done / total) * 100);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-ink font-medium">
          <Loader size={18} className="animate-spin" /> Recovery in progress
        </div>
        <div className="w-full h-3 rounded-full bg-ink/10 overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${percent}%` }} />
        </div>
        <div className="text-sm text-muted space-y-1">
          <p>{percent.toFixed(2)}% · about {formatDuration(remaining)} left on this device</p>
          <p>
            {recovery.cards} card{recovery.cards === 1 ? '' : 's'} unlocked
            {recovery.params.schedule && recovery.params.schedule.length > 1 ? ` tier ${recovery.tier + 1} of ${recovery.params.schedule.length}: ` : ' '}
            a minimum delay of {formatDuration(recovery.params.delaySeconds)} against a fast computer. This
            browser is slower, so it takes longer. Keep this tab open; progress is saved, so you can close it and resume
            later with the same cards and vault file.
          </p>
          {recovery.params.schedule && recovery.tier < recovery.params.schedule.length - 1 && (
            <p>
              With {recovery.params.schedule[recovery.tier + 1].threshold} cards the wait would be{' '}
              {formatDuration(recovery.params.schedule[recovery.tier + 1].delaySeconds)}. You can start again with more cards at any time.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (stage === 'password') {
    return (
      <div className="space-y-4">
        <p className="text-success flex items-center gap-2"><Check size={18} /> Vault recovered. Set a new master password.</p>
        {error && <p className="text-sm text-danger">{error}</p>}
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="ai-input" placeholder="New master password" />
        {newPassword && <PasswordStrengthMeter password={newPassword} />}
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="ai-input" placeholder="Confirm new master password" />
        <button
          onClick={handleFinish}
          disabled={busy || !newPassword || newPassword !== confirmPassword}
          className="w-full btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? 'Saving…' : 'Save and open vault'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted flex gap-2">
        <Users size={18} className="flex-shrink-0 mt-0.5" />
        Recover a vault with its guardians' cards. You need the vault file and enough cards; then this device works for
        the delay the owner chose.
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}

      <button onClick={pickFile} className="w-full px-4 py-3 border-2 border-dashed border-line rounded-xl flex items-center justify-center gap-2 text-ink">
        <Upload size={20} /> {file ? file.name : 'Select Vault File'}
      </button>

      {shareInputs.map((value, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={value}
            onChange={e => setShareInputs(shareInputs.map((v, j) => (j === i ? e.target.value : v)))}
            className="ai-input font-mono"
            placeholder={`Guardian card ${i + 1} (EKG…)`}
            autoComplete="off"
            spellCheck={false}
          />
          <button onClick={() => setScanningIndex(i)} className="btn-ghost" aria-label="Scan guardian card">
            <QrCode size={20} />
          </button>
        </div>
      ))}
      {shareInputs.length < 10 && (
        <button onClick={() => setShareInputs([...shareInputs, ''])} className="btn-ghost gap-2 text-sm">
          <Plus size={16} /> Add another card
        </button>
      )}

      {preview && preview.thresholds.length > 1 && (
        <div className="rounded-lg border border-line bg-surface2 px-3 py-2 text-xs text-muted">
          <p className="font-medium text-ink">These cards have a graded delay: more cards, shorter wait.</p>
          <p className="mt-1">
            Tiers need {preview.thresholds.join(', ')} cards. With your {preview.cards} card{preview.cards === 1 ? '' : 's'} you{' '}
            {preview.tier < 0
              ? `unlock nothing yet (${preview.thresholds[0]} needed).`
              : `unlock tier ${preview.tier + 1} of ${preview.thresholds.length}${preview.tier < preview.thresholds.length - 1 ? `; ${preview.thresholds[preview.tier + 1] - preview.cards} more would unlock the next, faster tier.` : ', the fastest.'}`}
            {' '}The exact waits are shown once the vault file is checked.
          </p>
        </div>
      )}

      <button
        onClick={handleCheckShares}
        disabled={busy || !file || shareInputs.filter(s => s.trim()).length < 2}
        className="w-full btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? 'Checking cards…' : 'Check cards and start recovery'}
      </button>

      {scanningIndex !== null && (
        <SecretKeyScanner
          prompt="Point the camera at the guardian card's QR code"
          onDetected={text => {
            setShareInputs(shareInputs.map((v, j) => (j === scanningIndex ? text : v)));
            setScanningIndex(null);
          }}
          onClose={() => setScanningIndex(null)}
        />
      )}
    </div>
  );
}
