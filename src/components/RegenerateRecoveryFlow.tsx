import { useState } from 'react';
import { Shield, Copy, Download, AlertTriangle, ArrowLeft, Check } from 'lucide-react';
import { splitPhraseIntoWords, getRandomWordIndices } from '../crypto/recoveryPhrase';

interface Props {
  recoveryPhrase: string;
  onVerified: () => void;
  onCancel: () => void;
}

export function RegenerateRecoveryFlow({ recoveryPhrase, onVerified, onCancel }: Props) {
  const [step, setStep] = useState<'display' | 'verify'>('display');
  const [copied, setCopied] = useState(false);
  const [confirmDownload, setConfirmDownload] = useState(false);
  const [verificationIndices, setVerificationIndices] = useState<number[]>([]);
  const [verificationAnswers, setVerificationAnswers] = useState<{ [key: number]: string }>({});
  const [verificationError, setVerificationError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const words = splitPhraseIntoWords(recoveryPhrase);

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

  const handleVerify = () => {
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
      onVerified();
    } else {
      setVerificationError('Some words are incorrect. Please check and try again.');
      setIsVerifying(false);
      setTimeout(() => setVerificationError(''), 3000);
    }
  };

  if (step === 'display') {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
            <div className="text-sm text-red-900">
              <p className="font-bold mb-2">CRITICAL: Save Your New Recovery Phrase</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>This NEW phrase replaces your old recovery phrase</li>
                <li>Write it down on paper and store it somewhere safe</li>
                <li>NEVER share it with anyone or store it digitally</li>
                <li>Your old recovery phrase will NO LONGER work</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">Your New 12-Word Recovery Phrase</h3>
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

        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 px-4 py-3 border-2 border-gray-700 text-cyan-400 rounded-xl hover:bg-gray-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Download Backup
          </button>
          <button
            onClick={handleContinueToVerify}
            disabled={!confirmDownload}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:cursor-not-allowed"
          >
            I've Written It Down
          </button>
        </div>

        {!confirmDownload && (
          <p className="text-sm text-amber-600 font-medium text-center">
            Please download or write down the phrase before continuing
          </p>
        )}

        <button
          onClick={onCancel}
          className="w-full px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (step === 'verify') {
    return (
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
            {isVerifying ? 'Verifying...' : 'Verify & Save'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
