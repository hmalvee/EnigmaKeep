import { useState, useEffect } from 'react';
import { Shield, ArrowRight, Check, Copy, Download, AlertTriangle, ArrowLeft } from 'lucide-react';
import { generateRecoveryPhrase, deriveKeyFromRecoveryPhrase, splitPhraseIntoWords, getRandomWordIndices } from '../crypto/recoveryPhrase';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { calculatePasswordStrength } from '../utils/passwordStrength';

interface Props {
  onComplete: (password: string, recoveryPhraseHash: string, fileHandle: FileSystemFileHandle, phrase: string) => void;
  onCancel: () => void;
  error: string;
}

export function CreateVaultFlow({ onComplete, onCancel, error }: Props) {
  const [step, setStep] = useState<'password' | 'display' | 'verify'>('password');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmDownload, setConfirmDownload] = useState(false);
  const [manualConfirm, setManualConfirm] = useState(false);
  const [verificationIndices, setVerificationIndices] = useState<number[]>([]);
  const [verificationAnswers, setVerificationAnswers] = useState<{ [key: number]: string }>({});
  const [verificationError, setVerificationError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const words = splitPhraseIntoWords(recoveryPhrase);

  const handlePasswordSubmit = () => {
    if (password !== confirmPassword || password.length < 8) {
      return;
    }

    const strength = calculatePasswordStrength(password);
    if (!strength.meetsMinimum) {
      return;
    }

    const phrase = generateRecoveryPhrase();
    setRecoveryPhrase(phrase);
    setStep('display');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(recoveryPhrase);
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
    const indices = getRandomWordIndices(words.length, 3);
    setVerificationIndices(indices);
    setStep('verify');
  };

  const handleVerify = async () => {
    if (isVerifying) return;

    setIsVerifying(true);
    setVerificationError('');

    let allCorrect = true;
    for (const index of verificationIndices) {
      const userAnswer = verificationAnswers[index]?.trim().toLowerCase();
      const correctAnswer = words[index].toLowerCase();
      if (userAnswer !== correctAnswer) {
        allCorrect = false;
        break;
      }
    }

    if (allCorrect) {
      try {
        let handle = null;

        if ('showSaveFilePicker' in window) {
          handle = await window.showSaveFilePicker({
            suggestedName: `vault-${Date.now()}.enc`,
            types: [{
              description: 'Encrypted Vault',
              accept: { 'application/octet-stream': ['.enc'] }
            }]
          });
        }

        const phraseHash = await deriveKeyFromRecoveryPhrase(recoveryPhrase);
        onComplete(password, phraseHash, handle, recoveryPhrase);
      } catch (err: any) {
        if (!err.message?.includes('user aborted')) {
          console.error('File save failed:', err);
        }
        setIsVerifying(false);
      }
    } else {
      setVerificationError('Some words are incorrect. Please check and try again.');
      setIsVerifying(false);
      setTimeout(() => setVerificationError(''), 3000);
    }
  };

  if (step === 'password') {
    return (
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Create New Vault</h2>
          <p className="text-gray-400">Set up your secure password vault</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm animate-slideIn">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Master Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-gray-900 text-white placeholder-gray-500"
              placeholder="Create a strong master password"
            />
          </div>

          {password && (
            <div className="-mt-2">
              <PasswordStrengthMeter password={password} showFeedback={true} />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Master Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-gray-900 text-white placeholder-gray-500"
              placeholder="Re-enter your master password"
            />
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
            )}
            {password && confirmPassword && password === confirmPassword && (
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <Check size={14} />
                Passwords match
              </p>
            )}
          </div>

          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Shield className="text-cyan-600 flex-shrink-0" size={20} />
              <div className="text-sm text-cyan-900">
                <p className="font-semibold mb-1">Security Note</p>
                <ul className="space-y-1 list-disc list-inside text-xs">
                  <li>Choose a strong, unique password</li>
                  <li>You'll receive a 12-word recovery phrase next</li>
                  <li>This is the only way to recover if you forget your password</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handlePasswordSubmit}
              disabled={!password || !confirmPassword || password !== confirmPassword || password.length < 8 || !calculatePasswordStrength(password).meetsMinimum}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'display') {
    return (
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Backup Your Recovery Phrase</h2>
          <p className="text-gray-400">Write down these 12 words in order</p>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
              <div className="text-sm text-red-900">
                <p className="font-bold mb-2">CRITICAL: Read This Carefully</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>This is the ONLY way to recover your vault if you forget your password</li>
                  <li>Write it down on paper and store it somewhere safe</li>
                  <li>NEVER share it with anyone or store it digitally</li>
                  <li>Anyone with this phrase can access ALL your passwords</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Your 12-Word Recovery Phrase</h3>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-xl border-2 border-gray-700">
              {words.map((word, index) => (
                <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-sm">
                  <span className="text-xs text-gray-500 font-medium">#{index + 1}</span>
                  <p className="font-mono font-semibold text-white">{word}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="w-full px-4 py-3 border-2 border-gray-700 text-cyan-400 rounded-xl hover:bg-gray-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Download Backup (Optional)
          </button>

          <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={manualConfirm}
                onChange={(e) => setManualConfirm(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-600 text-cyan-600 focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-sm text-amber-200">
                I have safely written down or saved my 12-word recovery phrase. I understand this is the ONLY way to recover my vault if I forget my password.
              </span>
            </label>
          </div>

          <button
            onClick={handleContinueToVerify}
            disabled={!manualConfirm && !confirmDownload}
            className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:cursor-not-allowed"
          >
            Continue to Verification
          </button>

          {!manualConfirm && !confirmDownload && (
            <p className="text-sm text-amber-600 font-medium text-center">
              Please confirm you've saved the recovery phrase before continuing
            </p>
          )}
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Verify Your Recovery Phrase</h2>
          <p className="text-gray-400">Enter the requested words to continue</p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            To make sure you've saved your recovery phrase correctly, please enter the following words:
          </p>

          {verificationError && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm animate-slideIn">
              {verificationError}
            </div>
          )}

          <div className="space-y-3">
            {verificationIndices.map((index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Word #{index + 1}
                </label>
                <input
                  type="text"
                  value={verificationAnswers[index] || ''}
                  onChange={(e) => setVerificationAnswers({
                    ...verificationAnswers,
                    [index]: e.target.value
                  })}
                  className="w-full px-4 py-2.5 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-gray-900 text-white placeholder-gray-500"
                  placeholder="Enter the word"
                  autoComplete="off"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setStep('display')}
              disabled={isVerifying}
              className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <button
              onClick={handleVerify}
              disabled={isVerifying || verificationIndices.some(index => !verificationAnswers[index]?.trim())}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
