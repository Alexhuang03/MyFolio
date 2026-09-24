import React from 'react';
import {
  Edit3,
  Trash2,
  Package,
  MapPin,
  Calendar,
  Star,
  Link as LinkIcon,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ProductCard({
  product,
  labels = [],
  subLabels = [],
  fieldsConfig,
  onEdit,
  onDelete,
  isReadOnly = false,
}) {
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
    config.customFields?.some((cf) => product.customValues?.[cf.name]);

  return (
    <div className="group relative bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs hover:shadow-md dark:hover:border-stone-700 transition-all flex flex-col overflow-hidden">
      {/* Product Image (Rendered only when hasImage is enabled) */}
      {config.hasImage && (
        <div className="relative w-full h-40 bg-stone-100 dark:bg-stone-800 overflow-hidden select-none">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}

          {/* Fallback image placeholder */}
          <div
            className={`w-full h-full flex flex-col items-center justify-center text-stone-300 dark:text-stone-600 bg-stone-50 dark:bg-stone-850 ${
              product.image ? 'hidden' : 'flex'
            }`}
          >
            <Package className="w-8 h-8 stroke-1 text-stone-400 dark:text-stone-500" />
            <span className="text-[10px] mt-1 text-stone-400 dark:text-stone-500">{t('no_image')}</span>
          </div>

          {/* Price tag badge */}
          {config.hasPrice && product.price !== null && product.price !== undefined && (
            <div className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-stone-900/85 dark:bg-stone-950/90 backdrop-blur-xs text-white dark:text-amber-300 rounded-lg text-xs font-mono font-semibold shadow-xs border border-transparent dark:border-amber-500/20">
              {Number(product.price).toFixed(2)} €
            </div>
          )}

          {/* Floating action buttons on hover (hidden in read-only) */}
          {!isReadOnly && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(product)}
                className="p-1.5 bg-white/90 dark:bg-stone-800/90 hover:bg-white dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-lg shadow-sm backdrop-blur-xs transition-colors"
                title={t('edit_element')}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(product)}
                className="p-1.5 bg-white/90 dark:bg-stone-800/90 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg shadow-sm backdrop-blur-xs transition-colors"
                title={t('delete_element')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Header row when no image */}
          {!config.hasImage ? (
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-sm leading-snug group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors flex-1 min-w-0">
                {product.name}
              </h4>
              <div className="flex items-center gap-1 flex-shrink-0">
                {config.hasPrice && product.price !== null && product.price !== undefined && (
                  <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-amber-300 rounded-md text-xs font-mono font-semibold mr-1">
                    {Number(product.price).toFixed(2)} €
                  </span>
                )}
                {!isReadOnly && (
                  <>
                    <button
                      onClick={() => onEdit(product)}
                      className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors"
                      title={t('edit_element')}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(product)}
                      className="p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                      title={t('delete_element')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <h4 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-sm leading-snug group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
              {product.name}
            </h4>
          )}

          {/* Description */}
          {config.hasDescription && product.description && (
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-300 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Extra metadata: Location, Date, Rating, URL, Custom values */}
          {hasExtraMeta && (
            <div className="mt-2.5 flex flex-wrap gap-1.5 items-center text-[11px] text-stone-500 dark:text-stone-400">
              {config.hasLocation && product.location && (
                <span className="inline-flex items-center gap-1 bg-stone-50 dark:bg-stone-800/60 px-2 py-0.5 rounded-md border border-stone-200/60 dark:border-stone-750">
                  <MapPin className="w-3 h-3 text-stone-400" />
                  <span className="truncate max-w-[140px]">{product.location}</span>
                </span>
              )}

              {config.hasDate && product.date && (
                <span className="inline-flex items-center gap-1 bg-stone-50 dark:bg-stone-800/60 px-2 py-0.5 rounded-md border border-stone-200/60 dark:border-stone-750">
                  <Calendar className="w-3 h-3 text-stone-400" />
                  <span>{product.date}</span>
                </span>
              )}

              {config.hasRating && product.rating !== null && product.rating !== undefined && (
                <div className="inline-flex items-center gap-0.5 bg-amber-50/60 dark:bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/40">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${
                        star <= product.rating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-stone-300 dark:text-stone-700'
                      }`}
                    />
                  ))}
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 ml-1">
                    {product.rating}/5
                  </span>
                </div>
              )}

              {config.hasUrl && product.url && (
                <a
                  href={product.url.startsWith('http') ? product.url : `https://${product.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline bg-stone-50 dark:bg-stone-800/60 px-2 py-0.5 rounded-md border border-stone-200/60 dark:border-stone-750 truncate max-w-[150px]"
                  title={product.url}
                >
                  <LinkIcon className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{product.url.replace(/^https?:\/\//, '')}</span>
                </a>
              )}

              {config.customFields?.map((cf) => {
                const val = product.customValues?.[cf.name];
                if (!val) return null;
                return (
                  <span
                    key={cf.name}
                    className="inline-flex items-center gap-1 bg-stone-50 dark:bg-stone-800/60 px-2 py-0.5 rounded-md border border-stone-200/60 dark:border-stone-750 text-[10px]"
                  >
                    <span className="text-stone-400 dark:text-stone-400 font-medium">{cf.name}:</span>
                    <span className="text-stone-700 dark:text-stone-300 font-medium">{val}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Badges container for Labels and SubLabels */}
        <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap gap-1.5 items-center">
          {/* Labels badges */}
          {assignedLabels.map((lbl) => (
            <span
              key={lbl._id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border"
              style={{
                backgroundColor: `${lbl.color}18`,
                borderColor: `${lbl.color}60`,
                color: lbl.color,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lbl.color }} />
              <span>{lbl.name}</span>
            </span>
          ))}

          {/* SubLabels badges */}
          {assignedSubLabels.map((sub) => (
            <span
              key={sub._id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border"
              style={{
                backgroundColor: `${sub.color}18`,
                borderColor: `${sub.color}60`,
                color: sub.color,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sub.color }} />
              <span>{sub.name}</span>
            </span>
          ))}

          {assignedLabels.length === 0 && assignedSubLabels.length === 0 && (
            <span className="text-[10px] text-stone-400 dark:text-stone-500 italic">{t('no_tags')}</span>
          )}
        </div>
      </div>
    </div>
  );
}
