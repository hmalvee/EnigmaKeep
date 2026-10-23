import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, MoreHorizontal } from 'lucide-react';

/** Accessible on/off switch. */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 ${
        checked ? 'bg-accent' : 'bg-ink/15'
      }`}
    >
      <span
        className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[23px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );
}

/** A titled card that groups related settings rows. */
export function SettingsCard({
  title,
  description,
  action,
  children,
  tone
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  tone?: 'danger';
}) {
  return (
    <section className={`rounded-xl border bg-surface ${tone === 'danger' ? 'border-danger/30' : 'border-line'}`}>
      <header className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <h3 className={`text-[15px] font-semibold ${tone === 'danger' ? 'text-danger' : 'text-ink'}`}>{title}</h3>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      {children && <div className="border-t border-line divide-y divide-line">{children}</div>}
    </section>
  );
}

/** Label and help text on the left, a control on the right. */
export function SettingRow({ title, description, children }: { title: ReactNode; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <div className="text-sm font-medium text-ink">{title}</div>
        {description && <div className="mt-0.5 text-[13px] text-muted">{description}</div>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

export function Select<T extends string | number>({
  value,
  options,
  onChange,
  label
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={String(value)}
      onChange={(e) => {
        const match = options.find(o => String(o.value) === e.target.value);
        if (match) onChange(match.value);
      }}
      className="h-9 rounded-md border border-line bg-surface2 px-3 pr-8 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-focus/30"
    >
      {options.map(o => (
        <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
      ))}
    </select>
  );
}

/** Floating status message, used for success and error feedback. */
export function StatusToast({ kind, message }: { kind: 'success' | 'error'; message: string }) {
  if (!message) return null;
  const Icon = kind === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4" role="status" aria-live="polite">
      <div
        className={`pointer-events-auto flex max-w-md items-start gap-2.5 rounded-lg border bg-surface px-4 py-3 text-sm shadow-2xl animate-slideIn ${
          kind === 'success' ? 'border-success/30 text-ink' : 'border-danger/40 text-ink'
        }`}
      >
        <Icon size={18} className={`mt-px shrink-0 ${kind === 'success' ? 'text-success' : 'text-danger'}`} />
        <span>{message}</span>
      </div>
    </div>
  );
}

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
}

/** Small "more actions" dropdown. */
export function OverflowMenu({ items, label = 'More actions' }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="icon-btn"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1 min-w-[176px] rounded-lg border border-line bg-surface p-1 shadow-2xl animate-fadeIn">
          {items.map(item => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                item.danger ? 'text-danger hover:bg-danger/10' : 'text-ink hover:bg-ink/5'
              }`}
            >
              {item.icon && <span className={item.danger ? '' : 'text-muted'}>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const AVATAR_TONES = ['bg-accent/15 text-accent', 'bg-success/15 text-success', 'bg-warn/15 text-warn', 'bg-accent-2/15 text-accent-2', 'bg-danger/15 text-danger', 'bg-slate/20 text-ink'];

/** Letter avatar with a stable colour per name. */
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const label = name.trim().charAt(0).toUpperCase() || '?';
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${AVATAR_TONES[hash % AVATAR_TONES.length]}`}
    >
      {label}
    </span>
  );
}

/** Centered empty state used by every vault section. */
export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center animate-fadeIn">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent">{icon}</div>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
