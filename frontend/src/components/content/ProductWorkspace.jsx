import React, { useState } from 'react';
import { Plus, Search, Layers, Sparkles, FolderOpen, Info, Menu } from 'lucide-react';
import ProductCard from './ProductCard';
import { PIVOT_MODES } from '../../utils/pivotEngine';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ProductWorkspace({
  pivotMode,
  selectedPrimaryItem,
  sections = [],
  labels = [],
  subLabels = [],
  fieldsConfig,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onOpenMobileCategories,
}) {
  const { t } = useLanguage();
  const [filterQuery, setFilterQuery] = useState('');
  const isByLabel = pivotMode === PIVOT_MODES.BY_LABEL;

  if (!selectedPrimaryItem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center text-stone-400 dark:text-stone-500 bg-[#faf8f5] dark:bg-stone-950">
        <FolderOpen className="w-12 h-12 stroke-1 mb-3 text-stone-300 dark:text-stone-600" />
        <h3 className="font-serif text-lg font-bold text-stone-700 dark:text-stone-200">{t('no_category_selected')}</h3>
        <p className="text-xs text-stone-400 dark:text-stone-400 mt-1 mb-4">
          {t('select_category')}
        </p>
        {onOpenMobileCategories && (
          <button
            onClick={onOpenMobileCategories}
            className="md:hidden px-4 py-2 bg-stone-900 dark:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
          >
            <Menu className="w-4 h-4" />
            <span>{t('view_categories')}</span>
          </button>
        )}
      </div>
    );
  }

  // Filtrer les produits dans chaque section selon la recherche locale
  const filteredSections = sections.map((sec) => {
    const products = sec.products.filter((p) =>
      p.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(filterQuery.toLowerCase()))
    );
    return { ...sec, products };
  });

  const totalFilteredCount = filteredSections.reduce(
    (acc, sec) => acc + sec.products.length,
    0
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#faf8f5] dark:bg-stone-950 transition-colors duration-200">
      {/* Workspace Top Header */}
      <div className="px-4 sm:px-8 py-3.5 sm:py-5 border-b border-stone-200/80 dark:border-stone-850 bg-white/70 dark:bg-stone-900/80 backdrop-blur-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-xs font-serif font-bold text-base sm:text-lg flex-shrink-0"
              style={{ backgroundColor: selectedPrimaryItem.color || '#6366f1' }}
            >
              {selectedPrimaryItem.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-stone-100 leading-tight">
                  {selectedPrimaryItem.name}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 rounded-full font-medium">
                  {totalFilteredCount} {totalFilteredCount > 1 ? t('elements') : t('element')}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-400 dark:text-stone-400 mt-0.5 line-clamp-1">
                {isByLabel
                  ? t('grouped_by_sublabels')
                  : t('grouped_by_labels')}
              </p>
            </div>
          </div>

          {/* Mobile Categories drawer toggle button */}
          {onOpenMobileCategories && (
            <button
              onClick={onOpenMobileCategories}
              className="md:hidden px-2.5 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-200 flex items-center gap-1.5 flex-shrink-0"
              title={t('change_category')}
            >
              <Menu className="w-4 h-4" />
              <span className="text-[11px]">{t('menu')}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Quick search with correct pl-10 */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={t('filter_elements')}
              className="w-full pl-10 pr-3 py-1.5 sm:py-2 bg-stone-100/80 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-750 rounded-xl text-xs text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-850 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-stone-400 dark:placeholder:text-stone-500"
            />
          </div>

          {/* Add Product Button */}
          <button
            onClick={() => onAddProduct(selectedPrimaryItem.id)}
            className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all flex items-center gap-1.5 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">{t('add_element')}</span>
            <span className="xs:hidden">{t('add_short')}</span>
          </button>
        </div>
      </div>

      {/* Sections & Products Workspace */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-10">
        {totalFilteredCount === 0 && (
          <div className="py-16 text-center bg-white/60 dark:bg-stone-900/60 border border-dashed border-stone-200 dark:border-stone-800 rounded-2xl max-w-md mx-auto p-8">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-stone-800 dark:text-stone-100 text-base mb-1">
              {t('no_element_in')} "{selectedPrimaryItem.name}"
            </h4>
            <p className="text-xs text-stone-400 dark:text-stone-400 mb-4">
              {t('add_first_element')}
            </p>
            <button
              onClick={() => onAddProduct(selectedPrimaryItem.id)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              {t('add_element_btn')}
            </button>
          </div>
        )}

        {filteredSections.map((section) => {
          if (section.products.length === 0 && filterQuery) {
            return null; // hide empty sections while searching
          }

          return (
            <div key={section.id} className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-stone-800">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: section.color }}
                  />
                  <h3 className="font-serif font-bold text-stone-800 dark:text-stone-100 text-base flex items-center gap-2">
                    {section.name}
                    {section.isGeneral && (
                      <span className="text-[10px] font-sans font-normal text-stone-400 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Info className="w-3 h-3" /> {t('orphans')}
                      </span>
                    )}
                  </h3>
                </div>
                <span className="text-xs text-stone-400 dark:text-stone-500 font-mono">
                  {section.products.length} {section.products.length > 1 ? t('elements') : t('element')}
                </span>
              </div>

              {/* Products in this section */}
              {section.products.length === 0 ? (
                <div className="py-6 px-4 bg-stone-50/60 dark:bg-stone-900/40 border border-dashed border-stone-200/80 dark:border-stone-800 rounded-xl text-center">
                  <p className="text-xs text-stone-400 dark:text-stone-500">
                    {t('no_element_subsection')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {section.products.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      labels={labels}
                      subLabels={subLabels}
                      fieldsConfig={fieldsConfig}
                      onEdit={onEditProduct}
                      onDelete={onDeleteProduct}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
