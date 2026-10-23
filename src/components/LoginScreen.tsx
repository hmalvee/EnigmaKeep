import { useState, useEffect } from 'react';
import { Upload, Key, Loader, AlertCircle, Fingerprint, RefreshCw, QrCode, Users, ArrowLeft, ChevronRight, Lock } from 'lucide-react';
import { isBiometricEnabled, checkBiometricSupport, unlockWithBiometric } from '../utils/biometric';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { calculatePasswordStrength } from '../utils/passwordStrength';
import { getLastVaultHandle, verifyHandleAccess } from '../utils/vaultStorage';
import { getUnlockDelayMs, getUnlockFailureCount } from '../utils/unlockBackoff';
import { listVaultSnapshots, snapshotToFile, type VaultSnapshot } from '../utils/vaultSnapshots';
import { SecretKeyScanner } from './SecretKeyScanner';
import { GuardianRecoveryFlow } from './GuardianRecoveryFlow';
import type { VaultData } from '../types/vault';
import type { FileLayout } from '../utils/sessionFile';

interface Props {
  /** `secretKey`: typed/scanned Secret Key, when this device doesn't have it yet. */
  onLogin: (password: string, file: File, handle: FileSystemFileHandle | null, secretKey?: string) => Promise<void>;
  onRecoverWithSeedPhrase: (seedPhrase: string, newPassword: string, file: File, handle: FileSystemFileHandle | null) => Promise<void>;
  onBiometricLogin: (password: string) => Promise<void>;
  onRecoverWithGuardians: (vault: VaultData, newPassword: string, file: File, handle: FileSystemFileHandle | null, layout: FileLayout) => Promise<void>;
  lastVaultPath: string | null;
  error: string;
}

