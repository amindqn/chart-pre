import type { ThemeMode } from '../../hooks/useThemePreference';

interface ThemeToggleProps {
  theme: ThemeMode;
  onToggle: () => void;
}

export const ThemeToggle = ({ theme, onToggle }: ThemeToggleProps) => {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        'inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors duration-200',
        'hover:border-blue-400 hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
        isDark
          ? 'theme-toggle-dark'
          : 'theme-toggle-light',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Toggle colour theme"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span
        aria-hidden="true"
        className="inline-flex h-4 w-4 items-center justify-center"
      >
        {isDark ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            <path
              d="M21 14.5A8.5 8.5 0 0 1 9.5 3a8.5 8.5 0 1 0 11.5 11.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            <circle
              cx="12"
              cy="12"
              r="5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M12 1.5v2m0 17v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1.5 12h2m17 0h2M4.22 19.78l1.42-1.42m12.72-12.72 1.42-1.42"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </span>
      <span>{isDark ? 'Dark' : 'Light'} mode</span>
    </button>
  );
};
