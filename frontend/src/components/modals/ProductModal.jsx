import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Upload,
  Image as ImageIcon,
  Check,
  DollarSign,
  MapPin,
  Calendar,
  Star,
  Link as LinkIcon,
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  labels = [],
  subLabels = [],
  initialProduct = null,
  defaultLabelId = null,
  defaultSubLabelId = null,
  fieldsConfig,
}) {
  const isEditing = Boolean(initialProduct);
  const { t } = useLanguage();

  const config = {
    hasImage: true,
    hasPrice: true,
    hasLocation: false,
    hasDate: false,
    hasRating: false,
    hasUrl: false,
    hasDescription: true,
    customFields: [],
    ...(fieldsConfig || {}),
  };

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [rating, setRating] = useState(null);
  const [url, setUrl] = useState('');
  const [customValues, setCustomValues] = useState({});
  const [selectedLabelIds, setSelectedLabelIds] = useState([]);
  const [selectedSubLabelIds, setSelectedSubLabelIds] = useState([]);

  const [imageType, setImageType] = useState('url'); // 'url' ou 'file'
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name || '');
      setDescription(initialProduct.description || '');
      setPrice(initialProduct.price !== null && initialProduct.price !== undefined ? initialProduct.price : '');
      setImage(initialProduct.image || '');
      setLocation(initialProduct.location || '');
      setDate(initialProduct.date || '');
      setRating(initialProduct.rating !== null && initialProduct.rating !== undefined ? initialProduct.rating : null);
      setUrl(initialProduct.url || '');
      setCustomValues(initialProduct.customValues || {});
      setSelectedLabelIds(initialProduct.labelIds || []);
      setSelectedSubLabelIds(initialProduct.subLabelIds || []);
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setImage('');
      setLocation('');
      setDate('');
      setRating(null);
      setUrl('');
      setCustomValues({});
      setSelectedLabelIds(defaultLabelId ? [defaultLabelId] : []);
      setSelectedSubLabelIds(defaultSubLabelId ? [defaultSubLabelId] : []);
    }
    setError('');
  }, [initialProduct, defaultLabelId, defaultSubLabelId, isOpen]);

  if (!isOpen) return null;

  const toggleLabel = (id) => {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSubLabel = (id) => {
    setSelectedSubLabelIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError('');
      const res = await api.uploadImage(file);
      setImage(res.url);
    } catch (err) {
      setError(t('upload_error'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('name_required_product'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit({
        name: name.trim(),
        description: config.hasDescription ? description.trim() : '',
        price: config.hasPrice && price !== '' ? parseFloat(price) : null,
        image: config.hasImage ? image.trim() : '',
        location: config.hasLocation ? location.trim() : '',
        date: config.hasDate ? date.trim() : '',
        rating: config.hasRating && rating !== null ? rating : null,
        url: config.hasUrl ? url.trim() : '',
        customValues: config.customFields?.length > 0 ? customValues : {},
        labelIds: selectedLabelIds,
        subLabelIds: selectedSubLabelIds,
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
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 dark:border-stone-800 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50">
          <div>
            <h3 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-100">
              {isEditing ? t('edit_element_title') : t('add_element_title')}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {t('associate_tags')}
            </p>
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

          {/* Name & Price */}
          {config.hasPrice ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  {t('name_label')}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('name_placeholder')}
                  className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm placeholder:text-stone-400 dark:placeholder:text-stone-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  {t('price_label')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={t('price_placeholder')}
                  className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm placeholder:text-stone-400 dark:placeholder:text-stone-500"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                {t('name_label')}
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('name_placeholder')}
                className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm placeholder:text-stone-400 dark:placeholder:text-stone-500"
              />
            </div>
          )}

          {/* Description */}
          {config.hasDescription && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                {t('description')}
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('description_placeholder_product')}
                className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm resize-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
              />
            </div>
          )}

          {/* Location & Date */}
          {(config.hasLocation || config.hasDate) && (
            <div className={`grid grid-cols-1 ${config.hasLocation && config.hasDate ? 'sm:grid-cols-2' : ''} gap-3`}>
              {config.hasLocation && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{t('location_label')}</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t('location_placeholder')}
                    className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm placeholder:text-stone-400 dark:placeholder:text-stone-500"
                  />
                </div>
              )}
              {config.hasDate && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>{t('date_label')}</span>
                  </label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder={t('date_placeholder')}
                    className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm placeholder:text-stone-400 dark:placeholder:text-stone-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Rating & Web URL */}
          {(config.hasRating || config.hasUrl) && (
            <div className={`grid grid-cols-1 ${config.hasRating && config.hasUrl ? 'sm:grid-cols-2' : ''} gap-3`}>
              {config.hasRating && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t('rating_label')}</span>
                  </label>
                  <div className="flex items-center gap-1.5 py-1.5">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isFilled = rating !== null && starVal <= rating;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setRating(rating === starVal ? null : starVal)}
                          className="p-1 hover:scale-110 transition-transform focus:outline-none"
                          title={`${starVal}/5`}
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              isFilled
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-stone-300 dark:text-stone-600 hover:text-amber-400'
                            }`}
                          />
                        </button>
                      );
                    })}
                    {rating !== null && (
                      <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 ml-2">
                        {rating}/5
                      </span>
                    )}
                  </div>
                </div>
              )}
              {config.hasUrl && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-stone-400" />
                    <span>{t('url_label')}</span>
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t('url_placeholder')}
                    className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm placeholder:text-stone-400 dark:placeholder:text-stone-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Image (URL ou Upload) */}
          {config.hasImage && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  {t('illustration')}
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setImageType('url')}
                    className={`px-2 py-0.5 rounded ${imageType === 'url' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'}`}
                  >
                    {t('url_link')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageType('file')}
                    className={`px-2 py-0.5 rounded ${imageType === 'file' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'}`}
                  >
                    {t('local_file')}
                  </button>
                </div>
              </div>

              {imageType === 'url' ? (
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm placeholder:text-stone-400 dark:placeholder:text-stone-500"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-600 rounded-xl cursor-pointer bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100/60 dark:hover:bg-stone-800 transition-all text-xs font-medium text-stone-600 dark:text-stone-300">
                    <Upload className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                    <span>{uploading ? t('uploading') : t('select_photo')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              )}

              {image && (
                <div className="mt-2 flex items-center gap-3 p-2 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700">
                  <img
                    src={image}
                    alt={t('preview')}
                    className="w-12 h-12 object-cover rounded-lg shadow-sm"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <span className="text-xs text-stone-500 dark:text-stone-400 truncate flex-1">{image}</span>
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Custom Fields */}
          {config.customFields?.length > 0 && (
            <div className="space-y-3 pt-1 border-t border-stone-100 dark:border-stone-800">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                {t('custom_fields_modal_title')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {config.customFields.map((cf) => (
                  <div key={cf.name}>
                    <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1">
                      {cf.name}
                    </label>
                    <input
                      type="text"
                      value={customValues[cf.name] || ''}
                      onChange={(e) =>
                        setCustomValues((prev) => ({
                          ...prev,
                          [cf.name]: e.target.value,
                        }))
                      }
                      placeholder={cf.name}
                      className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm placeholder:text-stone-400 dark:placeholder:text-stone-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multi-Tagging : Labels (ex: Pays) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                {t('labels_multi')}
              </label>
              <span className="text-[11px] text-stone-400 dark:text-stone-400">
                {selectedLabelIds.length} {t('selected')}
              </span>
            </div>
            {labels.length === 0 ? (
              <p className="text-xs text-stone-400 dark:text-stone-500 italic">{t('no_labels_yet')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {labels.map((lbl) => {
                  const isChecked = selectedLabelIds.includes(lbl._id);
                  return (
                    <button
                      key={lbl._id}
                      type="button"
                      onClick={() => toggleLabel(lbl._id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                        isChecked
                          ? 'shadow-sm ring-1 ring-offset-1'
                          : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-750'
                      }`}
                      style={{
                        backgroundColor: isChecked ? `${lbl.color}22` : undefined,
                        borderColor: isChecked ? lbl.color : undefined,
                        color: isChecked ? lbl.color : undefined,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: lbl.color }}
                      />
                      <span>{lbl.name}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Multi-Tagging : Sous-labels */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                {t('sublabels_multi')}
              </label>
              <span className="text-[11px] text-stone-400 dark:text-stone-400">
                {selectedSubLabelIds.length} {t('selected')}
              </span>
            </div>
            {subLabels.length === 0 ? (
              <p className="text-xs text-stone-400 dark:text-stone-500 italic">{t('no_sublabels_yet')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subLabels.map((sub) => {
                  const isChecked = selectedSubLabelIds.includes(sub._id);
                  return (
                    <button
                      key={sub._id}
                      type="button"
                      onClick={() => toggleSubLabel(sub._id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                        isChecked
                          ? 'shadow-sm ring-1 ring-offset-1'
                          : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-750'
                      }`}
                      style={{
                        backgroundColor: isChecked ? `${sub.color}22` : undefined,
                        borderColor: isChecked ? sub.color : undefined,
                        color: isChecked ? sub.color : undefined,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: sub.color }}
                      />
                      <span>{sub.name}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="mt-1 text-[11px] text-stone-400 dark:text-stone-500">
              {t('general_section_note')}
            </p>
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
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? t('saving') : isEditing ? t('update') : t('add_to_book')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
