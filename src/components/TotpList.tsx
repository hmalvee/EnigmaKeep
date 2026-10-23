import { useState, useEffect } from 'react';
import { Edit2, Trash2, Star, Copy, ShieldCheck } from 'lucide-react';
import { TotpEntry } from '../types/vault';
import { generateTOTP } from '../utils/totp';
import { Avatar, EmptyState, OverflowMenu } from './ui';

interface TotpListProps {
  entries: TotpEntry[];
  onEdit: (entry: TotpEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopy: (code: string, title: string) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  emptyAction?: React.ReactNode;
}

interface TotpCode {
  code: string;
  timeRemaining: number;
}

/** "123456" -> "123 456", "12345678" -> "1234 5678" */
function groupCode(code: string): string {
  const half = Math.ceil(code.length / 2);
  return `${code.slice(0, half)} ${code.slice(half)}`;
}

function Countdown({ remaining, period }: { remaining: number; period: number }) {
  const r = 9;
  const circumference = 2 * Math.PI * r;
  const fraction = remaining / period;
  const tone = fraction > 0.25 ? 'text-accent' : 'text-danger';
  return (
    <span className={`relative inline-flex h-7 w-7 items-center justify-center ${tone}`} title={`${remaining}s left`}>
      <svg viewBox="0 0 24 24" className="absolute inset-0 -rotate-90">
        <circle cx="12" cy="12" r={r} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2.5" />
        <circle
          cx="12" cy="12" r={r} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <span className="text-[9px] font-semibold tabular-nums">{remaining}</span>
    </span>
  );
}

export function TotpList({ entries, onEdit, onDelete, onToggleFavorite, onCopy, selectedIds = [], onSelectionChange, emptyAction }: TotpListProps) {
  const [codes, setCodes] = useState<Record<string, TotpCode>>({});

  useEffect(() => {
    const updateCodes = async () => {
      const newCodes: Record<string, TotpCode> = {};
      for (const entry of entries) {
        try {
          newCodes[entry.id] = await generateTOTP(entry.secret, {
            algorithm: entry.algorithm,
            digits: entry.digits,
            period: entry.period
          });
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

  const sortedEntries = [...entries].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return a.title.localeCompare(b.title);
  });

  const toggleSelection = (id: string) => {
    if (!onSelectionChange) return;
    onSelectionChange(selectedIds.includes(id) ? selectedIds.filter(s => s !== id) : [...selectedIds, id]);
  };

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(selectedIds.length === entries.length ? [] : entries.map(e => e.id));
  };

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<ShieldCheck size={22} strokeWidth={1.7} />}
        title="No 2FA codes yet"
        description="Add the setup key from a site's two-factor settings, and EnigmaKeep will generate the codes."
        action={emptyAction}
      />
    );
  }

  return (
    <div className="list-panel">
      {onSelectionChange && (
        <div className="hidden items-center gap-3 bg-surface2/50 px-4 py-2.5 text-xs font-medium text-muted sm:flex">
          <input
            type="checkbox"
            aria-label="Select all"
            checked={selectedIds.length === entries.length && entries.length > 0}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-line text-accent focus:ring-2 focus:ring-focus/30"
          />
          <span>{selectedIds.length > 0 ? `${selectedIds.length} selected` : `${entries.length} ${entries.length === 1 ? 'code' : 'codes'}`}</span>
        </div>
      )}

      {sortedEntries.map((entry) => {
        const totpCode = codes[entry.id];
        const period = entry.period || 30;
        const isSelected = selectedIds.includes(entry.id);
        const subtitle = entry.accountName || (entry.issuer && entry.issuer !== entry.title ? entry.issuer : '');

        return (
          <div key={entry.id} className={`list-row ${isSelected ? 'bg-accent/[0.06]' : ''}`}>
            {onSelectionChange && (
              <input
                type="checkbox"
                aria-label={`Select ${entry.title}`}
                checked={isSelected}
                onChange={() => toggleSelection(entry.id)}
                className="hidden h-4 w-4 shrink-0 rounded border-line text-accent focus:ring-2 focus:ring-focus/30 sm:block"
              />
            )}
            <Avatar name={entry.issuer || entry.title} />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium text-ink">{entry.title}</span>
                {entry.favorite && <Star size={12} className="shrink-0 text-accent" fill="currentColor" aria-label="Favorite" />}
              </div>
              {subtitle && <div className="truncate text-[13px] text-muted">{subtitle}</div>}
            </div>

            {totpCode ? (
              <>
                <button
                  type="button"
                  onClick={() => onCopy(totpCode.code, entry.title)}
                  className="rounded-md px-2 py-1 text-base font-semibold tabular-nums tracking-[0.06em] text-ink transition-colors hover:bg-ink/5 sm:text-xl"
                  title="Copy code"
                >
                  {groupCode(totpCode.code)}
                </button>
                <Countdown remaining={totpCode.timeRemaining} period={period} />
              </>
            ) : (
              <span className="font-mono text-lg text-muted">--- ---</span>
            )}

            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => totpCode && onCopy(totpCode.code, entry.title)}
                className="icon-btn hidden sm:inline-flex"
                title="Copy code"
                aria-label="Copy code"
              >
                <Copy size={16} />
              </button>
              <OverflowMenu
                items={[
                  { label: entry.favorite ? 'Remove favorite' : 'Add to favorites', icon: <Star size={15} />, onSelect: () => onToggleFavorite(entry.id) },
                  { label: 'Edit', icon: <Edit2 size={15} />, onSelect: () => onEdit(entry) },
                  { label: 'Delete', icon: <Trash2 size={15} />, onSelect: () => onDelete(entry.id), danger: true }
                ]}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
