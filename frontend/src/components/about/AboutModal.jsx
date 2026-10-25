import React, { useEffect, useRef, useState } from 'react';
import { X, Library, BookOpen, Tags, Volume2, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const SLIDES = [
  { key: 's1', icon: Library },
  { key: 's2', icon: BookOpen },
  { key: 's3', icon: Tags },
  { key: 's4', icon: Volume2 },
  { key: 's5', icon: Users },
];

const SWIPE_THRESHOLD = 50; // Distance minimale (px) pour changer de diapositive au doigt

/**
 * Mini présentation de MyFolio, ouverte au clic sur le logo.
 * Navigation : flèches, points, flèches du clavier ou glissement au doigt.
 * Rendue seulement quand elle est ouverte : chaque ouverture repart de la première diapositive.
 */
export default function AboutModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const swipeStart = useRef(null);

  const isLast = index === SLIDES.length - 1;
  const goTo = (i) => setIndex(Math.max(0, Math.min(SLIDES.length - 1, i)));

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') setIndex((i) => Math.min(SLIDES.length - 1, i + 1));
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePointerDown = (e) => {
    swipeStart.current = e.clientX;
  };
  const handlePointerUp = (e) => {
    if (swipeStart.current === null) return;
    const dx = e.clientX - swipeStart.current;
    swipeStart.current = null;
    if (dx <= -SWIPE_THRESHOLD) goTo(index + 1);
    else if (dx >= SWIPE_THRESHOLD) goTo(index - 1);
  };

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('about_title')}
        className="relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          title={t('about_close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Diapositives : une bande horizontale décalée selon l'index */}
        <div
          className="overflow-hidden touch-pan-y select-none"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => (swipeStart.current = null)}
        >
          <div
            className="flex transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {SLIDES.map(({ key, icon: Icon }, i) => (
              <section
                key={key}
                className="w-full shrink-0 px-7 sm:px-9 pt-10 pb-6 text-center"
                aria-hidden={i !== index}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-linear-to-tr from-amber-600 to-amber-400 text-white shadow-xl shadow-amber-600/30 mb-5">
                  <Icon className="w-8 h-8" />
                </div>
                <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 dark:text-white mb-3">
                  {t(`about_${key}_title`)}
                </h2>
                <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                  {t(`about_${key}_text`)}
                </p>
              </section>
            ))}
          </div>
        </div>

        {/* Navigation */}
        {/* Grille à 3 colonnes : les points restent centrés quel que soit le bouton de droite */}
        <div className="px-6 pb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            className="justify-self-start p-2 rounded-xl text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-0 disabled:pointer-events-none transition"
            title={t('about_prev')}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5">
            {SLIDES.map(({ key }, i) => (
              <button
                key={key}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`${i + 1} / ${SLIDES.length}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? 'w-6 bg-amber-500' : 'w-2 bg-stone-300 dark:bg-stone-700 hover:bg-stone-400'
                }`}
              />
            ))}
          </div>

          {isLast ? (
            <button
              type="button"
              onClick={onClose}
              className="justify-self-end px-3.5 py-2 rounded-xl text-sm font-semibold text-white bg-linear-to-r from-amber-600 to-amber-500 shadow-md shadow-amber-600/20 hover:brightness-110 transition"
            >
              {t('about_start')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="justify-self-end p-2 rounded-xl text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              title={t('about_next')}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
