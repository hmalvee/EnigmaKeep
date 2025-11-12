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

  const handleDisableBiometric = () => {
    disableBiometric();
    setIsEnabled(false);
    setSuccess('Biometric authentication disabled');
    setTimeout(() => setSuccess(''), 2000);
  };

  if (!isSupported) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Shield className="text-gray-500 flex-shrink-0 mt-0.5" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Biometric Authentication</h3>
            <p className="text-gray-400 text-sm">
              Biometric authentication is not available on this device. This feature requires:
            </p>
            <ul className="list-disc list-inside text-gray-400 text-sm mt-2 space-y-1">
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
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Fingerprint className="text-white" size={24} />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">Biometric Authentication</h3>
          <p className="text-gray-400 text-sm mb-4">
            {isEnabled
              ? 'Quick unlock with your fingerprint or face recognition'
              : 'Enable biometric authentication for faster, more secure access to your vault'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
              <X size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-start gap-2">
              <Check size={16} className="flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex gap-3">
            {!isEnabled ? (
              <button
                onClick={handleEnableBiometric}
                disabled={isLoading}
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Fingerprint size={18} />
                {isLoading ? 'Setting up...' : 'Enable Biometric Login'}
              </button>
            ) : (
              <>
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <Check size={18} />
                  <span>Enabled</span>
                </div>
                <button
                  onClick={handleDisableBiometric}
                  className="px-4 py-2.5 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium"
                >
                  Disable
                </button>
              </>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              Your biometric data never leaves your device. We use the Web Authentication API (WebAuthn) for secure, privacy-preserving authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
