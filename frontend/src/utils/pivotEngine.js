/**
 * Moteur de Pivot Dynamique 100% Côté Client
 * 
 * Bascule instantanément entre :
 * - Mode 'BY_LABEL' (ex: Pays en colonne gauche, Types de plat en sous-sections à droite)
 * - Mode 'BY_SUBLABEL' (ex: Types de plat en colonne gauche, Pays en sous-sections à droite)
 */

export const PIVOT_MODES = {
  BY_LABEL: 'BY_LABEL',
  BY_SUBLABEL: 'BY_SUBLABEL',
};

export const getPivotViewData = ({
  pivotMode = PIVOT_MODES.BY_LABEL,
  selectedPrimaryId = null,
  labels = [],
  subLabels = [],
  products = [],
}) => {
  const isByLabel = pivotMode === PIVOT_MODES.BY_LABEL;

  // 1. Définition des éléments de la colonne de gauche (Primary)
  let primaryItems = [];

  if (isByLabel) {
    primaryItems = labels.map((label) => {
      const count = products.filter(
        (p) => Array.isArray(p.labelIds) && p.labelIds.includes(label._id)
      ).length;
      return {
        id: label._id,
        name: label.name,
        color: label.color || '#6366f1',
        count,
        raw: label,
        isSystem: false,
      };
    });

    // Compter les orphelins de label
    const unassignedLabelCount = products.filter(
      (p) => !p.labelIds || p.labelIds.length === 0
    ).length;

    if (unassignedLabelCount > 0) {
      primaryItems.push({
        id: 'unassigned-label',
        name: 'Sans label',
        color: '#94a3b8',
        count: unassignedLabelCount,
        isSystem: true,
      });
    }
  } else {
    // Mode BY_SUBLABEL
    primaryItems = subLabels.map((subLabel) => {
      const count = products.filter(
        (p) => Array.isArray(p.subLabelIds) && p.subLabelIds.includes(subLabel._id)
      ).length;
      return {
        id: subLabel._id,
        name: subLabel.name,
        color: subLabel.color || '#10b981',
        count,
        raw: subLabel,
        isSystem: false,
      };
    });

    // Produits n'ayant aucun sous-label assigné (ex: Soda)
    const unassignedSubLabelCount = products.filter(
      (p) => !p.subLabelIds || p.subLabelIds.length === 0
    ).length;

    if (unassignedSubLabelCount > 0) {
      primaryItems.push({
        id: 'unassigned-sublabel',
        name: 'Général (Sans sous-label)',
        color: '#94a3b8',
        count: unassignedSubLabelCount,
        isSystem: true,
      });
    }
  }

  // 2. Sélection de l'élément actif à gauche
  let activeId = selectedPrimaryId;
  const exists = primaryItems.some((item) => item.id === activeId);
  if (!exists && primaryItems.length > 0) {
    activeId = primaryItems[0].id;
  }
  const selectedPrimaryItem = primaryItems.find((item) => item.id === activeId) || null;

  // 3. Filtrage des produits pour la catégorie sélectionnée
  let filteredProducts = [];
  if (selectedPrimaryItem) {
    if (isByLabel) {
      if (selectedPrimaryItem.id === 'unassigned-label') {
        filteredProducts = products.filter((p) => !p.labelIds || p.labelIds.length === 0);
      } else {
        filteredProducts = products.filter(
          (p) => Array.isArray(p.labelIds) && p.labelIds.includes(selectedPrimaryItem.id)
        );
      }
    } else {
      if (selectedPrimaryItem.id === 'unassigned-sublabel') {
        filteredProducts = products.filter((p) => !p.subLabelIds || p.subLabelIds.length === 0);
      } else {
        filteredProducts = products.filter(
          (p) => Array.isArray(p.subLabelIds) && p.subLabelIds.includes(selectedPrimaryItem.id)
        );
      }
    }
  }

  // 4. Construction des sous-sections de la fenêtre de droite (Secondary)
  const sections = [];

  if (isByLabel) {
    // Les sous-sections sont les SubLabels
    const subLabelMap = new Map(subLabels.map((s) => [s._id.toString(), s]));
    const matchedProductIds = new Set();

    subLabels.forEach((subLabel) => {
      const sectionProducts = filteredProducts.filter((p) => {
        const hasSub = Array.isArray(p.subLabelIds) && p.subLabelIds.includes(subLabel._id);
        if (hasSub) matchedProductIds.add(p._id.toString());
        return hasSub;
      });

      sections.push({
        id: subLabel._id,
        name: subLabel.name,
        color: subLabel.color || '#10b981',
        products: sectionProducts,
        isGeneral: false,
        raw: subLabel,
      });
    });

    // Gestion des orphelins : section "Général"
    const generalProducts = filteredProducts.filter(
      (p) => !matchedProductIds.has(p._id.toString())
    );

    if (generalProducts.length > 0 || sections.length === 0) {
      sections.push({
        id: 'general',
        name: 'Général',
        color: '#64748b',
        products: generalProducts,
        isGeneral: true,
      });
    }
  } else {
    // Mode BY_SUBLABEL : les sous-sections sont les Labels
    const labelMap = new Map(labels.map((l) => [l._id.toString(), l]));
    const matchedProductIds = new Set();

    labels.forEach((label) => {
      const sectionProducts = filteredProducts.filter((p) => {
        const hasLabel = Array.isArray(p.labelIds) && p.labelIds.includes(label._id);
        if (hasLabel) matchedProductIds.add(p._id.toString());
        return hasLabel;
      });

      sections.push({
        id: label._id,
        name: label.name,
        color: label.color || '#6366f1',
        products: sectionProducts,
        isGeneral: false,
        raw: label,
      });
    });

    // Orphelins de label dans ce sous-label
    const generalProducts = filteredProducts.filter(
      (p) => !matchedProductIds.has(p._id.toString())
    );

    if (generalProducts.length > 0 || sections.length === 0) {
      sections.push({
        id: 'general',
        name: 'Général',
        color: '#64748b',
        products: generalProducts,
        isGeneral: true,
      });
    }
  }

  return {
    primaryItems,
    selectedPrimaryId: activeId,
    selectedPrimaryItem,
    sections,
    totalProductsCount: filteredProducts.length,
  };
};
