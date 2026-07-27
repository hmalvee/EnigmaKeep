import { useState } from 'react';
import { Copy, Download, AlertTriangle, ArrowLeft, Check } from 'lucide-react';
import { splitPhraseIntoWords, getRandomWordIndices } from '../crypto/recoveryPhrase';
import { secureCopy } from '../utils/secureClipboard';

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
        <div className="bg-danger/10 border-2 border-danger/30 rounded-xl p-4">
          <div className="flex gap-3">
            <AlertTriangle className="text-danger flex-shrink-0" size={24} />
            <div className="text-sm text-danger">
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
            <h3 className="font-semibold text-ink">Your New 12-Word Recovery Phrase</h3>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-surface2 hover:bg-surface border border-line text-ink rounded-lg transition-colors"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-surface2 p-4 rounded-xl border-2 border-line">
            {words.map((word, index) => (
              <div key={index} className="bg-surface border border-line rounded-lg p-3 shadow-sm">
                <span className="text-xs text-muted font-medium">#{index + 1}</span>
                <p className="font-mono font-semibold text-ink">{word}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 px-4 py-3 border-2 border-line text-accent rounded-xl hover:bg-surface2 transition-all duration-200 font-medium flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Download Backup
          </button>
          <button
            onClick={handleContinueToVerify}
            disabled={!confirmDownload}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            I've Written It Down
          </button>
        </div>

        {!confirmDownload && (
          <p className="text-sm text-accent font-medium text-center">
            Please download or write down the phrase before continuing
          </p>
        )}

        <button
          onClick={onCancel}
          className="btn-ghost w-full"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">
          To make sure you've saved your recovery phrase correctly, please enter the following words:
        </p>

        {verificationError && (
          <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm animate-slideIn">
            {verificationError}
          </div>
        )}

        <div className="space-y-3">
          {verificationIndices.map((index) => (
            <div key={index}>
              <label className="block text-sm font-medium text-muted mb-1">
                Word #{index + 1}
              </label>
              <input
                type="text"
                value={verificationAnswers[index] || ''}
                onChange={(e) => setVerificationAnswers({
                  ...verificationAnswers,
                  [index]: e.target.value
                })}
                className="ai-input"
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
            className="btn-ghost flex-1 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <button
            onClick={handleVerify}
            disabled={isVerifying || verificationIndices.some(index => !verificationAnswers[index]?.trim())}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? 'Verifying...' : 'Verify & Save'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
