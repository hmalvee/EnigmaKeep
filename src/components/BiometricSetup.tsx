import { useState, useEffect } from 'react';
import { Fingerprint, Check, X } from 'lucide-react';
import { SettingsCard } from './ui';
import { checkBiometricSupport, isBiometricEnabled, disableBiometric } from '../utils/biometric';

interface BiometricSetupProps {
  /** Registers the credential and wraps the master password. Throws on failure. */
  onEnable: () => Promise<void>;
}

export function BiometricSetup({ onEnable }: BiometricSetupProps) {
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
      await onEnable();
      setIsEnabled(true);
      setSuccess('Biometric authentication enabled successfully!');
      setTimeout(() => {
        setSuccess('');
      }, 2000);
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
      <SettingsCard
        title="Biometric unlock"
        description="Not available here. It needs a fingerprint or face sensor, a secure (HTTPS) connection, and a browser that supports WebAuthn PRF."
      />
    );
  }

  return (
    <SettingsCard
      title="Biometric unlock"
      description={
        isEnabled
          ? 'On. Unlock with your fingerprint or face on this device.'
          : 'Unlock with your fingerprint or face instead of typing your master password on this device.'
      }
      action={
        isEnabled ? (
          <button onClick={handleDisableBiometric} className="btn-ghost !px-3.5 !py-2 text-sm">Turn off</button>
        ) : (
          <button onClick={handleEnableBiometric} disabled={isLoading} className="btn-primary !px-3.5 !py-2 text-sm gap-2">
            <Fingerprint size={15} />
            {isLoading ? 'Setting up...' : 'Turn on'}
          </button>
        )
      }
    >
      {(error || success) && (
        <div className="px-5 py-3">
          {error && (
            <p className="flex items-start gap-2 text-sm text-danger">
              <X size={16} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}
          {success && (
            <p className="flex items-start gap-2 text-sm text-success">
              <Check size={16} className="mt-0.5 shrink-0" />
              {success}
            </p>
          )}
        </div>
      )}
      <p className="px-5 py-3 text-xs text-muted">
        Your biometric data never leaves the device. The master password is wrapped with a key only this device's authenticator can
        produce after it verifies you. Changing your master password turns biometric unlock off until you turn it on again.
      </p>
    </SettingsCard>
  );
}
