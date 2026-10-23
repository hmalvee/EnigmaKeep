import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Users, Download, RefreshCw, Trash2, Plus, X } from 'lucide-react';
import type { VaultData } from '../types/vault';
import {
  createSocialRecovery,
  rotatePuzzle,
  configSchedule,
  validateSchedule,
  MAX_TIERS,
  type SocialRecoveryConfig,
  type ScheduleEntry
} from '../crypto/socialRecovery';
import { FAST_CPU_SQUARINGS_PER_SECOND, SPECIALISED_HARDWARE_FACTOR } from '../crypto/timelock';

interface Props {
  vault: VaultData;
  /** Persist the new configuration (undefined turns guardian recovery off). */
  onSave: (config: SocialRecoveryConfig | undefined) => Promise<void>;
}

const DELAY_OPTIONS = [1, 3, 7, 14, 30];
const DAY = 86400;

/** Schedule as text, e.g. "2 of 5: 30 days · 3 of 5: 7 days". */
function describeSchedule(schedule: ScheduleEntry[], guardians: number): string {
  return schedule.map(t => `${t.threshold} of ${guardians}: ${formatDays(t.delaySeconds)}`).join(' · ');
}

function formatDays(seconds: number): string {
  const days = seconds / DAY;
  return days >= 1 ? `${Math.round(days * 10) / 10} days` : `${Math.round(seconds / 3600)} hours`;
}

async function downloadShareCard(label: string, share: string, setup: SocialRecoveryConfig) {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 800, 900);
  ctx.fillStyle = '#111111';
  ctx.textAlign = 'center';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.fillText('EnigmaKeep Guardian Share', 400, 70);
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillText(`For: ${label}`, 400, 110);

  const qr = new Image();
  qr.src = await QRCode.toDataURL(share, { errorCorrectionLevel: 'M', margin: 2, width: 400 });
  await new Promise(resolve => (qr.onload = resolve));
  ctx.drawImage(qr, 200, 140, 400, 400);

  ctx.font = 'bold 17px ui-monospace, monospace';
  const half = Math.ceil(share.length / 2);
  ctx.fillText(share.slice(0, half), 400, 585);
  ctx.fillText(share.slice(half), 400, 612);

  ctx.textAlign = 'left';
  ctx.font = '20px system-ui, sans-serif';
  const schedule = configSchedule(setup);
  const scheduleLines = schedule.length > 1
    ? [
        'Recovery then needs a computer to work for a minimum time, which gives',
        'the owner time to notice and cancel. More guardians means a shorter wait:',
        ...schedule.map(t => `  ${t.threshold} of ${setup.guardians.length} guardians: about ${formatDays(t.delaySeconds)}`)
      ]
    : [
        'vault file. Recovery then needs a computer to work for several days,',
        'which gives the owner time to notice and cancel.'
      ];
  [
    `You are one of ${setup.guardians.length} guardians. ${setup.threshold} of you together can start`,
    'recovering this vault for its owner (or their family), together with the',
    ...(schedule.length > 1 ? ['vault file.'] : []),
    ...scheduleLines,
    '',
    'Keep this card private. Only hand it over if the owner asks you to,',
    'or if they cannot (e.g. after their death, per their wishes).',
    '',
    'A share alone reveals nothing about the vault.'
  ].forEach((line, i) => ctx.fillText(line, 50, 660 + i * 24));

  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EnigmaKeep-Guardian-${label.replace(/[^a-z0-9]+/gi, '-')}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function ShareQr({ share }: { share: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    QRCode.toDataURL(share, { errorCorrectionLevel: 'M', margin: 2, width: 180 }).then(setSrc).catch(() => setSrc(''));
  }, [share]);
  return src ? <img src={src} alt="Guardian share QR code" width={180} height={180} /> : null;
}

