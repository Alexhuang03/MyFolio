import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  Shuffle,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Tag,
  ChevronRight,
  AlertTriangle,
  MoreHorizontal,
  X,
  GripVertical,
} from 'lucide-react';
import { PIVOT_MODES } from '../../utils/pivotEngine';
import { useLanguage } from '../../i18n/LanguageContext';

const SLIDE_TRANSITION = 'transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1)';

// Translation verticale actuellement appliquée (y compris pendant une transition CSS en cours)
const getTranslateY = (el) => {
  const transform = getComputedStyle(el).transform;
  return transform && transform !== 'none' ? new DOMMatrixReadOnly(transform).m42 : 0;
};

export default function CategorySidebar({
  pivotMode,
  onTogglePivot,
  primaryItems = [],
  selectedPrimaryId,
  onSelectPrimary,
  onAddTag,
  onEditTag,
  onDeleteTag,
  onReorderTags,
  isOpenMobile = false,
  onCloseMobile,
  isReadOnly = false,
}) {
  const { t } = useLanguage();
  const isByLabel = pivotMode === PIVOT_MODES.BY_LABEL;
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Tag en cours de suppression pour confirmation
  const [tagToDelete, setTagToDelete] = useState(null);
  const [deleteMode, setDeleteMode] = useState('cascade'); // 'cascade' ou 'detach'

  // Glisser-déposer (souris + tactile via Pointer Events).
  // Pendant le déplacement, l'ordre du DOM ne change pas : l'élément saisi suit le pointeur et les autres
  // s'écartent via des transformations CSS. Le nouvel ordre n'est appliqué qu'au lâcher.
  const [draggingId, setDraggingId] = useState(null);
  const dragRef = useRef(null); // État du déplacement en cours, lu par les écouteurs window
  const navRef = useRef(null);
  const itemRefs = useRef(new Map());
  const prevOffsets = useRef(new Map()); // Position de layout de chaque élément au rendu précédent
  const canReorder = !isReadOnly && !!onReorderTags;

  // Animation FLIP : quand l'ordre change (au lâcher ou via un collaborateur), chaque élément
  // glisse depuis sa position affichée vers sa nouvelle place
  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    itemRefs.current.forEach((el, id) => {
      const newOffset = el.offsetTop;
      const oldOffset = prevOffsets.current.get(id) ?? newOffset;
      prevOffsets.current.set(id, newOffset);
      if (oldOffset === newOffset && !el.style.transform) return;

      const invert = oldOffset + getTranslateY(el) - newOffset;
      if (reduceMotion || Math.abs(invert) < 0.5) {
        el.style.transition = '';
        el.style.transform = '';
        return;
      }

      // Inverser : replacer visuellement l'élément là où il était, puis jouer la transition vers 0
      el.style.transition = 'none';
      el.style.transform = `translateY(${invert}px)`;
      el.getBoundingClientRect(); // Forcer le reflow pour que le point de départ soit pris en compte
      el.style.transition = SLIDE_TRANSITION;
      el.style.transform = '';
      el.addEventListener(
        'transitionend',
        () => {
          if (!el.style.transform) el.style.transition = '';
        },
        { once: true }
      );
    });
  }, [primaryItems]);

  // Met à jour les positions affichées (au plus une fois par image)
  const updateDragPositions = () => {
    const drag = dragRef.current;
    if (!drag) return;
    drag.frame = null;
    const scrollDelta = (navRef.current?.scrollTop ?? 0) - drag.startScrollTop;
    const dy = drag.pointerY - drag.startPointerY + scrollDelta;

    const dragged = itemRefs.current.get(drag.id);
    if (dragged) dragged.style.transform = `translateY(${dy}px) scale(1.02)`;

    // Nouvelle place = nombre d'autres éléments dont le centre est au-dessus du centre de l'élément saisi
    const draggedCenter = drag.centers[drag.startIndex] + dy;
    const targetIndex = drag.ids.filter(
      (id, index) => index !== drag.startIndex && drag.centers[index] < draggedCenter
    ).length;
    if (targetIndex === drag.targetIndex) return;
    drag.targetIndex = targetIndex;

    // Les éléments entre l'ancienne et la nouvelle place s'écartent d'un cran
    drag.ids.forEach((id, index) => {
      if (index === drag.startIndex) return;
      const el = itemRefs.current.get(id);
      if (!el) return;
      let shift = 0;
      if (index > drag.startIndex && index <= targetIndex) shift = -drag.pitch;
      if (index < drag.startIndex && index >= targetIndex) shift = drag.pitch;
      el.style.transition = SLIDE_TRANSITION;
      el.style.transform = shift ? `translateY(${shift}px)` : '';
    });
  };

  const handlePointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    drag.pointerY = e.clientY;
    if (!drag.frame) drag.frame = requestAnimationFrame(updateDragPositions);
  };

  const stopListening = () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerUp);
  };

  const handlePointerUp = () => {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.frame) cancelAnimationFrame(drag.frame);
    stopListening();
    dragRef.current = null;
    setDraggingId(null);

    const ids = drag.ids.filter((id) => id !== drag.id);
    ids.splice(drag.targetIndex, 0, drag.id);

    if (drag.targetIndex !== drag.startIndex) {
      // Le changement d'ordre déclenche l'animation FLIP qui pose chaque élément à sa place
      onReorderTags(ids);
    } else {
      // Aucun changement : ramener simplement les éléments à leur position
      drag.ids.forEach((id) => {
        const el = itemRefs.current.get(id);
        if (!el) return;
        el.style.transition = SLIDE_TRANSITION;
        el.style.transform = '';
      });
    }
  };

  // Nettoyage si le composant est démonté en plein déplacement
  useEffect(() => () => dragRef.current?.stopListening(), []);

  const handleDragStart = (e, itemId) => {
    if (dragRef.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    e.stopPropagation();

    const ids = primaryItems.filter((item) => !item.isSystem).map((item) => item.id);
    const els = ids.map((id) => itemRefs.current.get(id));
    if (els.some((el) => !el)) return;

    // Mesures faites une seule fois, au début du déplacement
    els.forEach((el) => {
      el.style.transition = 'none';
      el.style.transform = '';
    });
    const centers = els.map((el) => el.offsetTop + el.offsetHeight / 2);
    const startIndex = ids.indexOf(itemId);
    const gap = els.length > 1 ? els[1].offsetTop - els[0].offsetTop - els[0].offsetHeight : 0;

    dragRef.current = {
      id: itemId,
      ids,
      centers,
      startIndex,
      targetIndex: startIndex,
      pitch: els[startIndex].offsetHeight + gap,
      startPointerY: e.clientY,
      pointerY: e.clientY,
      startScrollTop: navRef.current?.scrollTop ?? 0,
      frame: null,
      stopListening,
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    setActiveMenuId(null);
    setDraggingId(itemId);
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-30 md:hidden transition-opacity"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-72 sm:w-80 bg-[#fbf9f5] dark:bg-stone-900 border-r border-stone-200/80 dark:border-stone-800 flex flex-col h-full select-none shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out
          md:static md:translate-x-0
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Pivot Action Banner */}
        <div className="p-4 border-b border-stone-200/70 dark:border-stone-800/80 bg-stone-100/50 dark:bg-stone-950/40">
          <button
            onClick={onTogglePivot}
            className="w-full relative group overflow-hidden bg-stone-900 hover:bg-stone-850 dark:bg-stone-800 dark:hover:bg-stone-750 border border-transparent dark:border-stone-700 text-white p-3 rounded-2xl shadow-xs hover:shadow-sm transition-all flex items-center justify-between"
            title={t('pivot_tooltip')}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center transition-transform group-hover:rotate-180 duration-500">
                <Shuffle className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-[10px] uppercase tracking-wider text-stone-400 dark:text-stone-400 font-semibold">
                  {t('current_axis')} {isByLabel ? t('labels') : t('sublabels')}
                </span>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  {t('switch_to')} {isByLabel ? t('sublabels') : t('labels')}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Categories Header */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-stone-200/60 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-stone-400 dark:text-stone-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {isByLabel ? t('labels_header') : t('sublabels_header')}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton Ajouter un Label / Sous-label (caché en lecture seule) */}
            {!isReadOnly && (
              <button
                onClick={onAddTag}
                className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 rounded-lg shadow-2xs hover:border-amber-400 transition-all flex items-center gap-1"
                title={t(isByLabel ? 'add_label_tooltip' : 'add_sublabel_tooltip')}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('add')}</span>
              </button>
            )}

            {/* Close button for mobile drawer */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-lg transition-colors"
                title={t('close_menu')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      {/* Category List */}
      <nav ref={navRef} className="flex-1 overflow-y-auto p-3 space-y-1">
        {primaryItems.length === 0 ? (
          <div className="p-6 text-center text-xs text-stone-400 dark:text-stone-500">
            {t('no_items_yet')}
          </div>
        ) : (
          primaryItems.map((item) => {
            const isSelected = item.id === selectedPrimaryId;
            const isDragged = draggingId === item.id;
            return (
              <div
                key={item.id}
                ref={(el) => {
                  if (el) itemRefs.current.set(item.id, el);
                  else itemRefs.current.delete(item.id);
                }}
                onClick={() => {
                  onSelectPrimary(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                // Bordure toujours présente (transparente hors sélection) : sélectionner un label ne décale rien ;
                // seules les couleurs sont animées (pas la taille ni la position)
                className={`group relative flex items-center justify-between px-3.5 py-3 rounded-xl cursor-pointer border transition-[background-color,border-color,color,box-shadow] duration-150 ${
                  isDragged ? 'ring-2 ring-amber-400/70 shadow-lg z-10 will-change-transform ' : ''
                }${
                  isSelected
                    ? 'bg-white dark:bg-stone-800 shadow-xs border-stone-200/90 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold'
                    : 'border-transparent text-stone-600 dark:text-stone-300 hover:bg-white/60 dark:hover:bg-stone-800/50 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                {/* Left color dot & name */}
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {canReorder && (
                    <span
                      onPointerDown={item.isSystem ? undefined : (e) => handleDragStart(e, item.id)}
                      onClick={(e) => e.stopPropagation()}
                      className={`-ml-2 -mr-1.5 p-0.5 rounded touch-none ${
                        item.isSystem
                          ? 'invisible'
                          : `text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-300 ${
                              isDragged ? 'cursor-grabbing' : 'cursor-grab'
                            }`
                      }`}
                      title={item.isSystem ? undefined : t('drag_to_reorder')}
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <span
                    className="w-3 h-3 rounded-full shrink-0 transition-transform group-hover:scale-110 shadow-2xs"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs truncate">{item.name}</span>
                </div>

                {/* Right badges & action menu */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-200'
                        : 'bg-stone-200/60 dark:bg-stone-800/80 text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {item.count}
                  </span>

                  {/* Actions for non-system items (disabled in read-only) */}
                  {!item.isSystem && !isReadOnly && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === item.id ? null : item.id);
                        }}
                        className="reveal-on-hover p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-md hover:bg-stone-100 dark:hover:bg-stone-700"
                        title={t('options')}
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>

                      {activeMenuId === item.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                            }}
                          />
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 py-1 z-40 text-xs font-normal">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(null);
                                onEditTag(item.raw);
                              }}
                              className="w-full text-left px-3 py-2 flex items-center gap-2 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                              <span>{t('edit')}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(null);
                                setTagToDelete(item);
                              }}
                              className="w-full text-left px-3 py-2 flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{t('delete')}</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </nav>

      {/* Bottom Info Tip */}
      <div className="p-3 border-t border-stone-200/60 dark:border-stone-800 text-[11px] text-stone-400 dark:text-stone-500 text-center bg-stone-50/50 dark:bg-stone-950/30">
        {t('pivot_tip')}
      </div>

      {/* Confirmation Modal Suppression en Cascade */}
      {tagToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-stone-200 dark:border-stone-700 animate-scale-up">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100 mb-1">
              {t('delete_confirm')} "{tagToDelete.name}" ?
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 leading-relaxed">
              <strong className="text-rose-600 dark:text-rose-400">{t('delete_warning')}</strong> {t('delete_cascade_msg')} ({tagToDelete.count} {t('product_count')}).
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTagToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteTag(tagToDelete.id, deleteMode);
                  setTagToDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                {t('confirm_delete')}
              </button>
            </div>
          </div>
        </div>
      )}
      </aside>
    </>
  );
}
