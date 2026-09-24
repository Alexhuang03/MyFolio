import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 border border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100 hover:border-stone-200 dark:text-stone-300 dark:hover:text-amber-300 dark:hover:bg-stone-800 dark:hover:border-stone-700"
      title={isDark ? t('theme_light') : t('theme_dark')}
      aria-label={isDark ? t('theme_light') : t('theme_dark')}
    >
      <span className="relative w-4 h-4 flex items-center justify-center">
        <Sun
          className={`w-4 h-4 text-amber-400 absolute transition-all duration-700 ease-in-out ${
            isDark
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-0 pointer-events-none'
          }`}
        />
        <Moon
          className={`w-4 h-4 text-stone-600 dark:text-stone-400 absolute transition-all duration-700 ease-in-out ${
            isDark
              ? 'opacity-0 rotate-90 scale-0 pointer-events-none'
              : 'opacity-100 rotate-0 scale-100'
          }`}
        />
      </span>
      <span className="hidden md:inline font-sans text-xs font-medium">
        {isDark ? t('theme_light_short') : t('theme_dark_short')}
      </span>
    </button>
  );
}
