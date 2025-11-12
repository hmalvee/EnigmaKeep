import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-300 dark:border-gray-700">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded transition-all duration-200 ${
          theme === 'light'
            ? 'bg-white dark:bg-gray-700 text-amber-500 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`}
        title="Light mode"
      >
        <Sun size={18} />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded transition-all duration-200 ${
          theme === 'system'
            ? 'bg-white dark:bg-gray-700 text-cyan-500 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`}
        title="System theme"
      >
        <Monitor size={18} />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded transition-all duration-200 ${
          theme === 'dark'
            ? 'bg-white dark:bg-gray-700 text-blue-500 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`}
        title="Dark mode"
      >
        <Moon size={18} />
      </button>
    </div>
  );
}
