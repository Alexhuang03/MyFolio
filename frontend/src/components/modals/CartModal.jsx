import React, { useEffect, useState } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  Check,
  Eye,
  Package,
  Star,
  Tag,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function CartModal({
  isOpen,
  cartItems = [],
  onClose,
  onRemoveFromCart,
  onClearCart,
  onViewProduct,
}) {
  const { t } = useLanguage();
  const [completedIds, setCompletedIds] = useState(new Set());

  // Purge toute case cochée dont l'élément n'est plus dans le panier
  useEffect(() => {
    const currentItemIds = new Set(cartItems.map((item) => item._id));
    setCompletedIds((prev) => {
      let changed = false;
      const next = new Set();
      for (const id of prev) {
        if (currentItemIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [cartItems]);

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

  if (!isOpen) return null;

  const toggleCompleted = (id) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleClearCartClick = () => {
    setCompletedIds(new Set());
    onClearCart?.();
  };

  const handleRemoveItem = (id) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    onRemoveFromCart?.(id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-xl w-full h-[600px] sm:h-[650px] max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 dark:border-stone-800 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-stone-100 truncate">
                  {t('cart_title')}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  {cartItems.length}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                {t('cart_subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors flex-shrink-0"
            title={t('close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 min-h-0">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 dark:text-stone-500">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-3">
                <ShoppingBag className="w-8 h-8 stroke-1 text-stone-400 dark:text-stone-500" />
              </div>
              <h4 className="font-serif font-bold text-stone-700 dark:text-stone-300 text-base">
                {t('cart_empty')}
              </h4>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 max-w-xs">
                {t('cart_empty_desc')}
              </p>
            </div>
          ) : (
            cartItems.map((item) => {
              const isChecked = completedIds.has(item._id);
              return (
                <div
                  key={item._id}
                  className={`group p-3 sm:p-3.5 rounded-xl border transition-all flex items-center gap-3 ${
                    isChecked
                      ? 'bg-stone-50/60 dark:bg-stone-850/40 border-stone-200/50 dark:border-stone-800/50 opacity-60'
                      : 'bg-white dark:bg-stone-850/90 border-stone-200/80 dark:border-stone-750 shadow-xs hover:border-amber-500/40'
                  }`}
                >
                  {/* Checklist checkbox */}
                  <button
                    onClick={() => toggleCompleted(item._id)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-stone-300 dark:border-stone-600 hover:border-amber-500 bg-white dark:bg-stone-800 text-transparent'
                    }`}
                    title={isChecked ? 'Marquer comme à faire' : 'Marquer comme fait'}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  {/* Thumbnail */}
                  <div
                    onClick={() => onViewProduct?.(item)}
                    className="w-12 h-12 rounded-lg bg-stone-100 dark:bg-stone-800 overflow-hidden flex-shrink-0 relative cursor-pointer border border-stone-200/50 dark:border-stone-700"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <Package className="w-5 h-5 stroke-1" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onViewProduct?.(item)}
                  >
                    <div className="flex items-center gap-2">
                      <h4
                        className={`font-serif font-bold text-sm text-stone-900 dark:text-stone-100 truncate ${
                          isChecked ? 'line-through text-stone-400 dark:text-stone-500' : ''
                        }`}
                      >
                        {item.name}
                      </h4>
                      {item.price !== null && item.price !== undefined && (
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-amber-300 flex-shrink-0">
                          {Number(item.price).toFixed(2)} €
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                        {item.description}
                      </p>
                    )}

                    {item.rating !== null && item.rating !== undefined && (
                      <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-semibold mt-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{item.rating}/5</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onViewProduct?.(item)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                      title={t('product_details')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveItem(item._id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                      title={t('delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 sm:px-6 py-3.5 sm:py-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50 flex-shrink-0 min-h-[56px]">
          {cartItems.length > 0 && (
            <button
              onClick={handleClearCartClick}
              className="px-3.5 py-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('clear_cart')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
