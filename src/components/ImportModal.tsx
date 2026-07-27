import { useState } from 'react';
import { X, Upload, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import {
  importFromCSV,
  importFromJSON,
  importFrom1Password,
  importFromLastPass,
  importFromBitwarden,
  importFromChrome,
  type ImportResult
} from '../utils/importExport';
import type { PasswordEntry } from '../types/vault';

interface ImportModalProps {
  onImport: (entries: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  onClose: () => void;
}

type ImportSource = 'generic-csv' | 'generic-json' | '1password' | 'lastpass' | 'bitwarden' | 'chrome';

export function ImportModal({ onImport, onClose }: ImportModalProps) {
  const [source, setSource] = useState<ImportSource>('generic-csv');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const content = await file.text();
      let importResult: ImportResult;

      switch (source) {
        case 'generic-csv':
          importResult = importFromCSV(content);
          break;
        case 'generic-json':
          importResult = importFromJSON(content);
          break;
        case '1password':
          importResult = importFrom1Password(content);
          break;
        case 'lastpass':
          importResult = importFromLastPass(content);
          break;
        case 'bitwarden':
          importResult = importFromBitwarden(content);
          break;
        case 'chrome':
          importResult = importFromChrome(content);
          break;
        default:
          importResult = { entries: [], errors: ['Unknown import source'] };
      }

      setResult(importResult);
    } catch (error) {
      setResult({ entries: [], errors: ['Failed to read file'] });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (result && result.entries.length > 0) {
      onImport(result.entries);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface border border-line rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scaleIn flex flex-col">
        <div className="bg-surface2 px-6 py-4 flex items-center justify-between border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Upload className="text-accent" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink">Import Passwords</h2>
              <p className="text-muted text-sm">Import from other password managers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-ink hover:bg-surface rounded-lg transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-muted mb-3">Import Source</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'generic-csv', label: 'Generic CSV' },
                { value: 'generic-json', label: 'Generic JSON' },
                { value: '1password', label: '1Password CSV' },
                { value: 'lastpass', label: 'LastPass CSV' },
                { value: 'bitwarden', label: 'Bitwarden JSON' },
                { value: 'chrome', label: 'Chrome CSV' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSource(option.value as ImportSource)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                    source === option.value
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-line text-muted hover:border-accent/40'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-3">Select File</label>
            <div className="relative">
              <input
                type="file"
                accept={source.includes('json') ? '.json' : '.csv'}
                onChange={handleFileChange}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed border-line rounded-lg hover:border-accent transition-all duration-200 cursor-pointer bg-surface2"
              >
                <FileText className="text-muted" size={24} />
                <div className="text-center">
                  <p className="text-sm font-medium text-muted">
                    {file ? file.name : 'Click to select file'}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {source.includes('json') ? 'JSON files only' : 'CSV files only'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {file && !result && (
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Process File'}
            </button>
          )}

          {result && (
            <div className="space-y-4">
              {result.entries.length > 0 && (
                <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="text-success flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-success font-semibold">
                        Found {result.entries.length} entries
                      </p>
                      <p className="text-success/80 text-sm mt-1">
                        Ready to import these passwords into your vault
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-accent flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="text-accent font-semibold mb-2">
                        {result.errors.length} warnings
                      </p>
                      <ul className="space-y-1 text-sm text-muted max-h-32 overflow-y-auto">
                        {result.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {result.entries.length === 0 && result.errors.length > 0 && (
                <p className="text-center text-muted py-4">
                  No entries could be imported. Please check the file format.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-line px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="btn-ghost flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={!result || result.entries.length === 0}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import {result && result.entries.length > 0 ? `${result.entries.length} Entries` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
