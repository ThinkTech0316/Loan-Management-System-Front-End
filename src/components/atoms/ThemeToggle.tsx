import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from './Button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative h-10 w-10 rounded-full backdrop-blur-sm border shadow-sm hover:shadow-md transition-all duration-300"
      style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderColor: 'var(--color-divider)',
        color: 'var(--color-subtle)',
      }}
      title="Toggle theme"
    >
      <div className="relative flex items-center justify-center w-full h-full">
        {isDark ? (
          <Sun className="h-5 w-5 animate-scale-in text-amber-500" />
        ) : (
          <Moon className="h-5 w-5 animate-scale-in text-indigo-500" />
        )}
      </div>
    </Button>
  );
}
