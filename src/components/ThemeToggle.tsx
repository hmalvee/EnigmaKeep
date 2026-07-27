import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme, effectiveTheme } = useTheme();

  const modes: Array<{ id: 'light' | 'system' | 'dark'; icon: typeof Sun; label: string }> = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'system', icon: Monitor, label: 'System' },
    { id: 'dark', icon: Moon, label: 'Dark' }
  ];

  return (
    <div
      className="flex items-center gap-0.5 bg-surface2 p-1 rounded-xl border border-line"
      role="group"
      aria-label="Theme"
      title={`Theme: ${theme} (${effectiveTheme})`}
    >
      {modes.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => setTheme(id)}
          className={`p-2 rounded-lg transition-all duration-200 ${
            theme === id
              ? 'bg-surface text-accent shadow-sm border border-line'
              : 'text-muted hover:text-ink border border-transparent'
          }`}
          title={label}
          aria-label={label}
          aria-pressed={theme === id}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
