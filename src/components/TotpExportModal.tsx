import { X, Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { TotpEntry } from '../types/vault';
import { generateOtpAuthUri } from '../utils/totp';
import { secureCopy } from '../utils/secureClipboard';

interface TotpExportModalProps {
  entries: TotpEntry[];
  onClose: () => void;
}

export function TotpExportModal({ entries, onClose }: TotpExportModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopySetupKey = async (entry: TotpEntry) => {
    const setupKey = `${entry.title}\nSecret: ${entry.secret}${entry.issuer ? `\nIssuer: ${entry.issuer}` : ''}`;
    await secureCopy(setupKey, 30_000);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyOtpAuthUri = async (entry: TotpEntry) => {
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
    await secureCopy(uri, 30_000);
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-line rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-surface border-b border-line px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-ink">
              Export 2FA Setup Keys
            </h2>
            <p className="text-sm text-muted mt-1">
              {entries.length} code{entries.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-surface2 rounded-xl border border-line p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-ink">
                    {entry.title}
                  </h3>
                  {entry.issuer && (
                    <p className="text-sm text-muted">{entry.issuer}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Secret Key
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-surface border border-line rounded-lg text-sm font-mono text-ink break-all">
                      {entry.secret}
                    </code>
                    <button
                      onClick={() => handleCopySetupKey(entry)}
                      className="px-3 py-2 bg-accent text-accent-ink rounded-lg hover:bg-accent-2 transition-colors flex items-center gap-2 text-sm font-medium flex-shrink-0"
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
                    className="text-sm text-accent hover:underline flex items-center gap-1"
                  >
                    Copy as OTP Auth URI
                  </button>
                </div>

                <div className="pt-2 border-t border-line text-xs text-muted space-y-1">
                  <p>Algorithm: {entry.algorithm || 'SHA1'}</p>
                  <p>Digits: {entry.digits || 6}</p>
                  <p>Period: {entry.period || 30}s</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-line px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="btn-ghost flex-1"
          >
            Close
          </button>
          <button
            onClick={handleExportAll}
            className="btn-primary flex-1 gap-2"
          >
            <Download size={18} />
            Export All as Text File
          </button>
        </div>
      </div>
    </div>
  );
}
