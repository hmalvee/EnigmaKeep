import { useState, useEffect } from 'react';
import { Eye, EyeOff, Copy, Edit2, Trash2, ExternalLink, CopyPlus } from 'lucide-react';
import type { PasswordEntry as PasswordEntryType } from '../types/vault';

interface Props {
  entry: PasswordEntryType;
  onEdit: (entry: PasswordEntryType) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (entry: PasswordEntryType) => void;
  onCopyNotification?: (message: string, countdown: number) => void;
  clipboardTimeout?: number;
}

export function PasswordEntry({ entry, onEdit, onDelete, onDuplicate, onCopyNotification, clipboardTimeout = 15000 }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (showPassword) {
      const timer = setTimeout(() => setShowPassword(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showPassword]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      if (onCopyNotification) {
        onCopyNotification('Password copied to clipboard', Math.floor(clipboardTimeout / 1000));
      }

      setTimeout(() => {
        navigator.clipboard.writeText('');
      }, clipboardTimeout);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg hover:border-cyan-500 transition-all duration-300 group animate-fadeIn">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">{entry.title}</h3>
            {entry.url && (
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 dark:text-gray-500 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-200"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{entry.username}</p>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {onDuplicate && (
            <button
              onClick={() => onDuplicate(entry)}
              className="p-2 text-gray-500 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110"
              title="Duplicate entry"
            >
              <CopyPlus size={16} />
            </button>
          )}
          <button
            onClick={() => onEdit(entry)}
            className="p-2 text-gray-500 dark:text-gray-500 hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-2 text-gray-500 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-700 rounded-lg px-3 py-2.5 font-mono text-sm transition-all duration-200 text-gray-900 dark:text-white">
            {showPassword ? entry.password : '••••••••••••'}
          </div>
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-cyan-500 dark:hover:text-cyan-400 rounded-lg transition-all duration-200 hover:scale-110"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button
            onClick={() => copyToClipboard(entry.password)}
            className="p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-emerald-500 dark:hover:text-emerald-400 rounded-lg transition-all duration-200 hover:scale-110"
          >
            <Copy size={18} />
          </button>
        </div>
        {copied && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-fadeIn">
            Copied! Will clear in {clipboardTimeout / 1000} seconds
          </p>
        )}
      </div>

      {entry.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{entry.notes}</p>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
        Updated: {new Date(entry.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}
