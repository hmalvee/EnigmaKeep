import { useState, type ReactNode } from 'react';
import { ArrowRight, Check, Copy, Download, AlertTriangle, ArrowLeft, Eye, EyeOff, Loader, Circle } from 'lucide-react';
import { generateRecoveryPhrase, deriveKeyFromRecoveryPhrase, splitPhraseIntoWords, getRandomWordIndices } from '../crypto/recoveryPhrase';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { calculatePasswordStrength } from '../utils/passwordStrength';
import { secureCopy } from '../utils/secureClipboard';
import { generateSecretKey } from '../crypto/secretKey';
import { SecretKeyKit } from './SecretKeyKit';

interface Props {
  onComplete: (password: string, recoveryPhraseHash: string, fileHandle: FileSystemFileHandle | null, phrase: string, secretKey: string) => Promise<void>;
  onCancel: () => void;
  error: string;
}

type Step = 'password' | 'display' | 'verify' | 'secretKey';

const STEPS: { id: Step; label: string }[] = [
  { id: 'password', label: 'Password' },
  { id: 'display', label: 'Recovery phrase' },
  { id: 'verify', label: 'Confirm' },
  { id: 'secretKey', label: 'Secret Key' }
];

function passwordRules(password: string) {
  return [
    { label: 'At least 12 characters', ok: password.length >= 12 },
    { label: 'Upper and lower case letters', ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'A number', ok: /\d/.test(password) },
    { label: 'A symbol', ok: /[^A-Za-z0-9]/.test(password) }
  ];
}

