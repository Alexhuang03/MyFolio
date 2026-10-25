import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * Visionneuse plein écran : l'image entière, ajustée à l'écran ; un clic dessus l'affiche
 * en taille réelle (défilable), un clic à côté, la croix ou Échap ferment.
 * Rendue dans <body> : les animations (transform) des fenêtres parentes décaleraient un élément « fixed ».
 */
export default function ImageLightbox({ src, alt, onClose }) {
  const { t } = useLanguage();
  const [fullSize, setFullSize] = useState(false);

  useEffect(() => {
    // En phase de capture : Échap ferme la visionneuse sans fermer aussi la fiche en dessous
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="modal-overlay fixed inset-0 z-70 bg-black/90 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full h-full ${fullSize ? 'overflow-auto' : 'flex items-center justify-center p-4 sm:p-10'}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <img
          src={src}
          alt={alt}
          onClick={() => setFullSize((v) => !v)}
          className={`select-none animate-scale-up ${
            fullSize
              ? 'max-w-none m-auto cursor-zoom-out'
              : 'max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-zoom-in'
          }`}
        />
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFullSize((v) => !v)}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
          title={fullSize ? t('image_fit_screen') : t('image_full_size')}
        >
          {fullSize ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
          title={t('about_close')}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>,
    document.body
  );
}
