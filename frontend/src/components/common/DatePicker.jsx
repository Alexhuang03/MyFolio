import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { LOCALES, parseIsoDate, toIsoDate } from '../../utils/dates';

/**
 * Champ de date libre + petit calendrier.
 * Le champ accepte toujours du texte (« Printemps 2023 ») ; le calendrier y écrit une date AAAA-MM-JJ,
 * affichée ensuite au format de la langue (voir formatDisplayDate).
 */
export default function DatePicker({ value, onChange, placeholder, inputClassName }) {
  const { t, lang } = useLanguage();
  const locale = LOCALES[lang] || lang;
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(parseIsoDate(value) || new Date()));
  const wrapperRef = useRef(null);
  const popoverRef = useRef(null);

  const selected = parseIsoDate(value);
  const today = new Date();

  // Fermeture au clic à l'extérieur ou avec Échap
  useEffect(() => {
    if (!isOpen) return undefined;
    const onPointerDown = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setIsOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey, true);
    // Le calendrier peut dépasser le bas de la fenêtre : le faire défiler en vue
    popoverRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [isOpen]);

  const toggle = () => {
    if (!isOpen) setViewMonth(startOfMonth(selected || new Date()));
    setIsOpen((open) => !open);
  };

  const pick = (day) => {
    onChange(toIsoDate(day));
    setIsOpen(false);
  };

  const shiftMonth = (months) =>
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + months, 1));

  // Premier jour de la semaine : dimanche en anglais (US), lundi sinon
  const weekStart = lang === 'en' ? 0 : 1;
  const weekdayNames = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(new Date(2024, 0, 7 + ((weekStart + i) % 7)))
  );
  const offset = (viewMonth.getDay() - weekStart + 7) % 7;
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const cells = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1)),
  ];
  const monthTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(viewMonth);

  const navButton =
    'p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors';

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClassName} pr-10`}
      />
      <button
        type="button"
        onClick={toggle}
        title={t('date_pick')}
        aria-label={t('date_pick')}
        aria-expanded={isOpen}
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
          isOpen
            ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50'
            : 'text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-700'
        }`}
      >
        <CalendarDays className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full mt-1.5 z-30 w-72 max-w-[calc(100vw-3rem)] p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-xl animate-scale-up"
        >
          {/* Mois affiché : années (double flèche) et mois (simple flèche) */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex">
              <button type="button" onClick={() => shiftMonth(-12)} className={navButton} title={t('date_prev_year')}>
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => shiftMonth(-1)} className={navButton} title={t('date_prev_month')}>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <span className="text-sm font-semibold text-stone-800 dark:text-stone-100 first-letter:uppercase">
              {monthTitle}
            </span>
            <div className="flex">
              <button type="button" onClick={() => shiftMonth(1)} className={navButton} title={t('date_next_month')}>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => shiftMonth(12)} className={navButton} title={t('date_next_year')}>
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {weekdayNames.map((name, i) => (
              <span key={i} className="py-1 text-[10px] font-semibold uppercase text-stone-400 dark:text-stone-500">
                {name}
              </span>
            ))}
            {cells.map((day, i) => {
              if (!day) return <span key={`empty-${i}`} />;
              const isSelected = selected && sameDay(day, selected);
              const isToday = sameDay(day, today);
              return (
                <button
                  key={day.getDate()}
                  type="button"
                  onClick={() => pick(day)}
                  className={`h-9 rounded-lg text-sm transition-colors ${
                    isSelected
                      ? 'bg-amber-500 text-white font-semibold shadow-sm'
                      : isToday
                        ? 'text-amber-700 dark:text-amber-300 font-semibold ring-1 ring-inset ring-amber-400/70 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                        : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => pick(new Date())}
              className="px-2 py-1 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
            >
              {t('date_today')}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="px-2 py-1 rounded-lg text-xs font-medium text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                {t('date_clear')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
