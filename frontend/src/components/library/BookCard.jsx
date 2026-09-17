import React, { useState } from 'react';
import { BookOpen, MoreVertical, Trash2, Edit3, Layers } from 'lucide-react';
import { getCoverSrc } from '../../assets/covers';
import { useLanguage } from '../../i18n/LanguageContext';

export default function BookCard({ book, onOpen, onDelete, onEdit }) {
  const [showMenu, setShowMenu] = useState(false);
  const coverSrc = getCoverSrc(book.coverImage);
  const { t, lang } = useLanguage();
  const localeMap = { fr: 'fr-FR', en: 'en-US', zh: 'zh-CN' };

  return (
    <div className="group relative flex flex-col items-center">
      {/* 3D Book Container */}
      <div
        onClick={() => onOpen(book)}
        className="relative w-56 h-80 cursor-pointer rounded-r-lg rounded-l-sm transition-all duration-300 transform group-hover:-translate-y-2 group-hover:rotate-1 shadow-book group-hover:shadow-book-hover select-none overflow-hidden"
        style={{
          backgroundColor: book.colorTheme || '#3b82f6',
        }}
      >
        {/* Cover SVG graphic */}
        <img
          src={coverSrc}
          alt={book.title}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90 transition-transform duration-300 group-hover:scale-105"
        />

        {/* Book spine left 3D gradient overlay */}
        <div className="absolute left-0 top-0 bottom-0 w-6 book-spine-left pointer-events-none" />

        {/* Bookmark ribbon accent */}
        <div
          className="absolute top-0 right-6 w-5 h-12 shadow-sm pointer-events-none"
          style={{
            backgroundColor: book.colorTheme || '#e11d48',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 75%, 0% 100%)',
          }}
        />

        {/* Spine stitches */}
        <div className="absolute left-5 top-0 bottom-0 w-px border-r border-amber-100/30 pointer-events-none" />

        {/* Title plate on cover */}
        <div className="absolute inset-x-5 top-16 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm p-3.5 rounded shadow-md text-center border border-amber-900/10 dark:border-amber-400/20">
          <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-lg leading-tight line-clamp-2">
            {book.title}
          </h3>
          {book.description && (
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 font-sans line-clamp-2">
              {book.description}
            </p>
          )}
        </div>

        {/* Bottom hover prompt */}
        <div className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-1.5 text-xs font-medium text-white/90 drop-shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <BookOpen className="w-4 h-4" />
          <span>{t('open_book')}</span>
        </div>
      </div>

      {/* Book title and action bar below */}
      <div className="mt-3.5 w-56 flex items-center justify-between px-1">
        <div className="truncate pr-2">
          <p className="font-medium text-stone-800 dark:text-stone-100 text-sm truncate">{book.title}</p>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            {new Date(book.createdAt || Date.now()).toLocaleDateString(localeMap[lang] || 'fr-FR', {
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition-colors"
            title={t('book_options')}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 bottom-full mb-1 w-44 bg-white dark:bg-stone-900 rounded-lg shadow-xl border border-stone-200 dark:border-stone-700 py-1 z-30 text-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit && onEdit(book);
                  }}
                  className="w-full text-left px-3.5 py-2 flex items-center gap-2 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                  <span>{t('edit')}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete(book);
                  }}
                  className="w-full text-left px-3.5 py-2 flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('delete')}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
