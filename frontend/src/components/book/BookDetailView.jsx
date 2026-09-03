import React, { useState, useMemo } from 'react';
import { ArrowLeft, BookOpen, Shuffle, Plus, Layers, Settings, BookMarked } from 'lucide-react';
import CategorySidebar from '../navigation/CategorySidebar';
import ProductWorkspace from '../content/ProductWorkspace';
import TagModal from '../modals/TagModal';
import ProductModal from '../modals/ProductModal';
import { PIVOT_MODES, getPivotViewData } from '../../utils/pivotEngine';
import { getCoverSrc } from '../../assets/covers';

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
    <div className="h-screen w-screen flex flex-col bg-[#f5f2eb] overflow-hidden">
      {/* Top Application Bar (Inside Book) */}
      <header className="h-16 px-4 sm:px-6 bg-white/90 backdrop-blur-md border-b border-stone-200 flex items-center justify-between z-20 flex-shrink-0 shadow-2xs gap-2">
        {/* Left: Back to library & Book info */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={onBackToLibrary}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all flex-shrink-0"
            title="Retour à la bibliothèque"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Bibliothèque</span>
          </button>

          <div className="h-5 w-px bg-stone-200 flex-shrink-0 hidden sm:block" />

          {/* Book title and mini cover icon */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div
              className="w-6 h-8 sm:w-7 sm:h-9 rounded-sm overflow-hidden shadow-xs border border-stone-300 relative flex-shrink-0"
              style={{ backgroundColor: book.colorTheme || '#3b82f6' }}
            >
              <img src={coverSrc} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif font-bold text-stone-900 text-xs sm:text-base leading-tight truncate">
                {book.title}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-stone-400 leading-none mt-0.5 truncate">
                {products.length} élément{products.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Prominent Pivot Toggle Button */}
          <button
            onClick={togglePivot}
            className="px-2.5 sm:px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 sm:gap-2"
            title="Inverser les dimensions de tri"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden md:inline">Axe :</span>
            <span className="font-bold underline decoration-amber-400 underline-offset-2 text-[11px] sm:text-xs">
              {pivotMode === PIVOT_MODES.BY_LABEL ? 'Labels' : 'Sous-labels'}
            </span>
          </button>

          {/* Add Product Button */}
          <button
            onClick={() => handleOpenAddProduct(activePrimaryId)}
            className="px-2.5 sm:px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1 sm:gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Élément</span>
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
