import { useState, useRef, useEffect } from 'react';
import {
  X, RefreshCw, Star, Eye, EyeOff, ChevronDown, ChevronUp, Link2, Sparkles
} from 'lucide-react';
import type { PasswordEntry, EntryType } from '../types/vault';
import { generatePassword } from '../utils/passwordGenerator';
import { calculatePasswordStrength } from '../utils/passwordStrength';
import { DEFAULT_CATEGORIES } from './CategoryFilter';

interface Props {
  entry?: PasswordEntry;
  onSave: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

function hostnameFromUrl(raw: string): string {
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProto).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function EntryModal({ entry, onSave, onClose }: Props) {
  const [entryType] = useState<EntryType>(entry?.type || 'password');
  const [title, setTitle] = useState(entry?.title || '');
  const [username, setUsername] = useState(entry?.username || '');
  const [password, setPassword] = useState(entry?.password || '');
  const [url, setUrl] = useState(entry?.url || '');
  const [notes, setNotes] = useState(entry?.notes || '');
  const [category, setCategory] = useState(entry?.category || '');
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [favorite, setFavorite] = useState(entry?.favorite || false);
  const [tagInput, setTagInput] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [showMore, setShowMore] = useState(
    !!(entry?.notes || entry?.tags?.length || entry?.category)
  );
  const [genLength, setGenLength] = useState(20);
  const [genOptions, setGenOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });
  const [showGenOptions, setShowGenOptions] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const passwordStrength = calculatePasswordStrength(password);
  const canSave = title.trim().length > 0 && (entryType !== 'password' || password.length > 0);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const handleGenerate = () => {
    setPassword(generatePassword({ length: genLength, ...genOptions }));
    setShowPassword(true);
  };

  const handleUrlBlur = () => {
    if (!url.trim() || title.trim()) return;
    const host = hostnameFromUrl(url.trim());
    if (host) setTitle(host);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    let normalizedUrl = url.trim() || undefined;
    if (normalizedUrl && !/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    onSave({
      type: entryType,
      title: title.trim(),
      username: username.trim(),
      password,
      url: normalizedUrl,
      notes: notes.trim() || undefined,
      category: category || undefined,
      tags: tags.length > 0 ? tags : undefined,
      favorite
    });
    onClose();
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface border border-line rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto animate-scaleIn">
        <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur border-b border-line px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-lg font-display font-semibold text-ink">
              {entry ? 'Edit entry' : 'New password'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {entry ? 'Update this vault item' : 'Title + password is enough to save'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFavorite(!favorite)}
              className={`p-2 rounded-lg transition-colors ${
                favorite ? 'text-accent bg-accent/10' : 'text-muted hover:text-accent hover:bg-surface2'
              }`}
              title={favorite ? 'Unfavorite' : 'Favorite'}
            >
              <Star size={18} fill={favorite ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-muted hover:text-ink hover:bg-surface2 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSave) {
              e.preventDefault();
              (e.currentTarget as HTMLFormElement).requestSubmit();
            }
          }}
          className="p-5 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Title</label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="ai-input text-base"
              placeholder="e.g. GitHub, Bank, Netflix"
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Username or email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="ai-input"
              placeholder="you@example.com"
              autoComplete="username"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-muted">Password</label>
              <button
                type="button"
                onClick={handleGenerate}
                className="text-xs font-medium text-accent hover:text-accent-2 flex items-center gap-1 transition-colors"
              >
                <Sparkles size={12} />
                Generate strong
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ai-input flex-1 font-mono tracking-wide"
                placeholder="••••••••••••"
                required={entryType === 'password'}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="px-3 py-2 bg-surface2 border border-line hover:border-accent/40 text-muted hover:text-accent rounded-xl transition-colors"
                title={showPassword ? 'Hide' : 'Show'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button
                type="button"
                onClick={() => setShowGenOptions(v => !v)}
                className="px-3 py-2 bg-surface2 border border-line hover:border-accent/40 text-muted hover:text-accent rounded-xl transition-colors"
                title="Generator options"
              >
                <RefreshCw size={18} />
              </button>
            </div>
            {password && (
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-surface2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      passwordStrength.score < 1.5
                        ? 'bg-danger w-1/4'
                        : passwordStrength.score < 2.5
                          ? 'bg-orange-400 w-2/4'
                          : passwordStrength.score < 3.5
                            ? 'bg-yellow-400 w-3/4'
                            : 'bg-success w-full'
                    }`}
                  />
                </div>
                <span className={`text-xs font-medium ${passwordStrength.color}`}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          {showGenOptions && (
            <div className="bg-surface2 rounded-xl p-4 space-y-3 border border-line animate-slideIn">
              <div>
                <label className="block text-sm font-medium text-muted mb-1">
                  Length: {genLength}
                </label>
                <input
                  type="range"
                  min="12"
                  max="64"
                  value={genLength}
                  onChange={(e) => setGenLength(Number(e.target.value))}
                  className="w-full accent-[rgb(var(--accent))]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-ink">
                {(
                  [
                    ['uppercase', 'A–Z'],
                    ['lowercase', 'a–z'],
                    ['numbers', '0–9'],
                    ['symbols', '!@#$']
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genOptions[key]}
                      onChange={(e) => setGenOptions({ ...genOptions, [key]: e.target.checked })}
                      className="rounded border-line"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <button type="button" onClick={handleGenerate} className="btn-primary w-full !py-2.5 text-sm">
                Generate & fill
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-muted mb-1.5 flex items-center gap-1.5">
              <Link2 size={14} />
              Website
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleUrlBlur}
              className="ai-input"
              placeholder="example.com"
              autoComplete="url"
            />
            <p className="text-[11px] text-muted mt-1">Leave title empty and we’ll name it from the site</p>
          </div>

          <button
            type="button"
            onClick={() => setShowMore(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-line text-sm text-muted hover:text-ink hover:border-accent/30 transition-colors"
          >
            <span>Category, tags & notes</span>
            {showMore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showMore && (
            <div className="space-y-4 animate-slideIn">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      !category
                        ? 'bg-accent/10 text-accent border-accent/30'
                        : 'bg-surface2 text-muted border-line hover:border-accent/30'
                    }`}
                  >
                    None
                  </button>
                  {DEFAULT_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        category === cat
                          ? 'bg-accent/10 text-accent border-accent/30'
                          : 'bg-surface2 text-muted border-line hover:border-accent/30'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="ai-input flex-1"
                    placeholder="Add tag, press Enter"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-surface2 border border-line text-ink rounded-xl hover:border-accent/40 transition-colors text-sm"
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 bg-accent/10 text-accent rounded-lg text-xs flex items-center gap-1.5 border border-accent/20"
                      >
                        {tag}
                        <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-accent-2">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="ai-input resize-none"
                  placeholder="Recovery codes, security questions…"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2 pb-1 sticky bottom-0 bg-surface">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={!canSave} className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed">
              {entry ? 'Save changes' : 'Add to vault'}
            </button>
          </div>
          <p className="text-center text-[11px] text-muted -mt-2 pb-1">
            Tip: Ctrl/⌘ + Enter to save
          </p>
        </form>
      </div>
    </div>
  );
}