export function GuardianRecoverySettings({ vault, onSave }: Props) {
  const config = vault.socialRecovery;
  const [labels, setLabels] = useState<string[]>(['', '', '']);
  // Delay schedule: more guardians, shorter wait. One row is the plain protocol.
  const [schedule, setSchedule] = useState<{ threshold: number; delayDays: number }[]>([{ threshold: 2, delayDays: 7 }]);
  const [specialisedHardware, setSpecialisedHardware] = useState(false);
  const [pending, setPending] = useState<{ config: SocialRecoveryConfig; shares: string[] } | null>(null);
  const [downloaded, setDownloaded] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const rate = FAST_CPU_SQUARINGS_PER_SECOND * (specialisedHardware ? SPECIALISED_HARDWARE_FACTOR : 1);
  const filledLabels = labels.map(l => l.trim()).filter(Boolean);
  const guardianCount = Math.max(filledLabels.length, 2);
  const scheduleSeconds: ScheduleEntry[] = schedule.map(t => ({ threshold: t.threshold, delaySeconds: t.delayDays * DAY }));
  const scheduleProblem = validateSchedule(scheduleSeconds, guardianCount);
  const updateTier = (i: number, patch: Partial<{ threshold: number; delayDays: number }>) =>
    setSchedule(schedule.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  const addTier = () => {
    const last = schedule[schedule.length - 1];
    const nextDelay = DELAY_OPTIONS.filter(d => d < last.delayDays).pop() ?? 1;
    setSchedule([...schedule, { threshold: Math.min(last.threshold + 1, guardianCount), delayDays: nextDelay }]);
  };

  const flash = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 4000);
  };

  if (!vault.recoveryEncKey) {
    return (
      <div className="bg-surface border border-line rounded-xl px-5 py-4">
        <h3 className="text-[15px] font-semibold text-ink mb-1 flex items-center gap-2">
          <Users size={16} className="text-accent" /> Guardian recovery
        </h3>
        <p className="text-sm text-muted">
          Regenerate your recovery phrase first. Guardian recovery is stored next to an up-to-date recovery copy.
        </p>
      </div>
    );
  }

  const handleCreate = async () => {
    setBusy(true);
    try {
      const result = await createSocialRecovery({
        guardianLabels: filledLabels,
        threshold: scheduleSeconds[0].threshold,
        delaySeconds: scheduleSeconds[0].delaySeconds,
        schedule: scheduleSeconds,
        assumedSquaringsPerSecond: rate
      });
      setPending(result);
      setDownloaded(new Set());
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await onSave(pending.config);
      setPending(null);
      flash('Guardian recovery is on. Give each guardian their card.');
    } finally {
      setBusy(false);
    }
  };

  const handleRotate = async () => {
    if (!config) return;
    setBusy(true);
    try {
      await onSave(await rotatePuzzle(config));
      flash('Recovery puzzle replaced. Any recovery work already under way no longer opens your new saves.');
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    if (!window.confirm('Turn off guardian recovery? Existing guardian cards will stop working for future saves.')) return;
    setBusy(true);
    try {
      await onSave(undefined);
      flash('Guardian recovery turned off.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-surface border border-line rounded-xl px-5 py-4 space-y-4">
      <h3 className="text-[15px] font-semibold text-ink flex items-center gap-2 -mb-2">
        <Users size={16} className="text-accent" /> Guardian recovery
      </h3>
      <p className="text-sm text-muted">
        Let trusted people recover your vault if you can't, with no server involved. A set number of guardians must combine
        their cards <em>and</em> have your vault file, and then a computer has to work for a minimum time you choose.
        That delay is your window to notice and cancel.
      </p>

      {message && <p className="text-sm text-success">{message}</p>}

      {config && !pending && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div><div className="text-muted">Guardians</div><div className="text-ink font-medium">{config.threshold} of {config.guardians.length}</div></div>
            <div><div className="text-muted">Minimum delay</div><div className="text-ink font-medium">{formatDays(config.delaySeconds)}</div></div>
            <div><div className="text-muted">Puzzle version</div><div className="text-ink font-medium">#{config.epoch}</div></div>
            <div><div className="text-muted">Set up</div><div className="text-ink font-medium">{new Date(config.createdAt).toLocaleDateString()}</div></div>
          </div>
          {configSchedule(config).length > 1 && (
            <p className="text-xs text-muted">Delay schedule: {describeSchedule(configSchedule(config), config.guardians.length)}</p>
          )}
          <p className="text-xs text-muted">Guardians: {config.guardians.map(g => g.label).join(', ')}</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleRotate} disabled={busy} className="btn-ghost gap-2 disabled:opacity-50">
              <RefreshCw size={16} /> Cancel pending recoveries (new puzzle)
            </button>
            <button onClick={handleDisable} disabled={busy} className="btn-ghost gap-2 text-danger disabled:opacity-50">
              <Trash2 size={16} /> Turn off
            </button>
          </div>
          <p className="text-xs text-muted">
            "Cancel pending recoveries" keeps your guardians' cards but replaces the puzzle, so work started on an older
            copy of your vault file won't open what you save from now on. It can't protect a copy someone already took.
          </p>
          <label className="flex items-start gap-3 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={config.rotateOnSave !== false}
              disabled={busy}
              onChange={async (e) => {
                setBusy(true);
                try {
                  await onSave({ ...config, rotateOnSave: e.target.checked });
                } finally {
                  setBusy(false);
                }
              }}
              className="mt-0.5 h-4 w-4 accent-accent"
            />
            <span>
              Replace the puzzle on every save (recommended). Guardians who finish the delay then open only the version
              they started from, never anything you saved since. Adds about 40 ms to each save.
            </span>
          </label>
        </div>
      )}

      {!config && !pending && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-ink">Guardians (names for your reference)</label>
            {labels.map((label, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={label}
                  onChange={e => setLabels(labels.map((l, j) => (j === i ? e.target.value : l)))}
                  className="ai-input"
                  placeholder={`Guardian ${i + 1}`}
                />
                {labels.length > 2 && (
                  <button
                    onClick={() => setLabels(labels.filter((_, j) => j !== i))}
                    className="btn-ghost"
                    aria-label="Remove guardian"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            {labels.length < 10 && (
              <button onClick={() => setLabels([...labels, ''])} className="btn-ghost gap-2 text-sm">
                <Plus size={16} /> Add guardian
              </button>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-ink">Guardians needed and minimum delay</div>
            {schedule.map((tier, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                <label className="text-sm text-ink">
                  {i === 0 ? 'Guardians needed' : `Or, with more guardians`}
                  <select
                    value={tier.threshold}
                    onChange={e => updateTier(i, { threshold: parseInt(e.target.value) })}
                    className="ai-input mt-1"
                    aria-label={`Guardians needed, tier ${i + 1}`}
                  >
                    {Array.from({ length: guardianCount - 1 }, (_, k) => k + 2).map(k => (
                      <option key={k} value={k}>{k} of {guardianCount}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-ink">
                  Minimum delay
                  <select
                    value={tier.delayDays}
                    onChange={e => updateTier(i, { delayDays: parseInt(e.target.value) })}
                    className="ai-input mt-1"
                    aria-label={`Minimum delay, tier ${i + 1}`}
                  >
                    {DELAY_OPTIONS.map(d => (
                      <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </label>
                {i > 0 ? (
                  <button onClick={() => setSchedule(schedule.filter((_, j) => j !== i))} className="btn-ghost" aria-label="Remove tier">
                    <X size={16} />
                  </button>
                ) : <span />}
              </div>
            ))}
            {schedule.length < MAX_TIERS && schedule[schedule.length - 1].threshold < guardianCount && (
              <button onClick={addTier} className="btn-ghost gap-2 text-sm">
                <Plus size={16} /> Add a faster tier for more guardians
              </button>
            )}
            <p className="text-xs text-muted">
              Each extra tier lets a larger group of guardians recover sooner, for example 2 of 5 wait 30 days but all 5
              together wait only 1 day. A smaller group cannot use a larger group's shorter wait.
            </p>
            {scheduleProblem && filledLabels.length >= 2 && <p className="text-xs text-danger">{scheduleProblem}</p>}
          </div>

          <label className="flex items-start gap-2 text-sm text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={specialisedHardware}
              onChange={e => setSpecialisedHardware(e.target.checked)}
              className="mt-1"
            />
            <span>
              Hold the delay even against specialised hardware ({SPECIALISED_HARDWARE_FACTOR}x a fast PC). Honest
              recovery then takes about {SPECIALISED_HARDWARE_FACTOR}x longer too.
            </span>
          </label>

          <button
            onClick={handleCreate}
            disabled={busy || filledLabels.length < 2 || !!scheduleProblem}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? 'Creating…' : 'Create guardian cards'}
          </button>
        </div>
      )}

      {pending && (
        <div className="space-y-4">
          <p className="text-sm text-ink">
            Download each guardian's card and give it to them privately. The cards are shown only now; they are not stored
            in your vault.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {pending.config.guardians.map((g, i) => (
              <div key={g.index} className="border border-line rounded-xl p-4 flex flex-col items-center gap-2">
                <div className="font-medium text-ink">{g.label}</div>
                <div className="bg-white rounded-lg p-2">
                  <ShareQr share={pending.shares[i]} />
                </div>
                <button
                  onClick={async () => {
                    await downloadShareCard(g.label, pending.shares[i], pending.config);
                    setDownloaded(prev => new Set(prev).add(i));
                  }}
                  className="btn-ghost gap-2 text-sm"
                >
                  <Download size={16} /> {downloaded.has(i) ? 'Downloaded' : 'Download card'}
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setPending(null)} disabled={busy} className="btn-ghost">Cancel</button>
            <button
              onClick={handleConfirm}
              disabled={busy || downloaded.size < pending.shares.length}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Turn on guardian recovery
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
