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
    if (percentage > 50) return 'bg-success';
    if (percentage > 25) return 'bg-accent';
    return 'bg-danger';
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
        <div className="w-24 h-24 bg-surface2 rounded-full flex items-center justify-center mx-auto mb-4">
          <RefreshCw size={48} className="text-muted" />
        </div>
        <h3 className="text-xl font-semibold text-ink mb-2">
          No 2FA codes yet
        </h3>
        <p className="text-muted">
          Add your first 2FA code to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {onSelectionChange && (
        <div className="flex items-center gap-3 p-3 bg-surface2 rounded-lg border border-line">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.length === entries.length && entries.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 text-accent rounded focus:ring-2 focus:ring-accent"
            />
            <span className="text-sm font-medium text-muted">
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
              className={`bg-surface rounded-xl border ${
                isSelected ? 'border-accent ring-2 ring-accent/30' : 'border-line'
              } p-5 hover:shadow-md transition-all`}
            >
              <div className="flex items-center gap-4">
                {onSelectionChange && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(entry.id)}
                    className="w-4 h-4 text-accent rounded focus:ring-2 focus:ring-accent flex-shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-ink truncate">
                        {entry.title}
                      </h3>
                      {entry.favorite && (
                        <Star size={14} className="text-accent fill-accent flex-shrink-0" />
                      )}
                    </div>
                    <button
                      onClick={() => onToggleFavorite(entry.id)}
                      className="text-muted hover:text-accent transition-colors flex-shrink-0"
                      title={entry.favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star size={18} className={entry.favorite ? 'fill-accent text-accent' : ''} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {totpCode ? (
                        <button
                          onClick={() => onCopy(totpCode.code, entry.title)}
                          className="group text-left w-full"
                        >
                          <div className="text-3xl font-mono font-bold text-accent tracking-[0.3em] group-hover:text-accent-2 transition-colors">
                            {totpCode.code}
                          </div>
                          <div className="mt-2 h-1 bg-surface2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-1000 ease-linear ${getProgressColor(totpCode.timeRemaining, period)}`}
                              style={{ width: `${(totpCode.timeRemaining / period) * 100}%` }}
                            />
                          </div>
                        </button>
                      ) : (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin text-muted">
                            <RefreshCw size={20} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                      {totpCode && (
                        <div className="flex items-center gap-1 text-sm text-muted">
                          <Clock size={14} />
                          <span className="font-mono font-semibold">{totpCode.timeRemaining}s</span>
                        </div>
                      )}
                      <div className="flex gap-1">
                        <button
                          onClick={() => onEdit(entry)}
                          className="p-1.5 text-muted hover:bg-surface2 hover:text-accent rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(entry.id)}
                          className="p-1.5 text-muted hover:bg-danger/10 hover:text-danger rounded transition-colors"
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
