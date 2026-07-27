import { KeyRound, FileText, ShieldCheck, FolderLock, Settings, X } from 'lucide-react';

type View = 'passwords' | 'notes' | 'totp' | 'files' | 'settings';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  passwordCount: number;
  noteCount: number;
  totpCount: number;
  fileCount: number;
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
          className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] z-40 md:hidden animate-fadeIn"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-surface/95 backdrop-blur-xl border-r border-line flex flex-col
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-5 border-b border-line">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-[0_8px_20px_-10px_rgb(var(--accent)/0.7)] animate-soft-glow">
                <KeyRound className="text-accent-ink" size={20} />
              </div>
              <div>
                <h2 className="font-display font-semibold text-ink leading-none">EnigmaKeep</h2>
                <p className="text-[11px] text-muted mt-1 tracking-wide">Vault unlocked</p>
              </div>
            </div>
            {onClose && (
              <button onClick={onClose} className="md:hidden text-muted hover:text-ink">
                <X size={22} />
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto flex flex-col">
          <ul className="space-y-1">
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
                      <Icon size={18} className={isActive ? 'scale-105' : ''} />
                      <span className="font-medium text-sm">{item.label}</span>
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-md tabular-nums ${
                        isActive ? 'bg-accent/15 text-accent' : 'bg-surface2 text-muted'
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto pt-3 border-t border-line">
            <button
              onClick={() => handleViewChange('settings')}
              className={`nav-item ${currentView === 'settings' ? 'nav-item-active' : ''}`}
            >
              <span className="flex items-center gap-3">
                <Settings size={18} />
                <span className="font-medium text-sm">Settings</span>
              </span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
