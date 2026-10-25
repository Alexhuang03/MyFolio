import React, { useRef, useState } from 'react';
import { Move, RotateCcw, ZoomIn } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { DEFAULT_FRAME, MAX_ZOOM, frameStyle, normalizeFrame } from '../../utils/imageFrame';

/**
 * Choix de la partie de l'image affichée sur la carte : on fait glisser l'image dans un aperçu
 * de même hauteur que la carte, et on zoome avec le curseur.
 */
export default function ImageFramer({ src, frame, onChange }) {
  const { t } = useLanguage();
  const { x, y, zoom } = normalizeFrame(frame);
  const boxRef = useRef(null);
  const dragRef = useRef(null);
  const [natural, setNatural] = useState(null); // Taille réelle de l'image
  const [dragging, setDragging] = useState(false);

  /**
   * Avec object-cover puis le zoom autour du point (x, y), le bord gauche de l'image est à
   * -x/100 × (zoom × largeur affichée − largeur du bloc) : déplacer de dx pixels revient à
   * changer x de dx × 100 / (débordement).
   */
  const overflow = () => {
    const box = boxRef.current;
    if (!box || !natural) return { w: 0, h: 0 };
    const cw = box.clientWidth;
    const ch = box.clientHeight;
    const cover = Math.max(cw / natural.w, ch / natural.h);
    return { w: zoom * natural.w * cover - cw, h: zoom * natural.h * cover - ch };
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, x, y, overflow: overflow() };
    setDragging(true);
  };

  const handlePointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const clamp = (v) => Math.round(Math.min(100, Math.max(0, v)) * 10) / 10;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    onChange({
      x: drag.overflow.w > 0.5 ? clamp(drag.x - (dx * 100) / drag.overflow.w) : x,
      y: drag.overflow.h > 0.5 ? clamp(drag.y - (dy * 100) / drag.overflow.h) : y,
      zoom,
    });
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const isDefault = x === DEFAULT_FRAME.x && y === DEFAULT_FRAME.y && zoom === DEFAULT_FRAME.zoom;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          {t('image_frame_label')}
        </span>
        {!isDefault && (
          <button
            type="button"
            onClick={() => onChange({ ...DEFAULT_FRAME })}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            {t('image_frame_reset')}
          </button>
        )}
      </div>

      {/* Aperçu : même hauteur que l'image d'une carte (h-40) et largeur proche d'une carte */}
      <div
        ref={boxRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`relative w-full max-w-xs mx-auto h-40 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 touch-none select-none ${
          dragging ? 'cursor-grabbing ring-2 ring-amber-500/50' : 'cursor-grab'
        }`}
      >
        <img
          src={src}
          alt={t('preview')}
          draggable={false}
          onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          className="w-full h-full object-cover scale-[var(--zoom)] pointer-events-none"
          style={frameStyle({ x, y, zoom })}
        />
        <span
          className={`absolute bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 text-white text-[10px] font-medium backdrop-blur-xs pointer-events-none transition-opacity ${
            dragging ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <Move className="w-3 h-3" />
          {t('image_frame_hint')}
        </span>
      </div>

      <label className="flex items-center gap-2.5 max-w-xs mx-auto text-stone-400">
        <ZoomIn className="w-4 h-4 shrink-0" />
        <span className="sr-only">{t('image_frame_zoom')}</span>
        <input
          type="range"
          min="1"
          max={MAX_ZOOM}
          step="0.05"
          value={zoom}
          onChange={(e) => onChange({ x, y, zoom: Number(e.target.value) })}
          className="flex-1 accent-amber-500 cursor-pointer"
        />
        <span className="w-10 text-right text-[11px] tabular-nums text-stone-500 dark:text-stone-400">
          ×{zoom.toFixed(1)}
        </span>
      </label>
    </div>
  );
}
