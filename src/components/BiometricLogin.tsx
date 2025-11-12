import { useState } from 'react';
import { Fingerprint, AlertCircle } from 'lucide-react';
import { authenticateWithBiometric } from '../utils/biometric';

interface BiometricLoginProps {
  username: string;
  onSuccess: () => void;
  onFallback: () => void;
}

export function BiometricLogin({ username, onSuccess, onFallback }: BiometricLoginProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');

  const handleBiometricAuth = async () => {
    setIsAuthenticating(true);
    setError('');

    try {
      const success = await authenticateWithBiometric(username);

      if (success) {
        onSuccess();
      } else {
        setError('Biometric authentication failed. Please try again.');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleBiometricAuth}
        disabled={isAuthenticating}
        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-3 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Fingerprint size={24} />
        {isAuthenticating ? 'Authenticating...' : 'Unlock with Biometric'}
      </button>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2 animate-fadeIn">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-gray-900 text-gray-400">or</span>
        </div>
      </div>

      <button
        onClick={onFallback}
        className="w-full py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium"
      >
        Use Master Password
      </button>
    </div>
  );
}
