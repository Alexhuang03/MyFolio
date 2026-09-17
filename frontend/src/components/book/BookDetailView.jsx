import React, { useState, useMemo } from 'react';
import { ArrowLeft, BookOpen, Shuffle, Plus, Layers, Settings, BookMarked } from 'lucide-react';
import CategorySidebar from '../navigation/CategorySidebar';
import ProductWorkspace from '../content/ProductWorkspace';
import TagModal from '../modals/TagModal';
import ProductModal from '../modals/ProductModal';
import { PIVOT_MODES, getPivotViewData } from '../../utils/pivotEngine';
import { getCoverSrc } from '../../assets/covers';
import { useLanguage } from '../../i18n/LanguageContext';
import LanguageSwitcher from '../settings/LanguageSwitcher';
import ThemeToggle from '../settings/ThemeToggle';

export default function BookDetailView({
  book,
  labels = [],
  subLabels = [],
  products = [],
  onBackToLibrary,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
  onCreateSubLabel,
  onUpdateSubLabel,
  onDeleteSubLabel,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
}) {
  const { t } = useLanguage();
  // Pivot mode state: 100% client side
  const [pivotMode, setPivotMode] = useState(PIVOT_MODES.BY_LABEL);
  const [selectedPrimaryId, setSelectedPrimaryId] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [tagModalConfig, setTagModalConfig] = useState(null); // { isOpen, tagType, initialTag }
  const [productModalConfig, setProductModalConfig] = useState(null); // { isOpen, initialProduct, defaultLabelId, defaultSubLabelId }

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
              <p className="text-[10px] sm:text-[11px] text-stone-400 dark:text-stone-500 leading-none mt-0.5 truncate">
                {products.length} {products.length > 1 ? t('elements') : t('element')}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <ThemeToggle />
          <LanguageSwitcher />

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

          {/* Add Product Button */}
          <button
            onClick={() => handleOpenAddProduct(activePrimaryId)}
            className="px-2.5 sm:px-3 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1 sm:gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('element_btn')}</span>
          </button>
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
          onAddProduct={handleOpenAddProduct}
          onEditProduct={handleOpenEditProduct}
          onDeleteProduct={onDeleteProduct}
          onOpenMobileCategories={() => setIsMobileSidebarOpen(true)}
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
    </div>
  );
}
