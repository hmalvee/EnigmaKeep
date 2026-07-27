import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Eye, EyeOff, Copy, Edit2, Trash2, ExternalLink, CopyPlus,
  Star, Check
} from 'lucide-react';
import type { PasswordEntry as PasswordEntryType } from '../types/vault';
import { secureCopy } from '../utils/secureClipboard';
import { CATEGORY_COLORS } from './CategoryFilter';

interface Props {
  entry: PasswordEntryType;
  onEdit: (entry: PasswordEntryType) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (entry: PasswordEntryType) => void;
  onToggleFavorite?: (id: string) => void;
  onCopyNotification?: (message: string, countdown: number) => void;
  clipboardTimeout?: number;
}

function entryInitial(title: string): string {
  const t = title.trim();
  if (!t) return '?';
  return t.charAt(0).toUpperCase();
}

function displayHost(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function PasswordEntry({
  entry,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onCopyNotification,
  clipboardTimeout = 15000
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'user' | 'pass' | null>(null);
  const cardRef = useRef<HTMLElement>(null);

  const host = useMemo(() => displayHost(entry.url), [entry.url]);
  const categoryStyle = entry.category
    ? (CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['Other'])
    : null;

  useEffect(() => {
    if (!showPassword) return;
    const timer = setTimeout(() => setShowPassword(false), 8000);
    return () => clearTimeout(timer);
  }, [showPassword]);

  useEffect(() => {
    if (!copiedField) return;
    const timer = setTimeout(() => setCopiedField(null), 1800);
    return () => clearTimeout(timer);
  }, [copiedField]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }, []);

  const copyField = async (text: string, field: 'user' | 'pass', label: string) => {
    if (!text) return;
    try {
      await secureCopy(text, clipboardTimeout);
      setCopiedField(field);
      if (onCopyNotification) {
        onCopyNotification(
          field === 'pass' ? `${label} copied — clears soon` : `${label} copied`,
          Math.floor(clipboardTimeout / 1000)
        );
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <article
      ref={cardRef}
      onPointerMove={onPointerMove}
      className="vault-entry-card group"
    >
      <div className="cipher-mesh" aria-hidden />

      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div
          className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0 font-display font-bold text-accent text-base transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[-3deg]"
          aria-hidden
        >
          {entryInitial(entry.title)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="font-display font-semibold text-ink text-[15px] leading-tight truncate">
              {entry.title}
            </h3>
            {entry.favorite && (
              <Star size={13} className="text-accent shrink-0" fill="currentColor" aria-label="Favorite" />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted min-w-0">
            {host ? (
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent truncate inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {host}
                <ExternalLink size={10} className="opacity-70 shrink-0" />
              </a>
            ) : entry.username ? (
              <span className="truncate">{entry.username}</span>
            ) : (
              <span className="opacity-60">No website</span>
            )}
            {entry.category && categoryStyle && (
              <>
                <span className="opacity-40">·</span>
                <span className={`px-1.5 py-px rounded text-[10px] font-medium border shrink-0 ${categoryStyle}`}>
                  {entry.category}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(entry.id)}
              className={`p-2 rounded-lg ${
                entry.favorite ? 'text-accent bg-accent/10' : 'text-muted hover:text-accent hover:bg-surface2'
              }`}
              title={entry.favorite ? 'Unfavorite' : 'Favorite'}
            >
              <Star size={15} fill={entry.favorite ? 'currentColor' : 'none'} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="p-2 text-muted hover:text-accent hover:bg-surface2 rounded-lg"
            title="Edit"
          >
            <Edit2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="p-2 text-muted hover:text-danger hover:bg-surface2 rounded-lg"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="mx-4 mb-4 rounded-xl border border-line bg-surface2/80 backdrop-blur-sm overflow-hidden divide-y divide-line">
        <div className="flex items-center gap-3 px-3 py-2.5 min-h-[44px]">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted w-14 shrink-0">
            User
          </span>
          <span className="flex-1 text-sm text-ink truncate">
            {entry.username || <span className="text-muted italic">—</span>}
          </span>
          {entry.username && (
            <button
              type="button"
              onClick={() => copyField(entry.username, 'user', 'Username')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                copiedField === 'user'
                  ? 'bg-success/15 text-success'
                  : 'bg-surface text-muted hover:text-ink border border-line'
              }`}
            >
              {copiedField === 'user' ? <Check size={13} /> : <Copy size={13} />}
              {copiedField === 'user' ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 px-3 py-2.5 min-h-[44px]">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted w-14 shrink-0">
            Pass
          </span>
          <span className="flex-1 text-sm font-mono text-ink truncate tracking-wider">
            {showPassword ? entry.password : '••••••••••••••••'}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface border border-transparent hover:border-line"
              title={showPassword ? 'Hide' : 'Show'}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              type="button"
              onClick={() => copyField(entry.password, 'pass', 'Password')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                copiedField === 'pass'
                  ? 'bg-success/15 text-success'
                  : 'bg-accent text-accent-ink hover:bg-accent-2'
              }`}
            >
              {copiedField === 'pass' ? <Check size={13} /> : <Copy size={13} />}
              {copiedField === 'pass' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {(entry.notes || (entry.tags && entry.tags.length > 0) || onDuplicate) && (
        <div className="px-4 pb-3.5 flex items-start justify-between gap-3 border-t border-line/80 pt-2.5">
          <div className="min-w-0 flex-1">
            {entry.notes && (
              <p className="text-xs text-muted line-clamp-2 leading-relaxed">{entry.notes}</p>
            )}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {entry.tags.map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-surface2 text-muted border border-line">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          {onDuplicate && (
            <button
              type="button"
              onClick={() => onDuplicate(entry)}
              className="p-1.5 text-muted hover:text-accent hover:bg-surface2 rounded-lg shrink-0"
              title="Duplicate"
            >
              <CopyPlus size={14} />
            </button>
          )}
        </div>
      )}
    </article>
  );
}
