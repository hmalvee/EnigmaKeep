import { X, Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { TotpEntry } from '../types/vault';
import { generateOtpAuthUri } from '../utils/totp';

interface TotpExportModalProps {
  entries: TotpEntry[];
  onClose: () => void;
}

export function TotpExportModal({ entries, onClose }: TotpExportModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopySetupKey = (entry: TotpEntry) => {
    const setupKey = `${entry.title}\nSecret: ${entry.secret}${entry.issuer ? `\nIssuer: ${entry.issuer}` : ''}`;
    navigator.clipboard.writeText(setupKey);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyOtpAuthUri = (entry: TotpEntry) => {
    const uri = generateOtpAuthUri(
      entry.secret,
      entry.issuer || entry.title,
      entry.title,
      {
        algorithm: entry.algorithm,
        digits: entry.digits,
        period: entry.period
      }
    );
    navigator.clipboard.writeText(uri);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportAll = () => {
    const exportData = entries.map(entry => {
      const uri = generateOtpAuthUri(
        entry.secret,
        entry.issuer || entry.title,
        entry.title,
        {
          algorithm: entry.algorithm,
          digits: entry.digits,
          period: entry.period
        }
      );
      return `${entry.title}\nSecret: ${entry.secret}${entry.issuer ? `\nIssuer: ${entry.issuer}` : ''}\nOTP Auth URI: ${uri}\n`;
    }).join('\n---\n\n');

    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `totp-setup-keys-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Export 2FA Setup Keys
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {entries.length} code{entries.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {entry.title}
                  </h3>
                  {entry.issuer && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{entry.issuer}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Secret Key
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono text-gray-900 dark:text-white break-all">
                      {entry.secret}
                    </code>
                    <button
                      onClick={() => handleCopySetupKey(entry)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium flex-shrink-0"
                    >
                      {copiedId === entry.id ? (
                        <>
                          <Check size={16} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleCopyOtpAuthUri(entry)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Copy as OTP Auth URI
                  </button>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>Algorithm: {entry.algorithm || 'SHA1'}</p>
                  <p>Digits: {entry.digits || 6}</p>
                  <p>Period: {entry.period || 30}s</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
          <button
            onClick={handleExportAll}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Export All as Text File
          </button>
        </div>
      </div>
    </div>
  );
}
