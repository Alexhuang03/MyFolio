import React, { useState } from 'react';
import { Plus, Search, Layers, Sparkles, FolderOpen, Info } from 'lucide-react';
import ProductCard from './ProductCard';
import { PIVOT_MODES } from '../../utils/pivotEngine';

export default function ProductWorkspace({
  pivotMode,
  selectedPrimaryItem,
  sections = [],
  labels = [],
  subLabels = [],
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
}) {
  const [filterQuery, setFilterQuery] = useState('');
  const isByLabel = pivotMode === PIVOT_MODES.BY_LABEL;

  if (!selectedPrimaryItem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-stone-400">
        <FolderOpen className="w-12 h-12 stroke-1 mb-3 text-stone-300" />
        <h3 className="font-serif text-lg font-bold text-stone-700">Aucune catégorie sélectionnée</h3>
        <p className="text-xs text-stone-400 mt-1">
          Sélectionnez une catégorie à gauche pour afficher ses éléments.
        </p>
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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#faf8f5]">
      {/* Workspace Top Header */}
      <div className="px-8 py-5 border-b border-stone-200/80 bg-white/70 backdrop-blur-xs flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-3.5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs font-serif font-bold text-lg"
            style={{ backgroundColor: selectedPrimaryItem.color || '#6366f1' }}
          >
            {selectedPrimaryItem.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-xl text-stone-900 leading-tight">
                {selectedPrimaryItem.name}
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 bg-stone-100 border border-stone-200 text-stone-600 rounded-full font-medium">
                {totalFilteredCount} élément{totalFilteredCount > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              {isByLabel
                ? 'Regroupement par types de plat (sous-labels) avec section Général'
                : 'Regroupement par labels associés avec section Général'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick search */}
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filtrer ces produits..."
              className="w-full pl-8.5 pr-3 py-1.5 bg-stone-100/80 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          {/* Add Product Button */}
          <button
            onClick={() => onAddProduct(selectedPrimaryItem.id)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un produit</span>
          </button>
        </div>
      </div>

      {/* Sections & Products Workspace */}
      <div className="flex-1 overflow-y-auto p-8 space-y-10">
        {totalFilteredCount === 0 && (
          <div className="py-16 text-center bg-white/60 border border-dashed border-stone-200 rounded-2xl max-w-md mx-auto p-8">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-stone-800 text-base mb-1">
              Aucun produit dans "{selectedPrimaryItem.name}"
            </h4>
            <p className="text-xs text-stone-400 mb-4">
              Ajoutez votre premier produit en cliquant ci-dessous.
            </p>
            <button
              onClick={() => onAddProduct(selectedPrimaryItem.id)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              + Ajouter un produit
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
              <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: section.color }}
                  />
                  <h3 className="font-serif font-bold text-stone-800 text-base flex items-center gap-2">
                    {section.name}
                    {section.isGeneral && (
                      <span className="text-[10px] font-sans font-normal text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Info className="w-3 h-3" /> Orphelins / Non spécifié
                      </span>
                    )}
                  </h3>
                </div>
                <span className="text-xs text-stone-400 font-mono">
                  {section.products.length} plat{section.products.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Products in this section */}
              {section.products.length === 0 ? (
                <div className="py-6 px-4 bg-stone-50/60 border border-dashed border-stone-200/80 rounded-xl text-center">
                  <p className="text-xs text-stone-400">
                    Aucun produit dans cette sous-section pour le moment.
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
