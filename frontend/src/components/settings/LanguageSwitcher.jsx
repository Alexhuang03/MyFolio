import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

export default function LanguageSwitcher() {
  const { lang, switchLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const currentLang = LANGUAGES.find((l) => l.code === lang);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all border border-transparent hover:border-stone-200 dark:hover:border-stone-700"
        title={t('language')}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{currentLang?.flag}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-200 dark:border-stone-750 py-1.5 z-50 animate-scale-up">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 border-b border-stone-100 dark:border-stone-800 mb-1">
            {t('language')}
          </div>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                switchLanguage(l.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 flex items-center gap-2.5 text-sm transition-colors ${
                lang === l.code
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-semibold'
                  : 'text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span>{l.label}</span>
              {lang === l.code && <Check className="w-4 h-4 ml-auto text-amber-600 dark:text-amber-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
