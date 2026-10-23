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
      className="flex items-center gap-0.5 p-0.5 rounded-md border border-line"
      role="group"
      aria-label="Theme"
      title={`Theme: ${theme} (${effectiveTheme})`}
    >
      {modes.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => setTheme(id)}
          className={`p-1.5 rounded ${
            theme === id
              ? 'bg-ink/10 text-ink'
              : 'text-muted hover:text-ink'
          }`}
          title={label}
          aria-label={label}
          aria-pressed={theme === id}
        >
          <Icon size={15} strokeWidth={1.8} />
        </button>
      ))}
    </div>
  );
}
