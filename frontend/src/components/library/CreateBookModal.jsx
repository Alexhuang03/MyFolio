import React, { useState } from 'react';
import { X, BookPlus, Check } from 'lucide-react';
import { COVERS } from '../../assets/covers';
import { useLanguage } from '../../i18n/LanguageContext';

const COLOR_PRESETS = [
  '#f97316', // Orange
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#0e7490', // Cyan
  '#475569', // Slate
];

export default function CreateBookModal({ isOpen, onClose, onSubmit, initialBook = null }) {
  const isEditing = Boolean(initialBook);
  const { t } = useLanguage();

  const [title, setTitle] = useState(initialBook ? initialBook.title : '');
  const [description, setDescription] = useState(initialBook ? initialBook.description || '' : '');
  const [coverImage, setCoverImage] = useState(
    initialBook ? initialBook.coverImage : COVERS[0].id
  );
  const [colorTheme, setColorTheme] = useState(
    initialBook ? initialBook.colorTheme : COVERS[0].defaultColor
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t('title_required'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        coverImage,
        colorTheme,
      });
      onClose();
    } catch (err) {
      setError(err.message || t('generic_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCover = (cover) => {
    setCoverImage(cover.id);
    if (!initialBook) {
      setColorTheme(cover.defaultColor);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 dark:border-stone-800 animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/70 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <BookPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-100">
                {isEditing ? t('edit_book_title') : t('create_new_book')}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {isEditing ? t('edit_book_desc') : t('create_book_desc')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-lg">
              {error}
            </div>
          )}

          {/* Titre */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              {t('book_title_label')}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('book_title_placeholder')}
              className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm placeholder:text-stone-400 dark:placeholder:text-stone-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              {t('description_label')}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('description_placeholder')}
              className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm resize-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
            />
          </div>

          {/* Choix du design de couverture */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              {t('cover_design_label')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {COVERS.map((cover) => {
                const isSelected = coverImage === cover.id;
                return (
                  <button
                    key={cover.id}
                    type="button"
                    onClick={() => handleSelectCover(cover)}
                    className={`group relative flex flex-col items-center p-2 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/40 ring-2 ring-amber-500/20'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 bg-stone-50 dark:bg-stone-800/60'
                    }`}
                  >
                    <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden shadow-sm bg-stone-200 dark:bg-stone-700 mb-2">
                      <img
                        src={cover.src}
                        alt={cover.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-stone-700 dark:text-stone-300 truncate w-full text-center">
                      {cover.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Couleur d'accentuation */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              {t('color_theme_label')}
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setColorTheme(color)}
                  className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center shadow-sm ${
                    colorTheme === color ? 'scale-110 ring-2 ring-offset-2 ring-amber-500' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {colorTheme === color && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
              <div className="relative flex items-center">
                <input
                  type="color"
                  value={colorTheme}
                  onChange={(e) => setColorTheme(e.target.value)}
                  className="w-7 h-7 rounded-full border-0 p-0 cursor-pointer overflow-hidden"
                  title={t('custom_color')}
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? t('saving') : isEditing ? t('update') : t('create_book')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
