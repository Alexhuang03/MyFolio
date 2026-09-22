import React, { useEffect, useState } from 'react';
import { getCoverSrc } from '../../assets/covers';
import { useLanguage } from '../../i18n/LanguageContext';

export default function BookOpeningAnimation({ book, onAnimationComplete }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const coverSrc = getCoverSrc(book.coverImage);

  useEffect(() => {
    // Phase 1: book appears centered
    const timer1 = setTimeout(() => {
      setIsOpen(true);
    }, 100);

    // Phase 2: after cover swings open and pages reveal, complete
    const timer2 = setTimeout(() => {
      onAnimationComplete();
    }, 900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onAnimationComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 backdrop-blur-md perspective-1000 overflow-hidden">
      {/* 3D Book Object */}
      <div
        className="relative w-64 sm:w-80 h-[390px] sm:h-[480px] max-w-[85vw] transition-all duration-700 ease-out transform-style-3d shadow-2xl"
        style={{
          transform: isOpen ? 'scale(1.05)' : 'scale(0.85)',
        }}
      >
        {/* Right Inside Pages (visible when cover swings open) */}
        <div className="absolute inset-0 bg-stone-50 dark:bg-stone-900 rounded-r-lg border border-stone-200 dark:border-stone-800 shadow-inner flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-1 bg-amber-500/40 mb-6 rounded-full" />
          <h2 className="font-serif text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">
            {book.title}
          </h2>
          <p className="text-xs text-stone-400 dark:text-stone-400 font-serif italic mb-6">
            {t('loading_collections')}
          </p>
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>

        {/* Front Cover (swings open on the left spine) */}
        <div
          className="absolute inset-0 rounded-r-lg rounded-l-sm origin-left transition-transform duration-700 ease-in-out shadow-book transform-style-3d select-none overflow-hidden"
          style={{
            backgroundColor: book.colorTheme || '#3b82f6',
            transform: isOpen ? 'rotateY(-135deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Cover Art */}
          <img
            src={coverSrc}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover opacity-95"
          />

          {/* Left Spine texture */}
          <div className="absolute left-0 top-0 bottom-0 w-8 book-spine-left pointer-events-none" />

          {/* Bookmark ribbon accent (favori) */}
          {book.isFavorite && (
            <div
              className="absolute top-0 right-8 w-6 h-14 shadow-md pointer-events-none"
              style={{
                backgroundColor: book.colorTheme || '#e11d48',
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 75%, 0% 100%)',
              }}
            />
          )}

          {/* Title plate on cover */}
          <div className="absolute inset-x-8 top-20 bg-white/95 backdrop-blur-sm p-4 rounded-md shadow-lg text-center border border-amber-900/10">
            <h3 className="font-serif font-bold text-stone-900 text-xl leading-snug">
              {book.title}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}
