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
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 animate-spin-once" />
      ) : (
        <Moon className="w-4 h-4 text-stone-600" />
      )}
      <span className="hidden md:inline font-sans text-xs font-medium">
        {isDark ? t('theme_light_short') : t('theme_dark_short')}
      </span>
    </button>
  );
}
