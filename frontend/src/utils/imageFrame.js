/**
 * Cadrage d'une image dans un bloc : point de cadrage (x, y en %) et zoom.
 * Le point (x, y) de l'image reste aligné sur le même point (x, y) du bloc, quelle que soit sa taille :
 * object-position pour le recadrage, zoom autour de ce même point.
 */
export const DEFAULT_FRAME = { x: 50, y: 50, zoom: 1 };
export const MAX_ZOOM = 4;

export const normalizeFrame = (frame) => ({ ...DEFAULT_FRAME, ...(frame || {}) });

// Style à poser sur l'<img> (avec la classe object-cover et scale-[var(--zoom)])
export const frameStyle = (frame) => {
  const { x, y, zoom } = normalizeFrame(frame);
  return {
    objectPosition: `${x}% ${y}%`,
    transformOrigin: `${x}% ${y}%`,
    '--zoom': zoom,
  };
};
