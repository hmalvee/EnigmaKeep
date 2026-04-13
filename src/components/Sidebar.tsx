import { Lock, FileText, Settings, Shield, X } from 'lucide-react';

interface SidebarProps {
  currentView: 'passwords' | 'notes' | 'totp' | 'settings';
  onViewChange: (view: 'passwords' | 'notes' | 'totp' | 'settings') => void;
  passwordCount: number;
  noteCount: number;
  totpCount: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ currentView, onViewChange, passwordCount, noteCount, totpCount, isOpen = true, onClose }: SidebarProps) {
  const menuItems = [
    {
      id: 'passwords' as const,
      icon: Lock,
      label: 'Passwords',
      count: passwordCount,
      activeColor: 'from-neon-cyan to-neon-blue',
      activeBg: 'bg-neon-cyan/10',
      activeText: 'text-neon-cyan',
      activeBorder: 'border-neon-cyan/30',
      glowColor: 'shadow-[0_0_15px_rgba(0,240,255,0.15)]'
    },
    {
      id: 'totp' as const,
      icon: Shield,
      label: '2FA Codes',
      count: totpCount,
      activeColor: 'from-neon-blue to-neon-purple',
      activeBg: 'bg-neon-blue/10',
      activeText: 'text-neon-blue',
      activeBorder: 'border-neon-blue/30',
      glowColor: 'shadow-[0_0_15px_rgba(77,124,255,0.15)]'
    },
    {
      id: 'notes' as const,
      icon: FileText,
      label: 'Notes',
      count: noteCount,
      activeColor: 'from-neon-green to-emerald-500',
      activeBg: 'bg-neon-green/10',
      activeText: 'text-neon-green',
      activeBorder: 'border-neon-green/30',
      glowColor: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]'
    }
  ];

  const handleViewChange = (view: 'passwords' | 'notes' | 'totp' | 'settings') => {
    onViewChange(view);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-vault-surface/95 backdrop-blur-xl border-r border-vault-border
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo/Header */}
        <div className="p-6 border-b border-vault-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-neon-cyan to-neon-blue rounded-xl flex items-center justify-center shadow-neon-cyan">
                <span className="text-white font-black text-lg">E</span>
              </div>
              <div>
                <h2 className="font-bold text-white tracking-tight">EnigmaKeep</h2>
                <p className="text-xs text-neon-cyan/60 font-mono">VAULT ACTIVE</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleViewChange(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? `${item.activeBg} ${item.activeText} border ${item.activeBorder} ${item.glowColor}`
                        : 'text-gray-400 hover:text-white hover:bg-vault-hover border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      isActive
                        ? `bg-gradient-to-r ${item.activeColor} text-white`
                        : 'bg-vault-card text-gray-500'
                    }`}>
                      {item.count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Settings at bottom of nav */}
          <div className="mt-auto pt-4 border-t border-vault-border">
            <button
              onClick={() => handleViewChange('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                currentView === 'settings'
                  ? 'bg-neon-purple/10 text-neon-purple border border-neon-purple/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                  : 'text-gray-400 hover:text-white hover:bg-vault-hover border border-transparent'
              }`}
            >
              <Settings size={20} />
              <span className="font-medium">Settings</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
