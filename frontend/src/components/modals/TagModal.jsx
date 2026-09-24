import React, { useState, useEffect } from 'react';
import { X, Tag, Check } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const TAG_COLORS = [
  '#3b82f6', // Bleu
  '#ef4444', // Rouge
  '#10b981', // Vert
  '#f59e0b', // Jaune ambré
  '#8b5cf6', // Violet
  '#ec4899', // Rose
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#64748b', // Ardoise
];

export default function TagModal({
  isOpen,
  onClose,
  onSubmit,
  tagType = 'label', // 'label' ou 'sublabel'
  initialTag = null,
  existingTags = [],
}) {
  const isEditing = Boolean(initialTag);
  const isLabel = tagType === 'label';
  const { t } = useLanguage();

  const [name, setName] = useState(initialTag ? initialTag.name : '');
  const [color, setColor] = useState(
    initialTag ? initialTag.color || '#3b82f6' : isLabel ? '#3b82f6' : '#10b981'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialTag) {
        setName(initialTag.name || '');
        setColor(initialTag.color || (isLabel ? '#3b82f6' : '#10b981'));
      } else {
        setName('');
        setColor(isLabel ? '#3b82f6' : '#10b981');
      }
      setError('');
    }
  }, [isOpen, initialTag, isLabel]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('name_required'));
      return;
    }

    // Vérification d'unicité côté client
    const isDuplicate = existingTags.some(
      (tItem) =>
        (!initialTag || tItem._id !== initialTag._id) &&
        tItem.name &&
        tItem.name.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setError(t(isLabel ? 'label_duplicate' : 'sublabel_duplicate', { name: trimmed }));
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit({
        name: trimmed,
        color,
      });
      onClose();
    } catch (err) {
      setError(err.message || t('generic_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 dark:border-stone-800 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: color }}
            >
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-stone-800 dark:text-stone-100">
                {t(isEditing ? (isLabel ? 'edit_label' : 'edit_sublabel') : (isLabel ? 'new_label' : 'new_sublabel'))}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {isLabel ? t('label_examples') : t('sublabel_examples')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-lg">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              {isLabel ? t('tag_name_label') : t('tag_name_sublabel')}
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isLabel ? t('tag_name_placeholder_label') : t('tag_name_placeholder_sublabel')}
              className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm placeholder:text-stone-400 dark:placeholder:text-stone-500"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              {t('tag_color')}
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {TAG_COLORS.map((c) => {
                const isSelected = color?.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center shadow-sm ${
                      isSelected
                        ? 'scale-110 ring-2 ring-offset-2 ring-amber-500 dark:ring-amber-400'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                );
              })}
              <label
                className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center shadow-sm relative cursor-pointer overflow-hidden ${
                  !TAG_COLORS.some((c) => c.toLowerCase() === color?.toLowerCase())
                    ? 'scale-110 ring-2 ring-offset-2 ring-amber-500 dark:ring-amber-400'
                    : 'hover:scale-105 border border-stone-300 dark:border-stone-600'
                }`}
                style={{
                  backgroundColor: !TAG_COLORS.some((c) => c.toLowerCase() === color?.toLowerCase())
                    ? color
                    : undefined,
                  backgroundImage: TAG_COLORS.some((c) => c.toLowerCase() === color?.toLowerCase())
                    ? 'conic-gradient(from 180deg, #f43f5e, #8b5cf6, #3b82f6, #10b981, #f59e0b, #f43f5e)'
                    : undefined,
                }}
                title={t('custom_color_tag')}
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
                {!TAG_COLORS.some((c) => c.toLowerCase() === color?.toLowerCase()) ? (
                  <Check className="w-3.5 h-3.5 text-white stroke-[3] drop-shadow-sm pointer-events-none" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-white shadow-sm pointer-events-none" />
                )}
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 dark:bg-amber-600 dark:hover:bg-amber-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? t('saving') : isEditing ? t('update') : t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
