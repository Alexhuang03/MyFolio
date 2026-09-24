import React, { useState, useEffect } from 'react';
import {
  X,
  BookPlus,
  Check,
  Bookmark,
  Plus,
  Image as ImageIcon,
  DollarSign,
  MapPin,
  Calendar,
  Star,
  Link as LinkIcon,
  FileText,
} from 'lucide-react';
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

const DEFAULT_FIELDS_CONFIG = {
  hasImage: true,
  hasPrice: true,
  hasLocation: false,
  hasDate: false,
  hasRating: false,
  hasUrl: false,
  hasDescription: true,
  customFields: [],
};

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
  const [isFavorite, setIsFavorite] = useState(
    initialBook ? Boolean(initialBook.isFavorite) : false
  );
  const [fieldsConfig, setFieldsConfig] = useState(
    initialBook?.fieldsConfig
      ? { ...DEFAULT_FIELDS_CONFIG, ...initialBook.fieldsConfig }
      : DEFAULT_FIELDS_CONFIG
  );
  const [newCustomFieldName, setNewCustomFieldName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialBook) {
        setTitle(initialBook.title || '');
        setDescription(initialBook.description || '');
        setCoverImage(initialBook.coverImage || COVERS[0].id);
        setColorTheme(initialBook.colorTheme || COVERS[0].defaultColor);
        setIsFavorite(Boolean(initialBook.isFavorite));
        setFieldsConfig({
          ...DEFAULT_FIELDS_CONFIG,
          ...(initialBook.fieldsConfig || {}),
          customFields: initialBook.fieldsConfig?.customFields || [],
        });
      } else {
        setTitle('');
        setDescription('');
        setCoverImage(COVERS[0].id);
        setColorTheme(COVERS[0].defaultColor);
        setIsFavorite(false);
        setFieldsConfig(DEFAULT_FIELDS_CONFIG);
      }
      setNewCustomFieldName('');
      setError('');
    }
  }, [isOpen, initialBook]);

  if (!isOpen) return null;

  const toggleField = (key) => {
    setFieldsConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAddCustomField = (e) => {
    if (e) e.preventDefault();
    const trimmed = newCustomFieldName.trim();
    if (!trimmed) return;
    if (fieldsConfig.customFields?.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }
    setFieldsConfig((prev) => ({
      ...prev,
      customFields: [...(prev.customFields || []), { name: trimmed, type: 'text' }],
    }));
    setNewCustomFieldName('');
  };

  const handleRemoveCustomField = (fieldName) => {
    setFieldsConfig((prev) => ({
      ...prev,
      customFields: (prev.customFields || []).filter((f) => f.name !== fieldName),
    }));
  };

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
        isFavorite,
        fieldsConfig,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 dark:border-stone-800 animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50">
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
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

          {/* Option Favori */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                isFavorite
                  ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 ring-1 ring-amber-500/20'
                  : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 bg-stone-50 dark:bg-stone-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    isFavorite
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-stone-800 dark:text-stone-100 block">
                    {t('favorite_book_label')}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                    {t('favorite_book_desc')}
                  </span>
                </div>
              </div>

              {/* Toggle switch */}
              <div
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                  isFavorite ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                    isFavorite ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Couleur d'accentuation (affichée uniquement quand le marque-page favori est activé) */}
          {isFavorite && (
            <div className="pt-1 animate-fade-in">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                {t('color_theme_label')}
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map((color) => {
                  const isSelected = colorTheme?.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setColorTheme(color)}
                      className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center shadow-sm ${
                        isSelected
                          ? 'scale-110 ring-2 ring-offset-2 ring-amber-500 dark:ring-amber-400'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  );
                })}
                <label
                  className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center shadow-sm relative cursor-pointer overflow-hidden ${
                    !COLOR_PRESETS.some((c) => c.toLowerCase() === colorTheme?.toLowerCase())
                      ? 'scale-110 ring-2 ring-offset-2 ring-amber-500 dark:ring-amber-400'
                      : 'hover:scale-105 border border-stone-300 dark:border-stone-600'
                  }`}
                  style={{
                    backgroundColor: !COLOR_PRESETS.some((c) => c.toLowerCase() === colorTheme?.toLowerCase())
                      ? colorTheme
                      : undefined,
                    backgroundImage: COLOR_PRESETS.some((c) => c.toLowerCase() === colorTheme?.toLowerCase())
                      ? 'conic-gradient(from 180deg, #f43f5e, #8b5cf6, #3b82f6, #10b981, #f59e0b, #f43f5e)'
                      : undefined,
                  }}
                  title={t('custom_color')}
                >
                  <input
                    type="color"
                    value={colorTheme}
                    onChange={(e) => setColorTheme(e.target.value)}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                  {!COLOR_PRESETS.some((c) => c.toLowerCase() === colorTheme?.toLowerCase()) ? (
                    <Check className="w-3.5 h-3.5 text-white stroke-[3] drop-shadow-sm pointer-events-none" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-white shadow-sm pointer-events-none" />
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Configuration des champs des éléments */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80">
            <div className="mb-2.5">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                {t('book_fields_section_title')}
              </label>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                {t('book_fields_section_desc')}
              </p>
            </div>

            {/* Grille des champs prédéfinis */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { key: 'hasImage', label: t('field_image'), icon: ImageIcon },
                { key: 'hasPrice', label: t('field_price'), icon: DollarSign },
                { key: 'hasLocation', label: t('field_location'), icon: MapPin },
                { key: 'hasDate', label: t('field_date'), icon: Calendar },
                { key: 'hasRating', label: t('field_rating'), icon: Star },
                { key: 'hasUrl', label: t('field_url'), icon: LinkIcon },
                { key: 'hasDescription', label: t('field_description'), icon: FileText },
              ].map((f) => {
                const isChecked = Boolean(fieldsConfig[f.key]);
                const IconComponent = f.icon;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => toggleField(f.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all text-left ${
                      isChecked
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500/20 shadow-2xs'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 bg-stone-50 dark:bg-stone-800/40 text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    <IconComponent
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        isChecked ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400'
                      }`}
                    />
                    <span className="truncate flex-1">{f.label}</span>
                    <div
                      className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center border flex-shrink-0 transition-colors ${
                        isChecked
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'border-stone-300 dark:border-stone-600'
                      }`}
                    >
                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Champs personnalisés */}
            <div className="mt-3.5 pt-3 border-t border-dashed border-stone-200 dark:border-stone-800">
              <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-2">
                {t('custom_fields_title')}
              </label>

              {fieldsConfig.customFields?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {fieldsConfig.customFields.map((cf) => (
                    <span
                      key={cf.name}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100/70 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800"
                    >
                      <span>{cf.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(cf.name)}
                        className="p-0.5 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        title="Supprimer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCustomFieldName}
                  onChange={(e) => setNewCustomFieldName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomField();
                    }
                  }}
                  placeholder={t('custom_field_placeholder')}
                  className="flex-1 px-3 py-1.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs placeholder:text-stone-400 dark:placeholder:text-stone-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomField}
                  disabled={!newCustomFieldName.trim()}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600 text-white rounded-xl text-xs font-semibold disabled:opacity-40 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('add_custom_field_btn')}</span>
                </button>
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
