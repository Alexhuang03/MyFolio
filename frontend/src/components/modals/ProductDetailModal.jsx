import React, { useEffect } from 'react';
import {
  X,
  Edit3,
  Calendar,
  MapPin,
  Star,
  ExternalLink,
  Package,
  FileText,
  Tag,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ProductDetailModal({
  isOpen,
  product,
  labels = [],
  subLabels = [],
  fieldsConfig,
  isReadOnly = false,
  onClose,
  onEdit,
  onBackToCart,
}) {
  const { t } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

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

  const labelMap = new Map(labels.map((l) => [l._id.toString(), l]));
  const subLabelMap = new Map(subLabels.map((s) => [s._id.toString(), s]));

  const assignedLabels = (product.labelIds || [])
    .map((id) => labelMap.get(id.toString()))
    .filter(Boolean);

  const assignedSubLabels = (product.subLabelIds || [])
    .map((id) => subLabelMap.get(id.toString()))
    .filter(Boolean);

  const hasExtraMeta =
    (config.hasLocation && product.location) ||
    (config.hasDate && product.date) ||
    (config.hasRating && product.rating !== null && product.rating !== undefined) ||
    (config.hasUrl && product.url) ||
    (config.customFields && config.customFields.some((cf) => product.customValues?.[cf.name]));

  const formattedUrl = product.url
    ? product.url.startsWith('http')
      ? product.url
      : `https://${product.url}`
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Modal Container: taille constante et identique pour tous les éléments */}
      <div
        className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-xl w-full h-[600px] sm:h-[650px] max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 dark:border-stone-800 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Hauteur fixe flex-shrink-0) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 block leading-tight">
                {t('product_details')}
              </span>
              <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-stone-100 truncate leading-snug">
                {product.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {!isReadOnly && onEdit && (
              <button
                onClick={() => onEdit(product)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title={t('edit_from_detail')}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{t('edit_from_detail')}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer flex-shrink-0"
              title={t('close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body: Contenu avec défilement fluide pour les descriptions longues */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 min-h-0">
          {/* Photo de l'élément (si activée et présente) */}
          {config.hasImage && product.image && (
            <div className="w-full h-56 sm:h-64 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-750 relative group flex items-center justify-center flex-shrink-0 shadow-inner">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <a
                href={product.image}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-stone-900/80 hover:bg-stone-900 text-white text-[11px] font-medium backdrop-blur-xs flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Zoom</span>
              </a>
            </div>
          )}

          {/* Titre & Prix */}
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 dark:text-stone-100 leading-snug break-words flex-1">
              {product.name}
            </h2>
            {config.hasPrice && product.price !== null && product.price !== undefined && (
              <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-mono font-bold text-sm sm:text-base rounded-xl shadow-2xs flex-shrink-0">
                {Number(product.price).toFixed(2)} €
              </span>
            )}
          </div>

          {/* Badges métadonnées (Note, Date, Lieu, Lien web, Custom fields) */}
          {hasExtraMeta && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-stone-600 dark:text-stone-300">
              {config.hasRating && product.rating !== null && product.rating !== undefined && (
                <div className="inline-flex items-center gap-1 bg-amber-50/80 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= product.rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-stone-300 dark:text-stone-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 ml-1">
                    {product.rating}/5
                  </span>
                </div>
              )}

              {config.hasDate && product.date && (
                <span className="inline-flex items-center gap-1.5 bg-stone-100/80 dark:bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-200/80 dark:border-stone-750">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>{product.date}</span>
                </span>
              )}

              {config.hasLocation && product.location && (
                <span className="inline-flex items-center gap-1.5 bg-stone-100/80 dark:bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-200/80 dark:border-stone-750">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{product.location}</span>
                </span>
              )}

              {config.hasUrl && product.url && (
                <a
                  href={formattedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-stone-100/80 dark:bg-stone-800 hover:bg-stone-200/80 dark:hover:bg-stone-750 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-lg border border-stone-200/80 dark:border-stone-750 transition-colors"
                  title={formattedUrl}
                >
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="underline decoration-amber-400/50 underline-offset-2">
                    {t('open_link')}
                  </span>
                </a>
              )}

              {config.customFields?.map((cf) => {
                const val = product.customValues?.[cf.name];
                if (!val) return null;
                return (
                  <span
                    key={cf.name}
                    className="inline-flex items-center gap-1.5 bg-stone-100/80 dark:bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-200/80 dark:border-stone-750 text-xs"
                  >
                    <span className="text-stone-400 font-medium">{cf.name}:</span>
                    <span className="text-stone-800 dark:text-stone-200 font-medium">{val}</span>
                  </span>
                );
              })}
            </div>
          )}

          {/* Section Tags (Labels & Sous-labels) */}
          {(assignedLabels.length > 0 || assignedSubLabels.length > 0) && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 block">
                Tags & Catégories
              </span>
              <div className="flex flex-wrap gap-1.5 items-center">
                {assignedLabels.map((lbl) => (
                  <span
                    key={lbl._id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border"
                    style={{
                      backgroundColor: `${lbl.color}15`,
                      borderColor: `${lbl.color}50`,
                      color: lbl.color,
                    }}
                  >
                    <Tag className="w-3 h-3" />
                    <span>{lbl.name}</span>
                  </span>
                ))}

                {assignedSubLabels.map((sub) => (
                  <span
                    key={sub._id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border"
                    style={{
                      backgroundColor: `${sub.color}15`,
                      borderColor: `${sub.color}50`,
                      color: sub.color,
                    }}
                  >
                    <Layers className="w-3 h-3" />
                    <span>{sub.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section Description Complète ("Prescription") */}
          {config.hasDescription && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
                <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {t('full_description')}
                </h4>
              </div>

              <div className="bg-stone-50/90 dark:bg-stone-850/80 rounded-xl p-4 border border-stone-200/80 dark:border-stone-750 text-sm leading-relaxed text-stone-800 dark:text-stone-200 font-sans whitespace-pre-wrap select-text break-words">
                {product.description ? (
                  product.description
                ) : (
                  <span className="text-stone-400 dark:text-stone-500 italic text-xs">
                    {t('no_description_provided')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer (Hauteur fixe flex-shrink-0) */}
        {onBackToCart && (
          <div className="flex items-center justify-center px-4 sm:px-6 py-3.5 sm:py-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50 flex-shrink-0 min-h-[56px]">
            <button
              onClick={onBackToCart}
              className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('back_to_cart')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
