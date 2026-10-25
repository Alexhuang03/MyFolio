/**
 * Clavier virtuel (iPad, iPhone, Android) : il recouvre le bas de l'écran sans réduire la page,
 * si bien qu'une fenêtre centrée garde ses champs cachés sous le clavier.
 *
 * - Expose la zone réellement visible en variables CSS (--vv-top, --vv-height), utilisées par
 *   la classe .modal-overlay pour que les fenêtres tiennent au-dessus du clavier ;
 * - Recentre le champ touché dans cette zone une fois le clavier ouvert.
 */
const KEYBOARD_ANIMATION_MS = 350;

const isEditable = (el) =>
  el instanceof HTMLElement &&
  (el.isContentEditable ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    (el.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit', 'file', 'range', 'color'].includes(el.type)));

export const installVisualViewport = () => {
  const vv = window.visualViewport;
  if (!vv) return;

  const root = document.documentElement;
  const update = () => {
    root.style.setProperty('--vv-top', `${vv.offsetTop}px`);
    root.style.setProperty('--vv-height', `${vv.height}px`);
  };
  update();
  vv.addEventListener('resize', update);
  vv.addEventListener('scroll', update);

  // Écrans tactiles uniquement : avec une souris, aucun clavier ne recouvre la page
  if (!window.matchMedia('(pointer: coarse)').matches) return;

  document.addEventListener('focusin', (e) => {
    const field = e.target;
    if (!isEditable(field)) return;
    setTimeout(() => {
      if (document.activeElement !== field) return;
      const rect = field.getBoundingClientRect();
      const visibleTop = vv.offsetTop;
      const visibleBottom = vv.offsetTop + vv.height;
      if (rect.top < visibleTop || rect.bottom > visibleBottom) {
        field.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }, KEYBOARD_ANIMATION_MS);
  });
};
