import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Shuffle,
  Plus,
  Layers,
  Settings,
  BookMarked,
  Eye,
  CheckSquare,
  CheckCheck,
  X,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import CategorySidebar from '../navigation/CategorySidebar';
import ProductWorkspace from '../content/ProductWorkspace';
import TagModal from '../modals/TagModal';
import ProductModal from '../modals/ProductModal';
import ProductDetailModal from '../modals/ProductDetailModal';
import CartModal from '../modals/CartModal';
import { PIVOT_MODES, getPivotViewData } from '../../utils/pivotEngine';
import { getCoverSrc } from '../../assets/covers';
import { useLanguage } from '../../i18n/LanguageContext';
import CreateBookModal from '../library/CreateBookModal';
import ThemeToggle from '../settings/ThemeToggle';

export default function BookDetailView({
  book,
  labels = [],
  subLabels = [],
  products = [],
  onBackToLibrary,
  onUpdateBook,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
  onCreateSubLabel,
  onUpdateSubLabel,
  onDeleteSubLabel,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onDeleteMultipleProducts,
  onUpdateCart,
  showToast,
}) {
  const { t } = useLanguage();
  const isReadOnly = book?.myRole === 'viewer';

  // Pivot mode state: 100% client side
  const [pivotMode, setPivotMode] = useState(PIVOT_MODES.BY_LABEL);
  const [selectedPrimaryId, setSelectedPrimaryId] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isBookSettingsOpen, setIsBookSettingsOpen] = useState(false);

  // Selection mode & Cart state (Partagé en temps réel)
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [openedFromCart, setOpenedFromCart] = useState(false);

  // Cart item IDs et Completed IDs synchronisés avec le livre partagé
  const [cartItemIds, setCartItemIds] = useState(() => {
    const fromBook = book?.cart?.itemIds;
    if (Array.isArray(fromBook)) {
      return new Set(fromBook.map(String));
    }
    return new Set();
  });

  const [completedItemIds, setCompletedItemIds] = useState(() => {
    const fromBook = book?.cart?.completedIds;
    if (Array.isArray(fromBook)) {
      return new Set(fromBook.map(String));
    }
    return new Set();
  });

  // Synchronisation dynamique quand book.cart est mis à jour (WebSocket ou API)
  useEffect(() => {
    if (book?.cart) {
      const serverItemIds = (book.cart.itemIds || []).map(String);
      const serverCompletedIds = (book.cart.completedIds || []).map(String);
      setCartItemIds(new Set(serverItemIds));
      setCompletedItemIds(new Set(serverCompletedIds));
    }
  }, [book?.cart]);

  // Modals state
  const [tagModalConfig, setTagModalConfig] = useState(null); // { isOpen, tagType, initialTag }
  const [productModalConfig, setProductModalConfig] = useState(null); // { isOpen, initialProduct, defaultLabelId, defaultSubLabelId }
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);

  // Pivot computation
  const {
    primaryItems,
    selectedPrimaryId: activePrimaryId,
    selectedPrimaryItem,
    sections,
    totalProductsCount,
  } = useMemo(() => {
    return getPivotViewData({
      pivotMode,
      selectedPrimaryId,
      labels,
      subLabels,
      products,
    });
  }, [pivotMode, selectedPrimaryId, labels, subLabels, products]);

  const togglePivot = () => {
    setPivotMode((prev) =>
      prev === PIVOT_MODES.BY_LABEL ? PIVOT_MODES.BY_SUBLABEL : PIVOT_MODES.BY_LABEL
    );
    setSelectedPrimaryId(null); // auto-selects first in new mode
  };

  const handleOpenAddTag = () => {
    setTagModalConfig({
      isOpen: true,
      tagType: pivotMode === PIVOT_MODES.BY_LABEL ? 'label' : 'sublabel',
      initialTag: null,
    });
  };

  const handleOpenEditTag = (tag) => {
    setTagModalConfig({
      isOpen: true,
      tagType: pivotMode === PIVOT_MODES.BY_LABEL ? 'label' : 'sublabel',
      initialTag: tag,
    });
  };

  const handleOpenAddProduct = (primaryId) => {
    const isByLabel = pivotMode === PIVOT_MODES.BY_LABEL;
    setProductModalConfig({
      isOpen: true,
      initialProduct: null,
      defaultLabelId: isByLabel && primaryId !== 'unassigned-label' ? primaryId : null,
      defaultSubLabelId: !isByLabel && primaryId !== 'unassigned-sublabel' ? primaryId : null,
    });
  };

  const handleOpenEditProduct = (prod) => {
    setProductModalConfig({
      isOpen: true,
      initialProduct: prod,
    });
  };

  // Selection and Cart handlers
  const allVisibleIds = useMemo(() => {
    return sections.flatMap((sec) => sec.products).map((p) => p._id);
  }, [sections]);

  const handleToggleSelectProduct = (product) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(product._id)) {
        next.delete(product._id);
      } else {
        next.add(product._id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const isAllSelected =
      allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedProductIds.has(id));

    if (isAllSelected) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(allVisibleIds));
    }
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedProductIds(new Set());
  };

  const handleAddToCart = () => {
    if (selectedProductIds.size === 0) return;
    const idsToAdd = [...selectedProductIds].map(String);
    const count = idsToAdd.length;

    // Mise à jour optimiste immédiate
    setCartItemIds((prev) => {
      const next = new Set(prev);
      idsToAdd.forEach((id) => next.add(id));
      return next;
    });

    setIsSelectionMode(false);
    setSelectedProductIds(new Set());
    showToast?.(t('items_added_to_cart', { count }));

    // Synchronisation collaborative en temps réel
    onUpdateCart?.({
      action: 'add',
      productIds: idsToAdd,
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedProductIds.size === 0) return;
    const selectedProducts = products.filter((p) => selectedProductIds.has(p._id));
    const count = selectedProducts.length;
    if (window.confirm(t('delete_multiple_products_confirm', { count }))) {
      const removedIds = [...selectedProductIds].map(String);

      // Supprimer aussi du panier si présents
      setCartItemIds((prev) => {
        const next = new Set(prev);
        removedIds.forEach((id) => next.delete(id));
        return next;
      });
      setCompletedItemIds((prev) => {
        const next = new Set(prev);
        removedIds.forEach((id) => next.delete(id));
        return next;
      });

      setIsSelectionMode(false);
      setSelectedProductIds(new Set());

      if (onDeleteMultipleProducts) {
        await onDeleteMultipleProducts(selectedProducts);
      } else {
        for (const prod of selectedProducts) {
          await onDeleteProduct(prod);
        }
      }
    }
  };

  const cartProducts = useMemo(() => {
    return products.filter((p) => cartItemIds.has(p._id));
  }, [products, cartItemIds]);

  const handleRemoveFromCart = (id) => {
    const idStr = String(id);
    setCartItemIds((prev) => {
      const next = new Set(prev);
      next.delete(idStr);
      return next;
    });
    setCompletedItemIds((prev) => {
      const next = new Set(prev);
      next.delete(idStr);
      return next;
    });
    showToast?.(t('item_removed_from_cart'));

    // Synchronisation collaborative en temps réel
    onUpdateCart?.({
      action: 'remove',
      productId: idStr,
    });
  };

  const handleClearCart = () => {
    setCartItemIds(new Set());
    setCompletedItemIds(new Set());
    showToast?.(t('cart_cleared'));

    // Synchronisation collaborative en temps réel
    onUpdateCart?.({
      action: 'clear',
    });
  };

  const handleToggleCompleted = (id) => {
    const idStr = String(id);
    setCompletedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(idStr)) {
        next.delete(idStr);
      } else {
        next.add(idStr);
      }
      return next;
    });

    // Synchronisation collaborative en temps réel
    onUpdateCart?.({
      action: 'toggle_completed',
      productId: idStr,
    });
  };

  const coverSrc = getCoverSrc(book.coverImage);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f5f2eb] dark:bg-stone-950 overflow-hidden transition-colors duration-200">
      {/* Top Application Bar (Inside Book) */}
      <header className="h-16 px-4 sm:px-6 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 flex items-center justify-between z-20 flex-shrink-0 shadow-2xs gap-2">
        {/* Left: Back to library & Book info */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={onBackToLibrary}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all flex-shrink-0"
            title={t('back_library_tooltip')}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('back_library')}</span>
          </button>

          <div className="h-5 w-px bg-stone-200 dark:bg-stone-700 flex-shrink-0 hidden sm:block" />

          {/* Book title and mini cover icon */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div
              className="w-6 h-8 sm:w-7 sm:h-9 rounded-sm overflow-hidden shadow-xs border border-stone-300 dark:border-stone-700 relative flex-shrink-0"
              style={{ backgroundColor: book.colorTheme || '#3b82f6' }}
            >
              <img src={coverSrc} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-xs sm:text-base leading-tight truncate">
                {book.title}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] sm:text-[11px] text-stone-400 dark:text-stone-500 leading-none truncate">
                  {products.length} {products.length > 1 ? t('elements') : t('element')}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400" title={t('live_sync')}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="hidden sm:inline">{t('live_sync')}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <ThemeToggle />
          {/* Bouton Paramètres du livre */}
          {!isReadOnly && (
            <button
              onClick={() => setIsBookSettingsOpen(true)}
              className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all border border-transparent hover:border-stone-200 dark:hover:border-stone-700 cursor-pointer"
              title={t('book_settings')}
            >
              <Settings className="w-4 h-4 text-stone-500 dark:text-stone-400" />
            </button>
          )}

          {/* Read-only badge */}
          {isReadOnly && (
            <span className="px-2.5 py-1 rounded-xl bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
              <Eye className="w-3.5 h-3.5" />
              <span>{t('readonly_badge')}</span>
            </span>
          )}

          {/* Prominent Pivot Toggle Button */}
          <button
            onClick={togglePivot}
            className="px-2.5 sm:px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 sm:gap-2"
            title={t('reverse_sort_tooltip')}
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span className="hidden md:inline">{t('axis')}</span>
            <span className="font-bold underline decoration-amber-400 underline-offset-2 text-[11px] sm:text-xs">
              {pivotMode === PIVOT_MODES.BY_LABEL ? t('labels') : t('sublabels')}
            </span>
          </button>

          {/* Bouton Panier */}
          <button
            onClick={() => setIsCartModalOpen(true)}
            className="relative px-2.5 sm:px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-stone-200/80 dark:border-stone-700"
            title={t('cart_title')}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden md:inline">{t('cart_btn')}</span>
            {cartProducts.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-600 text-white text-[10px] font-bold rounded-full ml-0.5 animate-scale-up">
                {cartProducts.length}
              </span>
            )}
          </button>

          {/* Bouton Sélectionner OU (Tout sélectionner + Annuler croix) */}
          {!isSelectionMode ? (
            <button
              onClick={() => setIsSelectionMode(true)}
              className="px-2.5 sm:px-3 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer"
              title={t('select_mode')}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('select_mode')}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 animate-fade-in">
              {/* Bouton Tout sélectionner */}
              <button
                onClick={handleSelectAll}
                className="px-2.5 sm:px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer"
                title={
                  allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedProductIds.has(id))
                    ? t('deselect_all')
                    : t('select_all')
                }
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedProductIds.has(id))
                    ? t('deselect_all')
                    : t('select_all')}
                </span>
              </button>

              {/* Bouton Annuler (la croix) */}
              <button
                onClick={handleCancelSelection}
                className="p-1.5 sm:px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer border border-stone-200 dark:border-stone-700"
                title={t('cancel_selection')}
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">{t('cancel_selection')}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Split-Screen Interior */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Column : Navigation Categories */}
        <CategorySidebar
          pivotMode={pivotMode}
          onTogglePivot={togglePivot}
          primaryItems={primaryItems}
          selectedPrimaryId={activePrimaryId}
          onSelectPrimary={(id) => setSelectedPrimaryId(id)}
          onAddTag={handleOpenAddTag}
          onEditTag={handleOpenEditTag}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isReadOnly={isReadOnly}
          onDeleteTag={(id, mode) => {
            if (pivotMode === PIVOT_MODES.BY_LABEL) {
              return onDeleteLabel(id, mode);
            } else {
              return onDeleteSubLabel(id, mode);
            }
          }}
        />

        {/* Right Area : Products Workspace */}
        <ProductWorkspace
          pivotMode={pivotMode}
          selectedPrimaryItem={selectedPrimaryItem}
          sections={sections}
          labels={labels}
          subLabels={subLabels}
          fieldsConfig={book?.fieldsConfig}
          onAddProduct={handleOpenAddProduct}
          onEditProduct={handleOpenEditProduct}
          onDeleteProduct={onDeleteProduct}
          onViewProduct={(product) => setSelectedProductDetail(product)}
          onOpenMobileCategories={() => setIsMobileSidebarOpen(true)}
          isReadOnly={isReadOnly}
          isSelectionMode={isSelectionMode}
          selectedProductIds={selectedProductIds}
          onToggleSelect={handleToggleSelectProduct}
        />
      </div>

      {/* Tag Modal (Create / Edit Label or SubLabel) */}
      {tagModalConfig?.isOpen && (
        <TagModal
          isOpen={tagModalConfig.isOpen}
          tagType={tagModalConfig.tagType}
          initialTag={tagModalConfig.initialTag}
          existingTags={tagModalConfig.tagType === 'label' ? labels : subLabels}
          onClose={() => setTagModalConfig(null)}
          onSubmit={async (data) => {
            if (tagModalConfig.initialTag) {
              if (tagModalConfig.tagType === 'label') {
                await onUpdateLabel(tagModalConfig.initialTag._id, data);
              } else {
                await onUpdateSubLabel(tagModalConfig.initialTag._id, data);
              }
            } else {
              if (tagModalConfig.tagType === 'label') {
                await onCreateLabel({ ...data, bookId: book._id });
              } else {
                await onCreateSubLabel({ ...data, bookId: book._id });
              }
            }
          }}
        />
      )}

      {/* Product Modal (Create / Edit Product) */}
      {productModalConfig?.isOpen && (
        <ProductModal
          isOpen={productModalConfig.isOpen}
          initialProduct={productModalConfig.initialProduct}
          defaultLabelId={productModalConfig.defaultLabelId}
          defaultSubLabelId={productModalConfig.defaultSubLabelId}
          labels={labels}
          subLabels={subLabels}
          fieldsConfig={book?.fieldsConfig}
          onClose={() => setProductModalConfig(null)}
          onSubmit={async (data) => {
            if (productModalConfig.initialProduct) {
              await onUpdateProduct(productModalConfig.initialProduct._id, data);
            } else {
              await onCreateProduct({ ...data, bookId: book._id });
            }
          }}
        />
      )}

      {/* Modal Paramètres du livre */}
      {isBookSettingsOpen && (
        <CreateBookModal
          isOpen={isBookSettingsOpen}
          initialBook={book}
          onClose={() => setIsBookSettingsOpen(false)}
          onSubmit={async (data) => {
            if (onUpdateBook) {
              await onUpdateBook(book._id, data);
            }
          }}
        />
      )}

      {/* Product Detail / Presentation Modal */}
      {selectedProductDetail && (
        <ProductDetailModal
          isOpen={Boolean(selectedProductDetail)}
          product={
            products.find((p) => p._id === selectedProductDetail._id) || selectedProductDetail
          }
          labels={labels}
          subLabels={subLabels}
          fieldsConfig={book?.fieldsConfig}
          isReadOnly={isReadOnly}
          onClose={() => {
            setSelectedProductDetail(null);
            setOpenedFromCart(false);
          }}
          onEdit={(prod) => {
            setSelectedProductDetail(null);
            setOpenedFromCart(false);
            handleOpenEditProduct(prod);
          }}
          onBackToCart={
            openedFromCart
              ? () => {
                  setSelectedProductDetail(null);
                  setOpenedFromCart(false);
                  setIsCartModalOpen(true);
                }
              : null
          }
        />
      )}

      {/* Floating Action Bar during Selection Mode */}
      {isSelectionMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stone-900/95 dark:bg-stone-900/95 text-white backdrop-blur-md px-4 sm:px-6 py-3 rounded-2xl shadow-2xl border border-stone-750 flex items-center gap-3 sm:gap-5 animate-slide-up max-w-[95vw]">
          <div className="flex items-center gap-2 pr-2 border-r border-stone-700">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-semibold text-stone-200 whitespace-nowrap">
              {t('items_selected', { count: selectedProductIds.size })}
            </span>
          </div>

          {!isReadOnly && (
            <button
              onClick={handleDeleteSelected}
              disabled={selectedProductIds.size === 0}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                selectedProductIds.size === 0
                  ? 'text-stone-500 cursor-not-allowed opacity-50'
                  : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 active:scale-95'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('delete_selected')}</span>
            </button>
          )}

          <button
            onClick={handleAddToCart}
            disabled={selectedProductIds.size === 0}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap ${
              selectedProductIds.size === 0
                ? 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-50'
                : 'bg-amber-600 hover:bg-amber-500 text-white active:scale-95 shadow-amber-600/30'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{t('add_to_cart')}</span>
          </button>
        </div>
      )}

      {/* Cart / Focus Modal */}
      <CartModal
        isOpen={isCartModalOpen}
        cartItems={cartProducts}
        completedIds={completedItemIds}
        onToggleCompleted={handleToggleCompleted}
        onClose={() => setIsCartModalOpen(false)}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onViewProduct={(prod) => {
          setIsCartModalOpen(false);
          setOpenedFromCart(true);
          setSelectedProductDetail(prod);
        }}
      />
    </div>
  );
}
