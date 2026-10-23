import { useEffect, useMemo, useState } from 'react';
import { Copy, Edit2, Trash2, ExternalLink, CopyPlus, Star, Check, KeyRound, User } from 'lucide-react';
import type { PasswordEntry as PasswordEntryType } from '../types/vault';
import { secureCopy } from '../utils/secureClipboard';
import { CATEGORY_COLORS } from './CategoryFilter';
import { Avatar, OverflowMenu } from './ui';

interface Props {
  entry: PasswordEntryType;
  onEdit: (entry: PasswordEntryType) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (entry: PasswordEntryType) => void;
  onToggleFavorite?: (id: string) => void;
  onCopyNotification?: (message: string, countdown: number) => void;
  clipboardTimeout?: number;
}

function displayHost(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/** Only http(s) URLs are opened; imported entries may carry any scheme. */
export function openEntryUrl(url?: string): void {
  if (!url) return;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return;
    window.open(parsed.href, '_blank', 'noopener,noreferrer');
  } catch {
    /* not a URL */
  }
}

/** One login in the passwords list. Clicking the row opens it for editing. */
export function PasswordEntry({
  entry,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onCopyNotification,
  clipboardTimeout = 15000
}: Props) {
  const [copiedField, setCopiedField] = useState<'user' | 'pass' | null>(null);
  const host = useMemo(() => displayHost(entry.url), [entry.url]);
  const categoryStyle = entry.category ? (CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['Other']) : null;

  useEffect(() => {
    if (!copiedField) return;
    const timer = setTimeout(() => setCopiedField(null), 1800);
    return () => clearTimeout(timer);
  }, [copiedField]);

  const copyField = async (text: string, field: 'user' | 'pass', label: string) => {
    if (!text) return;
    try {
      await secureCopy(text, clipboardTimeout);
      setCopiedField(field);
      onCopyNotification?.(`${label} copied`, field === 'pass' ? Math.floor(clipboardTimeout / 1000) : 0);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    // The whole row is a mouse target; keyboard users get the title button.
    <div onClick={() => onEdit(entry)} className="list-row group cursor-pointer focus-within:bg-ink/[0.03]">
      <Avatar name={entry.title} />

      <button
        type="button"
        onClick={stop(() => onEdit(entry))}
        className="min-w-0 flex-1 text-left focus:outline-none focus-visible:underline"
        aria-label={`Open ${entry.title}`}
      >
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-ink">{entry.title}</span>
          {entry.favorite && <Star size={12} className="shrink-0 text-accent" fill="currentColor" aria-label="Favorite" />}
        </span>
        <span className="block truncate text-[13px] text-muted">
          {entry.username || host || 'No username'}
        </span>
      </button>

      <div className="hidden w-48 min-w-0 truncate text-[13px] text-muted lg:block">
        {host ?? <span className="opacity-50">No website</span>}
      </div>

      <div className="hidden w-28 md:block">
        {entry.category && categoryStyle && (
          <span className={`inline-block max-w-full truncate rounded border px-1.5 py-0.5 text-[11px] font-medium ${categoryStyle}`}>
            {entry.category}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {entry.username && (
          <button
            type="button"
            onClick={stop(() => copyField(entry.username, 'user', 'Username'))}
            className={`icon-btn hidden sm:inline-flex ${copiedField === 'user' ? '!text-success' : ''}`}
            title="Copy username"
            aria-label="Copy username"
          >
            {copiedField === 'user' ? <Check size={16} /> : <User size={16} />}
          </button>
        )}
        <button
          type="button"
          onClick={stop(() => copyField(entry.password, 'pass', 'Password'))}
          className={`icon-btn ${copiedField === 'pass' ? '!text-success' : ''}`}
          title="Copy password"
          aria-label="Copy password"
        >
          {copiedField === 'pass' ? <Check size={16} /> : <KeyRound size={16} />}
        </button>
        <OverflowMenu
          items={[
            ...(entry.username ? [{ label: 'Copy username', icon: <Copy size={15} />, onSelect: () => copyField(entry.username, 'user', 'Username') }] : []),
            ...(entry.url ? [{ label: 'Open website', icon: <ExternalLink size={15} />, onSelect: () => openEntryUrl(entry.url) }] : []),
            ...(onToggleFavorite ? [{ label: entry.favorite ? 'Remove favorite' : 'Add to favorites', icon: <Star size={15} />, onSelect: () => onToggleFavorite(entry.id) }] : []),
            { label: 'Edit', icon: <Edit2 size={15} />, onSelect: () => onEdit(entry) },
            ...(onDuplicate ? [{ label: 'Duplicate', icon: <CopyPlus size={15} />, onSelect: () => onDuplicate(entry) }] : []),
            { label: 'Delete', icon: <Trash2 size={15} />, onSelect: () => onDelete(entry.id), danger: true }
          ]}
        />
      </div>
    </div>
  );
}
