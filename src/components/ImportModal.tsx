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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scaleIn flex flex-col">
        <div className="bg-gradient-to-r from-cyan-700 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <Upload className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Import Passwords</h2>
              <p className="text-cyan-100 text-sm">Import from other password managers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Import Source</label>
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
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                      : 'border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Select File</label>
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
                className="flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-cyan-500 transition-all duration-200 cursor-pointer bg-gray-900/50"
              >
                <FileText className="text-gray-400" size={24} />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-300">
                    {file ? file.name : 'Click to select file'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
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
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Process File'}
            </button>
          )}

          {result && (
            <div className="space-y-4">
              {result.entries.length > 0 && (
                <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-green-400 font-semibold">
                        Found {result.entries.length} entries
                      </p>
                      <p className="text-green-400/80 text-sm mt-1">
                        Ready to import these passwords into your vault
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="text-amber-400 font-semibold mb-2">
                        {result.errors.length} warnings
                      </p>
                      <ul className="space-y-1 text-sm text-amber-400/80 max-h-32 overflow-y-auto">
                        {result.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {result.entries.length === 0 && result.errors.length > 0 && (
                <p className="text-center text-gray-400 py-4">
                  No entries could be imported. Please check the file format.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-700 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={!result || result.entries.length === 0}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import {result && result.entries.length > 0 ? `${result.entries.length} Entries` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
