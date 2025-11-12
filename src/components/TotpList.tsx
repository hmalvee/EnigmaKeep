import { useState, useEffect } from 'react';
import { Copy, Edit2, Trash2, Star, Clock, RefreshCw } from 'lucide-react';
import { TotpEntry } from '../types/vault';
import { generateTOTP } from '../utils/totp';

interface TotpListProps {
  entries: TotpEntry[];
  onEdit: (entry: TotpEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopy: (code: string, title: string) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

interface TotpCode {
  code: string;
  timeRemaining: number;
}

export function TotpList({ entries, onEdit, onDelete, onToggleFavorite, onCopy, selectedIds = [], onSelectionChange }: TotpListProps) {
  const [codes, setCodes] = useState<Record<string, TotpCode>>({});

  useEffect(() => {
    const updateCodes = async () => {
      const newCodes: Record<string, TotpCode> = {};

      for (const entry of entries) {
        try {
          const result = await generateTOTP(entry.secret, {
            algorithm: entry.algorithm,
            digits: entry.digits,
            period: entry.period
          });
          newCodes[entry.id] = result;
        } catch (error) {
          console.error(`Error generating TOTP for ${entry.title}:`, error);
        }
      }

      setCodes(newCodes);
    };

    updateCodes();
    const interval = setInterval(updateCodes, 1000);
    return () => clearInterval(interval);
  }, [entries]);

  const getProgressColor = (timeRemaining: number, period: number = 30) => {
    const percentage = (timeRemaining / period) * 100;
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const sortedEntries = [...entries].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return a.title.localeCompare(b.title);
  });

  const toggleSelection = (id: string) => {
    if (!onSelectionChange) return;

    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;

    if (selectedIds.length === entries.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(entries.map(e => e.id));
    }
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <RefreshCw size={48} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No 2FA codes yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Add your first 2FA code to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {onSelectionChange && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.length === entries.length && entries.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select All ({selectedIds.length} selected)
            </span>
          </label>
        </div>
      )}

      <div className="space-y-3">
        {sortedEntries.map((entry) => {
          const totpCode = codes[entry.id];
          const period = entry.period || 30;
          const isSelected = selectedIds.includes(entry.id);

          return (
            <div
              key={entry.id}
              className={`bg-white dark:bg-gray-800 rounded-xl border ${
                isSelected ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' : 'border-gray-200 dark:border-gray-700'
              } p-5 hover:shadow-md transition-all`}
            >
              <div className="flex items-center gap-4">
                {onSelectionChange && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(entry.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                        {entry.title}
                      </h3>
                      {entry.favorite && (
                        <Star size={14} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    <button
                      onClick={() => onToggleFavorite(entry.id)}
                      className="text-gray-400 hover:text-yellow-500 transition-colors flex-shrink-0"
                      title={entry.favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star size={18} className={entry.favorite ? 'fill-yellow-500 text-yellow-500' : ''} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {totpCode ? (
                        <button
                          onClick={() => onCopy(totpCode.code, entry.title)}
                          className="group text-left w-full"
                        >
                          <div className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-[0.3em] group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                            {totpCode.code}
                          </div>
                          <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-1000 ease-linear ${getProgressColor(totpCode.timeRemaining, period)}`}
                              style={{ width: `${(totpCode.timeRemaining / period) * 100}%` }}
                            />
                          </div>
                        </button>
                      ) : (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin text-gray-400">
                            <RefreshCw size={20} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                      {totpCode && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <Clock size={14} />
                          <span className="font-mono font-semibold">{totpCode.timeRemaining}s</span>
                        </div>
                      )}
                      <div className="flex gap-1">
                        <button
                          onClick={() => onEdit(entry)}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(entry.id)}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
