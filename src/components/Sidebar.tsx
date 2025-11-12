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
      color: 'cyan'
    },
    {
      id: 'totp' as const,
      icon: Shield,
      label: '2FA Codes',
      count: totpCount,
      color: 'blue'
    },
    {
      id: 'notes' as const,
      icon: FileText,
      label: 'Notes',
      count: noteCount,
      color: 'emerald'
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
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">EnigmaKeep</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Your Vault</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
              const colorClasses = {
                cyan: isActive
                  ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50',
                blue: isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50',
                emerald: isActive
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              };

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleViewChange(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${colorClasses[item.color]}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold bg-white dark:bg-gray-800 px-2 py-1 rounded-md">
                      {item.count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Settings at bottom of nav */}
          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handleViewChange('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                currentView === 'settings'
                  ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
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