export function LoginScreen({ onLogin, onRecoverWithSeedPhrase, onBiometricLogin, onRecoverWithGuardians, lastVaultPath, error }: Props) {
  const [mode, setMode] = useState<'password' | 'forgot' | 'recovery' | 'guardians'>('password');
  const [password, setPassword] = useState('');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedHandle, setSelectedHandle] = useState<FileSystemFileHandle | null>(null);
  const [phraseWordCount, setPhraseWordCount] = useState(0);
  const [showBiometric, setShowBiometric] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [autoLoadError, setAutoLoadError] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<VaultSnapshot[]>([]);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [usingSnapshot, setUsingSnapshot] = useState(false);
  const [showSecretKeyInput, setShowSecretKeyInput] = useState(false);
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [autoLoaded, setAutoLoaded] = useState(false);

  useEffect(() => {
    const checkBiometric = async () => {
      const capability = await checkBiometricSupport();
      const enabled = isBiometricEnabled();
      setShowBiometric(capability.available && enabled);
    };
    checkBiometric();

    const tryAutoLoadVault = async () => {
      if (!lastVaultPath || !('showOpenFilePicker' in window)) return;

      setIsAutoLoading(true);
      setAutoLoadError(null);

      try {
        const handle = await getLastVaultHandle();
        if (!handle) {
          setAutoLoadError('Please re-select your vault file');
          setIsAutoLoading(false);
          return;
        }

        const hasAccess = await verifyHandleAccess(handle);
        if (!hasAccess) {
          setAutoLoadError('Cannot access the vault file. Please re-select it.');
          setIsAutoLoading(false);
          return;
        }

        const file = await handle.getFile();
        setSelectedFile(file);
        setSelectedHandle(handle);
        setAutoLoaded(true);
        setAutoLoadError(null);
      } catch (err: any) {
        console.error('Auto-load failed:', err);
        setAutoLoadError('Vault file not found. Please re-select it.');
      } finally {
        setIsAutoLoading(false);
      }
    };

    tryAutoLoadVault();
    listVaultSnapshots().then(setSnapshots).catch(() => setSnapshots([]));
  }, [lastVaultPath]);

  const handleSelectSnapshot = (snapshot: VaultSnapshot) => {
    setSelectedFile(snapshotToFile(snapshot));
    setSelectedHandle(null);
    setUsingSnapshot(true);
    setAutoLoaded(false);
    setShowSnapshots(false);
    setAutoLoadError(null);
  };

  const renderSnapshotRestore = () => {
    if (snapshots.length === 0) return null;

    return (
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setShowSnapshots(v => !v)}
          className="text-xs text-muted hover:text-neon-cyan transition-colors"
        >
          Vault file damaged? Restore from local backup ({snapshots.length})
        </button>

        {showSnapshots && (
          <div className="mt-2 space-y-1 max-h-44 overflow-auto rounded-xl border border-vault-border bg-vault-dark/60 p-2">
            {snapshots.map(snapshot => (
              <button
                key={snapshot.id}
                type="button"
                onClick={() => handleSelectSnapshot(snapshot)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-vault-surface transition-colors"
              >
                <span className="block text-xs text-ink/90">{snapshot.name}</span>
                <span className="block text-[11px] text-muted/80">
                  {new Date(snapshot.createdAt).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        )}

        {usingSnapshot && (
          <p className="text-xs text-warn mt-1">
            Using a local backup. After unlocking, use Save to write a fresh vault file.
          </p>
        )}
      </div>
    );
  };

  const handleFileSelect = async () => {
    try {
      if ('showOpenFilePicker' in window) {
        const [handle] = await (window as unknown as {
          showOpenFilePicker: (o: object) => Promise<FileSystemFileHandle[]>;
        }).showOpenFilePicker({
          types: [{
            description: 'Vault File',
            accept: { 'application/octet-stream': ['.dat', '.enc'], 'text/plain': ['.txt'] }
          }]
        });
        const file = await handle.getFile();
        setSelectedFile(file);
        setSelectedHandle(handle);
        setAutoLoaded(false);
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.dat,.enc,.txt';
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (file) {
            setSelectedFile(file);
            setSelectedHandle(null);
            setAutoLoaded(false);
          }
        };
        input.click();
      }
    } catch (err: any) {
      if (!err.message?.includes('user aborted')) {
        console.error('File selection failed:', err);
      }
    }
  };

  const handlePasswordLogin = async () => {
    // Enter on the inputs can fire while an attempt is running; parallel
    // attempts would all skip the backoff delay.
    if (isLoading || !password || !selectedFile) return;

    setIsLoading(true);
    try {
      await onLogin(password, selectedFile, selectedHandle, secretKeyInput.trim() || undefined);
    } catch (err) {
      console.error('Login failed:', err);
      // Wrong password and a missing Secret Key look the same; point to the latter.
      setShowSecretKeyInput(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoveryLogin = async () => {
    if (isLoading || !seedPhrase || !newPassword || !confirmPassword || !selectedFile) return;

    if (newPassword !== confirmPassword) {
      return;
    }

    setIsLoading(true);
    try {
      const sanitizedPhrase = seedPhrase.trim().toLowerCase().replace(/\s+/g, ' ');
      await onRecoverWithSeedPhrase(sanitizedPhrase, newPassword, selectedFile, selectedHandle);
    } catch (err) {
      console.error('Recovery failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    if (isBiometricLoading || isLoading) return;
    setIsBiometricLoading(true);
    try {
      const unlockedPassword = await unlockWithBiometric();
      await onBiometricLogin(unlockedPassword);
    } catch (err: any) {
      console.error('Biometric auth failed:', err);
      setAutoLoadError(err?.message || 'Biometric unlock failed. Please use your master password.');
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const renderFilePicker = () => (
    <div>
      <label className="block text-sm font-medium text-ink/80 mb-2">Vault file</label>
      <button
        onClick={handleFileSelect}
        disabled={isAutoLoading}
        className="w-full px-4 py-3 border border-dashed border-line hover:border-focus/50 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-ink/80 hover:text-neon-cyan disabled:opacity-50 disabled:cursor-not-allowed bg-vault-dark/50"
      >
        {isAutoLoading ? (
          <>
            <Loader size={20} className="animate-spin" />
            Loading last vault...
          </>
        ) : (
          <>
            <Upload size={20} />
            <span className="truncate">{selectedFile ? selectedFile.name : 'Select vault file'}</span>
          </>
        )}
      </button>
      {lastVaultPath && !selectedFile && !isAutoLoading && (
        <p className="text-xs text-muted/80 mt-1">Last used: {lastVaultPath}</p>
      )}
      {selectedFile && autoLoaded && (
        <p className="text-xs text-success mt-1 flex items-center gap-1">
          <RefreshCw size={12} />
          Opened your last vault file
        </p>
      )}
      {autoLoadError && (
        <p className="text-xs text-warn mt-1 flex items-center gap-1">
          <AlertCircle size={12} />
          {autoLoadError}
        </p>
      )}
      {renderSnapshotRestore()}
    </div>
  );

  const backTo = (target: 'password' | 'forgot', label: string) => (
    <button
      type="button"
      onClick={() => setMode(target)}
      className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors"
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );

  const header = (title: string, subtitle: string) => (
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-ink mb-2 tracking-tight">{title}</h2>
      <p className="text-muted">{subtitle}</p>
    </div>
  );

  const errorBanner = error && (
    <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm animate-slideIn backdrop-blur-sm">
      {error}
    </div>
  );

  if (mode === 'forgot') {
    const option = (
      target: 'recovery' | 'guardians',
      Icon: typeof Key,
      title: string,
      description: string
    ) => (
      <button
        type="button"
        onClick={() => setMode(target)}
        className="w-full text-left p-4 rounded-xl border border-line hover:border-focus/50 hover:bg-ink/5 transition-all duration-200 flex items-center gap-4 group"
      >
        <span className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center">
          <Icon size={18} />
        </span>
        <span className="flex-1">
          <span className="block font-medium text-ink">{title}</span>
          <span className="block text-sm text-muted mt-0.5">{description}</span>
        </span>
        <ChevronRight size={18} className="text-muted group-hover:text-ink transition-colors" />
      </button>
    );

    return (
      <div className="w-full max-w-md">
        {backTo('password', 'Back to unlock')}
        {header('Forgot your master password?', 'Choose how you want to get back into your vault')}
        <div className="space-y-3">
          {option('recovery', Key, 'Use my recovery phrase', 'Enter the 12 words you saved when you created the vault, then set a new password.')}
          {option('guardians', Users, 'Ask my guardians', 'Collect enough guardian cards. Recovery opens after the waiting period the owner chose.')}
        </div>
        <p className="mt-6 text-xs text-muted/80 text-center">
          EnigmaKeep never sees your password, so nobody can reset it for you. These are the only ways back in.
        </p>
      </div>
    );
  }

  if (mode === 'guardians') {
    return (
      <div className="w-full max-w-md">
        {backTo('forgot', 'Other recovery options')}
        {header('Recover with guardians', "Use your guardians' cards to reopen the vault")}
        {errorBanner}
        <GuardianRecoveryFlow onRecovered={onRecoverWithGuardians} />
      </div>
    );
  }

  if (mode === 'recovery') {
    const strength = newPassword ? calculatePasswordStrength(newPassword) : null;
    const strongEnough = !!strength && strength.meetsMinimum && !strength.isCommon;
    return (
      <div className="w-full max-w-md">
        {backTo('forgot', 'Other recovery options')}
        {header('Reset with recovery phrase', 'Enter your 12 words and choose a new master password')}
        {errorBanner}
        <div className="space-y-4">
          <p className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-ink/80">
            This rewrites the vault file under the new password. The current master password and any
            biometric unlock stop working for it.
          </p>
          {renderFilePicker()}

          <div>
            <label className="block text-sm font-medium text-ink/80 mb-2">Recovery phrase</label>
            <textarea
              value={seedPhrase}
              onChange={(e) => {
                setSeedPhrase(e.target.value);
                const words = e.target.value.trim().split(/\s+/).filter(w => w.length > 0);
                setPhraseWordCount(words.length);
              }}
              rows={3}
              className="ai-input font-mono text-sm resize-none"
              placeholder="word1 word2 word3 ..."
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-xs mt-1 text-muted">
              <span className={phraseWordCount === 12 ? 'text-success font-semibold' : ''}>{phraseWordCount}</span> of 12 words
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/80 mb-2">New master password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="ai-input"
              placeholder="Create a new master password"
            />
            {newPassword && <div className="mt-2"><PasswordStrengthMeter password={newPassword} /></div>}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/80 mb-2">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRecoveryLogin()}
              className="ai-input"
              placeholder="Re-enter the new password"
            />
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-danger mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            onClick={handleRecoveryLogin}
            disabled={phraseWordCount !== 12 || !strongEnough || newPassword !== confirmPassword || !selectedFile || isLoading}
            className="w-full btn-primary gap-2"
          >
            {isLoading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Recovering...
              </>
            ) : (
              'Reset password and open vault'
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <span className="mx-auto mb-4 w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center">
          <Lock size={20} />
        </span>
        <h2 className="text-2xl font-bold text-ink mb-2 tracking-tight">Unlock your vault</h2>
        <p className="text-muted">Choose your vault file and enter your master password</p>
      </div>

      {errorBanner}

      {getUnlockFailureCount() > 0 && (
        <div className="mb-4 p-3 bg-warn/10 border border-warn/30 rounded-xl text-warn text-sm">
          Unlock delayed by {Math.ceil(getUnlockDelayMs() / 1000)}s after failed attempts (anti-brute-force).
        </div>
      )}

      <div className="space-y-4">
        {renderFilePicker()}

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label className="block text-sm font-medium text-ink/80">Master password</label>
            <button
              type="button"
              onClick={() => setMode('forgot')}
              className="text-xs text-muted hover:text-ink underline-offset-4 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()}
            className="ai-input"
            placeholder="Enter your master password"
            autoFocus
          />
        </div>

        {showSecretKeyInput ? (
          <div>
            <label className="block text-sm font-medium text-ink/80 mb-2">
              Secret Key <span className="text-muted/80 font-normal">(from your Emergency Kit)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={secretKeyInput}
                onChange={(e) => setSecretKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()}
                className="ai-input font-mono"
                placeholder="EK1-XXXXX-XXXXX-..."
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setIsScanning(true)}
                className="px-3 rounded-xl border border-vault-border text-ink/80 hover:text-neon-cyan hover:border-neon-cyan/50"
                aria-label="Scan Secret Key QR code"
                title="Scan QR code"
              >
                <QrCode size={20} />
              </button>
            </div>
            <p className="text-xs text-muted/80 mt-1">
              Needed once per device. This browser will remember it after unlocking.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowSecretKeyInput(true)}
            className="text-xs text-muted hover:text-neon-cyan flex items-center gap-1"
          >
            <QrCode size={14} />
            First time on this device? Enter your Secret Key
          </button>
        )}

        {isScanning && (
          <SecretKeyScanner
            onDetected={(text) => {
              setSecretKeyInput(text);
              setIsScanning(false);
            }}
            onClose={() => setIsScanning(false)}
          />
        )}

        <button
          onClick={handlePasswordLogin}
          disabled={!password || !selectedFile || isLoading}
          className="w-full btn-primary gap-2"
        >
          {isLoading ? (
            <>
              <Loader size={18} className="animate-spin" />
              Unlocking...
            </>
          ) : (
            'Unlock vault'
          )}
        </button>

        {showBiometric && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full section-divider"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-surface text-muted/80 rounded-full">or</span>
              </div>
            </div>

            <button
              onClick={handleBiometricAuth}
              disabled={isBiometricLoading}
              className="w-full btn-ghost gap-2"
            >
              {isBiometricLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Fingerprint size={18} />
                  Unlock with biometrics
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
