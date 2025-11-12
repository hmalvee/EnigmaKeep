import { useState, useEffect } from 'react';
import { Upload, Key, Loader, AlertCircle, Fingerprint, RefreshCw } from 'lucide-react';
import { isBiometricEnabled, checkBiometricSupport, authenticateWithBiometric } from '../utils/biometric';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { calculatePasswordStrength } from '../utils/passwordStrength';
import { getLastVaultHandle, verifyHandleAccess } from '../utils/vaultStorage';

interface Props {
  onLogin: (password: string, file: File, handle: FileSystemFileHandle | null) => Promise<void>;
  onRecoverWithSeedPhrase: (seedPhrase: string, newPassword: string, file: File, handle: FileSystemFileHandle | null) => Promise<void>;
  onBiometricLogin: () => Promise<void>;
  lastVaultPath: string | null;
  error: string;
}

export function LoginScreen({ onLogin, onRecoverWithSeedPhrase, onBiometricLogin, lastVaultPath, error }: Props) {
  const [mode, setMode] = useState<'password' | 'recovery'>('password');
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
        setAutoLoadError(null);
      } catch (err: any) {
        console.error('Auto-load failed:', err);
        setAutoLoadError('Vault file not found. Please re-select it.');
      } finally {
        setIsAutoLoading(false);
      }
    };

    tryAutoLoadVault();
  }, [lastVaultPath]);

  const handleFileSelect = async () => {
    try {
      if ('showOpenFilePicker' in window) {
        const [handle] = await window.showOpenFilePicker({
          types: [{
            description: 'Encrypted Vault',
            accept: { 'application/octet-stream': ['.enc'] }
          }]
        });
        const file = await handle.getFile();
        setSelectedFile(file);
        setSelectedHandle(handle);
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.enc';
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (file) {
            setSelectedFile(file);
            setSelectedHandle(null);
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
    if (!password || !selectedFile) return;

    setIsLoading(true);
    try {
      await onLogin(password, selectedFile, selectedHandle);
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoveryLogin = async () => {
    if (!seedPhrase || !newPassword || !confirmPassword || !selectedFile) return;

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
    setIsBiometricLoading(true);
    try {
      const success = await authenticateWithBiometric('vault-user');
      if (success) {
        await onBiometricLogin();
      }
    } catch (err) {
      console.error('Biometric auth failed:', err);
    } finally {
      setIsBiometricLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Open Existing Vault</h2>
        <p className="text-gray-400">Unlock your password vault</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm animate-slideIn">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-6 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setMode('password')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
            mode === 'password'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Master Password
        </button>
        <button
          onClick={() => setMode('recovery')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            mode === 'recovery'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Key size={16} />
          Seed Phrase
        </button>
      </div>

      {mode === 'password' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Vault File
            </label>
            <button
              onClick={handleFileSelect}
              disabled={isAutoLoading}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-600 hover:border-cyan-500 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-gray-300 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAutoLoading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Loading last vault...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  {selectedFile ? selectedFile.name : 'Select Vault File'}
                </>
              )}
            </button>
            {lastVaultPath && !selectedFile && !isAutoLoading && (
              <p className="text-xs text-gray-500 mt-1">Last used: {lastVaultPath}</p>
            )}
            {selectedFile && (
              <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                <RefreshCw size={12} />
                Vault file loaded automatically
              </p>
            )}
            {autoLoadError && (
              <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {autoLoadError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Master Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-gray-900 text-white placeholder-gray-500"
              placeholder="Enter your master password"
            />
          </div>

          <button
            onClick={handlePasswordLogin}
            disabled={!password || !selectedFile || isLoading}
            className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Unlocking...
              </>
            ) : (
              'Unlock Vault'
            )}
          </button>

          {showBiometric && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-800 text-gray-400">or</span>
                </div>
              </div>

              <button
                onClick={handleBiometricAuth}
                disabled={isBiometricLoading}
                className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isBiometricLoading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Fingerprint size={18} />
                    Unlock with Biometric
                  </>
                )}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Vault File
            </label>
            <button
              onClick={handleFileSelect}
              disabled={isAutoLoading}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-600 hover:border-cyan-500 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-gray-300 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAutoLoading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Loading last vault...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  {selectedFile ? selectedFile.name : 'Select Vault File'}
                </>
              )}
            </button>
            {lastVaultPath && !selectedFile && !isAutoLoading && (
              <p className="text-xs text-gray-500 mt-1">Last used: {lastVaultPath}</p>
            )}
            {selectedFile && (
              <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                <RefreshCw size={12} />
                Vault file loaded automatically
              </p>
            )}
            {autoLoadError && (
              <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {autoLoadError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              12-Word Recovery Phrase
            </label>
            <textarea
              value={seedPhrase}
              onChange={(e) => {
                setSeedPhrase(e.target.value);
                const words = e.target.value.trim().split(/\s+/).filter(w => w.length > 0);
                setPhraseWordCount(words.length);
              }}
              rows={3}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 font-mono text-sm resize-none bg-gray-900 text-white placeholder-gray-500"
              placeholder="Enter your 12-word recovery phrase..."
            />
            <p className="text-xs mt-1 text-gray-400">
              Word count: <span className={phraseWordCount === 12 ? 'text-emerald-400 font-semibold' : 'text-gray-400'}>{phraseWordCount}</span> / 12
            </p>
            {seedPhrase && phraseWordCount !== 12 && (
              <p className="text-xs mt-1 text-amber-600">⚠ Recovery phrase should be exactly 12 words</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Master Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-gray-900 text-white placeholder-gray-500"
              placeholder="Create new master password"
            />
            {newPassword && <PasswordStrengthMeter password={newPassword} />}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-gray-900 text-white placeholder-gray-500"
              placeholder="Confirm new password"
            />
          </div>

          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-sm text-red-400">Passwords do not match</p>
          )}
          {newPassword && calculatePasswordStrength(newPassword).score < 3 && (
            <p className="text-sm text-amber-500">⚠ Password should be stronger (at least 12 characters with uppercase, lowercase, numbers, and symbols)</p>
          )}

          <button
            onClick={handleRecoveryLogin}
            disabled={!seedPhrase || !newPassword || !confirmPassword || newPassword !== confirmPassword || calculatePasswordStrength(newPassword).score < 3 || !selectedFile || isLoading}
            className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Recovering...
              </>
            ) : (
              <>
                <Key size={18} />
                Recover & Set New Password
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
