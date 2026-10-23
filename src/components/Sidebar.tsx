import { KeyRound, FileText, ShieldCheck, FolderLock, Settings, X, Lock } from 'lucide-react';
import { Wordmark } from './Wordmark';
import { ThemeToggle } from './ThemeToggle';

type View = 'passwords' | 'notes' | 'totp' | 'files' | 'settings';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  passwordCount: number;
  noteCount: number;
  totpCount: number;
  fileCount: number;
  /** Vault file name shown in the footer. */
  vaultName?: string;
  onLock?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  currentView,
  onViewChange,
  passwordCount,
  noteCount,
  totpCount,
  fileCount,
  vaultName,
  onLock,
  isOpen = true,
  onClose
}: SidebarProps) {
  const menuItems = [
    { id: 'passwords' as const, icon: KeyRound, label: 'Passwords', count: passwordCount },
    { id: 'totp' as const, icon: ShieldCheck, label: '2FA Codes', count: totpCount },
    { id: 'notes' as const, icon: FileText, label: 'Notes', count: noteCount },
    { id: 'files' as const, icon: FolderLock, label: 'Files', count: fileCount }
  ];

  const handleViewChange = (view: View) => {
    onViewChange(view);
    onClose?.();
  };

  return (
    <>
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40 md:hidden animate-fadeIn"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-bg/95 md:bg-bg/40 backdrop-blur-xl border-r border-line flex flex-col
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between h-6">
            <Wordmark className="h-[14px] w-auto text-ink" />
            {onClose && (
              <button onClick={onClose} className="md:hidden text-muted hover:text-ink" aria-label="Close menu">
                <X size={22} />
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 pb-3 overflow-y-auto flex flex-col">
          <p className="px-3 pt-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted/70">Vault</p>
          <ul className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleViewChange(item.id)}
                    className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={18} strokeWidth={1.7} />
                      <span className="text-[15px]">{item.label}</span>
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded tabular-nums ${
                        isActive ? 'text-accent' : 'text-muted/80'
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto space-y-3 pt-3">
            <div className="flex items-center justify-between px-3 sm:hidden">
              <span className="text-[13px] text-muted">Theme</span>
              <ThemeToggle />
            </div>
            <button
              onClick={() => handleViewChange('settings')}
              className={`nav-item ${currentView === 'settings' ? 'nav-item-active' : ''}`}
            >
              <span className="flex items-center gap-3">
                <Settings size={18} strokeWidth={1.7} />
                <span className="text-[15px]">Settings</span>
              </span>
            </button>

            <div className="flex items-center gap-3 rounded-lg border border-line bg-surface/60 px-3 py-2.5">
              <span className="w-2 h-2 shrink-0 rounded-full bg-success shadow-[0_0_8px_rgb(var(--success)/0.7)]" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-ink leading-tight">Unlocked</p>
                <p className="truncate text-[11px] text-muted leading-tight" title={vaultName}>{vaultName || 'Vault file not linked'}</p>
              </div>
              {onLock && (
                <button onClick={onLock} className="icon-btn" title="Lock vault" aria-label="Lock vault">
                  <Lock size={15} />
                </button>
              )}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