export function CreateVaultFlow({ onComplete, onCancel, error }: Props) {
  const [step, setStep] = useState<Step>('password');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmDownload, setConfirmDownload] = useState(false);
  const [manualConfirm, setManualConfirm] = useState(false);
  const [verificationIndices, setVerificationIndices] = useState<number[]>([]);
  const [verificationAnswers, setVerificationAnswers] = useState<{ [key: number]: string }>({});
  const [verificationError, setVerificationError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [secretKeySaved, setSecretKeySaved] = useState(false);
  const [secretKeyConfirm, setSecretKeyConfirm] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState('');

  const words = splitPhraseIntoWords(recoveryPhrase);
  const strength = calculatePasswordStrength(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const passwordReady = strength.meetsMinimum && !strength.isCommon && passwordsMatch;

  const handlePasswordSubmit = () => {
    if (!passwordReady) return;
    setRecoveryPhrase(generateRecoveryPhrase());
    setStep('display');
  };

  const handleCopy = async () => {
    await secureCopy(recoveryPhrase, 60_000);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = `EnigmaKeep Recovery Phrase

IMPORTANT: Keep this phrase safe and secret!
This is the ONLY way to recover your vault if you forget your master password.

Your 12-word recovery phrase:
${recoveryPhrase}

Instructions:
1. Write this phrase down on paper
2. Store it in a secure location (safe, safety deposit box)
3. NEVER share it with anyone
4. NEVER store it digitally (photos, notes apps, cloud storage)

Created: ${new Date().toLocaleString()}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'EnigmaKeep-Recovery-Phrase.txt';
    a.click();
    URL.revokeObjectURL(url);
    setConfirmDownload(true);
  };

  const handleContinueToVerify = () => {
    setVerificationIndices(getRandomWordIndices(words.length, 3));
    setVerificationAnswers({});
    setStep('verify');
  };

  const handleVerify = async () => {
    if (isVerifying || verificationIndices.some(index => !verificationAnswers[index]?.trim())) return;

    setIsVerifying(true);
    setVerificationError('');

    const allCorrect = verificationIndices.every(
      index => verificationAnswers[index]?.trim().toLowerCase() === words[index].toLowerCase()
    );

    if (allCorrect) {
      if (!secretKey) {
        setSecretKey(await generateSecretKey());
      }
      setStep('secretKey');
    } else {
      setVerificationError("Those words don't match your phrase. Check the numbers and try again.");
    }
    setIsVerifying(false);
  };

  const handleFinish = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    setFinishError('');
    try {
      let handle: FileSystemFileHandle | null = null;

      if ('showSaveFilePicker' in window) {
        handle = await (window as unknown as {
          showSaveFilePicker: (o: object) => Promise<FileSystemFileHandle>;
        }).showSaveFilePicker({
          suggestedName: `notes-${Date.now()}.dat`,
          types: [{
            description: 'Data File',
            accept: { 'application/octet-stream': ['.dat'] }
          }]
        });
      }

      const phraseHash = await deriveKeyFromRecoveryPhrase(recoveryPhrase);
      await onComplete(password, phraseHash, handle, recoveryPhrase, secretKey);
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('File save failed:', err);
        setFinishError(`Couldn't create the vault file${err?.message ? `: ${err.message}` : ''}. Try again.`);
      }
      setIsFinishing(false);
    }
  };

  const stepIndex = STEPS.findIndex(s => s.id === step);

  const frame = (title: string, subtitle: string, body: ReactNode) => (
    <div className="w-full">
      <ol className="flex items-center gap-2 mb-8" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s.id} className="flex-1" aria-current={i === stepIndex ? 'step' : undefined}>
            <div className={`h-1 rounded-full transition-colors duration-300 ${i <= stepIndex ? 'bg-accent' : 'bg-ink/10'}`} />
            <span className={`hidden sm:block mt-2 text-[11px] font-medium tracking-wide ${i === stepIndex ? 'text-ink' : 'text-muted/80'}`}>
              {i + 1}. {s.label}
            </span>
          </li>
        ))}
      </ol>
      <p className="sm:hidden -mt-5 mb-6 text-xs text-muted">Step {stepIndex + 1} of {STEPS.length}</p>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ink mb-1.5 tracking-tight">{title}</h2>
        <p className="text-muted">{subtitle}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm animate-slideIn">
          {error}
        </div>
      )}

      {body}
    </div>
  );

  const confirmBox = (checked: boolean, onChange: (v: boolean) => void, text: string) => (
    <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-line hover:bg-ink/5 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded border-line text-accent focus:ring-2 focus:ring-focus/30"
      />
      <span className="text-sm text-ink/85">{text}</span>
    </label>
  );

  if (step === 'password') {
    const rules = passwordRules(password);
    return frame(
      'Create your vault',
      'Your master password encrypts everything. Nobody, including us, can reset it for you.',
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink/80 mb-2">Master password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ai-input pr-11"
              placeholder="Choose a strong master password"
              autoComplete="new-password"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute inset-y-0 right-0 px-3 text-muted hover:text-ink"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {password && (
            <div className="mt-3">
              <PasswordStrengthMeter password={password} showFeedback={false} />
            </div>
          )}
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {rules.map(rule => (
              <li key={rule.label} className={`flex items-center gap-2 text-xs ${rule.ok ? 'text-success' : 'text-muted'}`}>
                {rule.ok ? <Check size={14} /> : <Circle size={14} className="opacity-50" />}
                {rule.label}
              </li>
            ))}
          </ul>
          {password && strength.isCommon && (
            <p className="text-xs text-danger mt-2">This password appears in leaked-password lists. Pick another.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink/80 mb-2">Confirm master password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            className="ai-input"
            placeholder="Type it again"
            autoComplete="new-password"
          />
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-danger mt-1">Passwords do not match</p>
          )}
          {passwordsMatch && (
            <p className="text-xs text-success mt-1 flex items-center gap-1">
              <Check size={14} />
              Passwords match
            </p>
          )}
        </div>

        <p className="text-xs text-muted">
          Next you'll get a 12-word recovery phrase and a Secret Key. Together they let you back in if you ever forget this password.
        </p>

        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} className="flex-1 btn-ghost">Cancel</button>
          <button onClick={handlePasswordSubmit} disabled={!passwordReady} className="flex-1 btn-primary gap-2">
            Continue
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'display') {
    return frame(
      'Save your recovery phrase',
      'Write these 12 words down in order. They are the only way to reset a forgotten master password.',
      <div className="space-y-5">
        <ol className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {words.map((word, index) => (
            <li key={index} className="flex items-baseline gap-2 bg-surface2/60 border border-line rounded-lg px-3 py-2.5">
              <span className="w-5 text-right text-xs text-muted/80 tabular-nums">{index + 1}</span>
              <span className="font-mono font-semibold text-ink">{word}</span>
            </li>
          ))}
        </ol>

        <div className="flex gap-3">
          <button onClick={handleCopy} className="flex-1 btn-ghost gap-2 !py-2.5 text-sm">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button onClick={handleDownload} className="flex-1 btn-ghost gap-2 !py-2.5 text-sm">
            <Download size={16} />
            {confirmDownload ? 'Downloaded' : 'Download'}
          </button>
        </div>

        <div className="flex gap-3 p-4 rounded-xl bg-warn/10 border border-warn/30 text-sm text-ink/85">
          <AlertTriangle size={18} className="text-warn flex-shrink-0 mt-0.5" />
          <p>Anyone with these words can open your vault. Keep them offline, on paper or in a safe, and never share them.</p>
        </div>

        {confirmBox(manualConfirm, setManualConfirm, "I've written down my recovery phrase and stored it somewhere safe.")}

        <div className="flex gap-3">
          <button onClick={() => setStep('password')} className="btn-ghost gap-2 px-4" aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <button onClick={handleContinueToVerify} disabled={!manualConfirm} className="flex-1 btn-primary gap-2">
            Continue
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    const incomplete = verificationIndices.some(index => !verificationAnswers[index]?.trim());
    return frame(
      'Confirm your phrase',
      'Type the requested words to make sure your copy is correct.',
      <div className="space-y-5">
        {verificationError && (
          <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm animate-slideIn">
            {verificationError}
          </div>
        )}

        <div className="space-y-3">
          {verificationIndices.map((index, i) => (
            <div key={index}>
              <label className="block text-sm font-medium text-ink/80 mb-1.5">Word #{index + 1}</label>
              <input
                type="text"
                value={verificationAnswers[index] || ''}
                onChange={(e) => setVerificationAnswers({ ...verificationAnswers, [index]: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                className="ai-input font-mono"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus={i === 0}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={() => setStep('display')} disabled={isVerifying} className="btn-ghost gap-2 px-4" aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <button onClick={handleVerify} disabled={isVerifying || incomplete} className="flex-1 btn-primary gap-2">
            {isVerifying ? 'Checking...' : 'Continue'}
            {!isVerifying && <ArrowRight size={18} />}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'secretKey') {
    return frame(
      'Save your Secret Key',
      'Your vault opens with your master password plus this key. A stolen vault file is useless without it.',
      <div className="space-y-5">
        <SecretKeyKit secretKey={secretKey} onSaved={() => setSecretKeySaved(true)} />

        <p className="text-xs text-muted">
          This browser remembers the key, so day to day you only type your password. On a new device, scan the QR code or type the key once.
        </p>

        {confirmBox(
          secretKeyConfirm,
          setSecretKeyConfirm,
          "I've saved my Emergency Kit. If I clear this browser's data, I'll need it or my recovery phrase to get back in."
        )}

        {finishError && (
          <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm animate-slideIn">
            {finishError}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => setStep('verify')} disabled={isFinishing} className="btn-ghost gap-2 px-4" aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <button onClick={handleFinish} disabled={isFinishing || !secretKeyConfirm || !secretKeySaved} className="flex-1 btn-primary gap-2">
            {isFinishing ? (
              <>
                <Loader size={18} className="animate-spin" />
                Creating vault...
              </>
            ) : (
              'Create vault'
            )}
          </button>
        </div>

        {!secretKeySaved && (
          <p className="text-xs text-muted text-center">Download or copy your Emergency Kit to continue.</p>
        )}
      </div>
    );
  }

  return null;
}
