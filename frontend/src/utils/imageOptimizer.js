/**
 * Utilitaire d'optimisation et de compression d'image pour le navigateur (client-side).
 *
 * Résout les problèmes fréquents sur mobile :
 * 1. Photos très lourdes prises directement avec l'appareil photo (ex: 8-20 Mo sur iPhone / Android)
 * 2. Formats spéciaux mobiles (HEIC / HEIF / grands formats) décodés par le navigateur et convertis en JPEG propre
 * 3. Réduction drastique du temps d'envoi en 4G/Wi-Fi et économie de bande passante
 */

export async function optimizeImageForUpload(file, maxWidth = 1920, maxHeight = 1920, quality = 0.82) {
  // Si ce n'est pas un fichier ou pas une image
  if (!file || !(file instanceof Blob) || !file.type.startsWith('image/')) {
    return file;
  }

  // Ne pas compresser les GIF animés pour conserver leurs frames
  if (file.type === 'image/gif') {
    return file;
  }

  // Si le fichier est déjà petit (< 600 Ko) et dans un format web universel, pas besoin de le ré-encoder
  if (file.size < 600 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
    return file;
  }

  return new Promise((resolve) => {
    // En cas d'impossibilité technique (vieux navigateur, fichier particulier), on retourne le fichier d'origine sans bloquer l'utilisateur
    const fallback = () => resolve(file);

    try {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();

        img.onload = () => {
          try {
            let width = img.naturalWidth || img.width;
            let height = img.naturalHeight || img.height;

            if (!width || !height) {
              return fallback();
            }

            // Calcul du ratio pour ne jamais dépasser maxWidth ni maxHeight
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              return fallback();
            }

            // Fond blanc pour éviter un fond noir si l'image contenait de la transparence
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  return fallback();
                }
                const originalName = file.name || 'photo.jpg';
                const cleanName = originalName.replace(/\.[^.]+$/, '') + '.jpg';
                const optimizedFile = new File([blob], cleanName, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(optimizedFile);
              },
              'image/jpeg',
              quality
            );
          } catch (canvasErr) {
            console.warn('[imageOptimizer] Erreur canvas:', canvasErr);
            fallback();
          }
        };

        img.onerror = () => {
          console.warn('[imageOptimizer] Impossible de charger l\'image via Image():', file.name);
          fallback();
        };

        img.src = readerEvent.target.result;
      };

      reader.onerror = () => fallback();
      reader.readAsDataURL(file);
    } catch (e) {
      console.warn('[imageOptimizer] Erreur globale FileReader:', e);
      fallback();
    }
  });
}
