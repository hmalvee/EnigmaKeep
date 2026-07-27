import { useState, useEffect } from 'react';
import { Fingerprint, Shield, Check, X } from 'lucide-react';
import { checkBiometricSupport, registerBiometric, isBiometricEnabled, disableBiometric } from '../utils/biometric';

interface BiometricSetupProps {
  username: string;
  onComplete?: () => void | Promise<void>;
}

export function BiometricSetup({ username, onComplete }: BiometricSetupProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkSupport();
    setIsEnabled(isBiometricEnabled());
  }, []);

  const checkSupport = async () => {
    const capability = await checkBiometricSupport();
    setIsSupported(capability.available);
  };

  const handleEnableBiometric = async () => {
    setIsLoading(true);
    setError('');

    try {
      const credentialId = await registerBiometric(username);

      if (credentialId) {
        setIsEnabled(true);
        setSuccess('Biometric authentication enabled successfully!');

        if (onComplete) {
          await onComplete();
        }

        setTimeout(() => {
          setSuccess('');
        }, 2000);
      } else {
        setError('Failed to register biometric authentication. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Biometric setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableBiometric = async () => {
    await disableBiometric();
    setIsEnabled(false);
    setSuccess('Biometric authentication disabled');
    setTimeout(() => setSuccess(''), 2000);
  };

  if (!isSupported) {
    return (
      <div className="bg-surface border border-line rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Shield className="text-muted flex-shrink-0 mt-0.5" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-ink mb-2">Biometric Authentication</h3>
            <p className="text-muted text-sm">
              Biometric authentication is not available on this device. This feature requires:
            </p>
            <ul className="list-disc list-inside text-muted text-sm mt-2 space-y-1">
              <li>A device with fingerprint or face recognition</li>
              <li>A secure HTTPS connection</li>
              <li>Browser support for Web Authentication API</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-line rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
          <Fingerprint className="text-accent-ink" size={24} />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-ink mb-2">Biometric Authentication</h3>
          <p className="text-muted text-sm mb-4">
            {isEnabled
              ? 'Quick unlock with your fingerprint or face recognition'
              : 'Enable biometric authentication for faster, more secure access to your vault'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm flex items-start gap-2">
              <X size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-success/10 border border-success/30 rounded-lg text-success text-sm flex items-start gap-2">
              <Check size={16} className="flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex gap-3">
            {!isEnabled ? (
              <button
                onClick={handleEnableBiometric}
                disabled={isLoading}
                className="btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Fingerprint size={18} />
                {isLoading ? 'Setting up...' : 'Enable Biometric Login'}
              </button>
            ) : (
              <>
                <div className="flex items-center gap-2 text-success text-sm">
                  <Check size={18} />
                  <span>Enabled</span>
                </div>
                <button
                  onClick={handleDisableBiometric}
                  className="btn-ghost"
                >
                  Disable
                </button>
              </>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-line">
            <p className="text-xs text-muted">
              Your biometric data never leaves your device. We use the Web Authentication API (WebAuthn) for secure, privacy-preserving authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
