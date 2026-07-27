import { useState, useEffect } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { TotpEntry } from '../types/vault';
import { parseOtpAuthUri, validateSecret, generateTOTP } from '../utils/totp';

interface TotpModalProps {
  entry: TotpEntry | null;
  onSave: (entry: Omit<TotpEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

export function TotpModal({ entry, onSave, onClose }: TotpModalProps) {
  const [accountName, setAccountName] = useState(entry?.title || '');
  const [setupKey, setSetupKey] = useState(entry?.secret || '');
  const [algorithm, setAlgorithm] = useState<'SHA1' | 'SHA256' | 'SHA512'>(entry?.algorithm || 'SHA1');
  const [digits, setDigits] = useState(entry?.digits || 6);
  const [period, setPeriod] = useState(entry?.period || 30);
  const [error, setError] = useState('');
  const [liveCode, setLiveCode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (setupKey && validateSecret(setupKey)) {
      const updateCode = async () => {
        try {
          const result = await generateTOTP(setupKey, { algorithm, digits, period });
          setLiveCode(result.code);
          setTimeRemaining(result.timeRemaining);
        } catch (err) {
          setLiveCode('');
        }
      };

      updateCode();
      const interval = setInterval(updateCode, 1000);
      return () => clearInterval(interval);
    } else {
      setLiveCode('');
      setTimeRemaining(0);
    }
  }, [setupKey, algorithm, digits, period]);

  const handleSetupKeyChange = (value: string) => {
    const cleanValue = value.replace(/\s/g, '').toUpperCase();
    setSetupKey(cleanValue);
    setError('');

    if (value.startsWith('otpauth://')) {
      const parsed = parseOtpAuthUri(value);
      if (parsed) {
        setSetupKey(parsed.secret);
        setAlgorithm(parsed.algorithm || 'SHA1');
        setDigits(parsed.digits || 6);
        setPeriod(parsed.period || 30);
        if (!accountName && (parsed.issuer || parsed.accountName)) {
          setAccountName(parsed.issuer || parsed.accountName || '');
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!accountName.trim()) {
      setError('Account name is required (e.g., Facebook, Google)');
      return;
    }

    if (!setupKey.trim()) {
      setError('Setup key is required');
      return;
    }

    if (!validateSecret(setupKey)) {
      setError('Invalid setup key. Please check and try again.');
      return;
    }

    onSave({
      title: accountName.trim(),
      secret: setupKey.replace(/\s/g, '').toUpperCase(),
      issuer: accountName.trim(),
      algorithm,
      digits,
      period,
      favorite: entry?.favorite || false
    });
  };

  const isFormValid = accountName.trim() && setupKey.trim() && validateSecret(setupKey);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-line rounded-2xl shadow-xl max-w-md w-full">
        <div className="sticky top-0 bg-surface border-b border-line px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink">
            {entry ? 'Edit Account' : 'Add 2FA Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-danger flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Account Name
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="ai-input"
              placeholder="Facebook, Google, GitHub..."
              autoFocus
            />
            <p className="text-xs text-muted mt-1.5">
              Enter the name of the service (e.g., Facebook, Google)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Setup Key
            </label>
            <textarea
              value={setupKey}
              onChange={(e) => handleSetupKeyChange(e.target.value)}
              className="ai-input font-mono text-sm resize-none"
              placeholder="Paste the setup key from Facebook or other service..."
              rows={3}
            />
            <p className="text-xs text-muted mt-1.5">
              Copy and paste the setup key provided by the service
            </p>
          </div>

          {liveCode && (
            <div className="p-4 bg-accent/10 rounded-xl border-2 border-accent/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted flex items-center gap-2">
                  <Check size={16} className="text-success" />
                  Live Code Preview
                </span>
                <span className="text-xs text-muted">{timeRemaining}s</span>
              </div>
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-accent tracking-widest">
                  {liveCode}
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-surface2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-1000 ease-linear"
                  style={{ width: `${(timeRemaining / period) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {entry ? 'Save' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
