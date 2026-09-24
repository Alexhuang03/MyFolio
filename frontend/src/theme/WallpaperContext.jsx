import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

const WallpaperContext = createContext();

const STORAGE_KEY = 'myfolio-wallpaper';
const CUSTOM_IMG_KEY = 'myfolio-custom-wallpaper-data';

export const AMBIANCE_PRESETS = [
  {
    id: 'default',
    type: 'ambiance',
    nameKey: 'wallpaper_default',
    previewColor: '#f5f5f4',
    darkPreviewColor: '#0c0a09',
    descriptionKey: 'wallpaper_default_desc',
  },
  {
    id: 'wood',
    type: 'ambiance',
    nameKey: 'wallpaper_wood',
    previewColor: '#b45309',
    darkPreviewColor: '#451a03',
    descriptionKey: 'wallpaper_wood_desc',
  },
  {
    id: 'paper',
    type: 'ambiance',
    nameKey: 'wallpaper_paper',
    previewColor: '#fef3c7',
    darkPreviewColor: '#292524',
    descriptionKey: 'wallpaper_paper_desc',
  },
  {
    id: 'cosmos',
    type: 'ambiance',
    nameKey: 'wallpaper_cosmos',
    previewColor: '#312e81',
    darkPreviewColor: '#0f172a',
    descriptionKey: 'wallpaper_cosmos_desc',
  },
  {
    id: 'slate',
    type: 'ambiance',
    nameKey: 'wallpaper_slate',
    previewColor: '#475569',
    darkPreviewColor: '#0f172a',
    descriptionKey: 'wallpaper_slate_desc',
  },
  {
    id: 'emerald',
    type: 'ambiance',
    nameKey: 'wallpaper_emerald',
    previewColor: '#6ee7b7',
    darkPreviewColor: '#064e3b',
    descriptionKey: 'wallpaper_emerald_desc',
  },
];

export const IMAGE_PRESETS = [
  {
    id: 'fond',
    type: 'image',
    nameKey: 'wallpaper_fond_cat',
    previewImage: '/img/fond.png',
    descriptionKey: 'wallpaper_fond_cat_desc',
  },
];

export const WALLPAPER_PRESETS = [...AMBIANCE_PRESETS, ...IMAGE_PRESETS];

/**
 * Compresse une image importée pour garantir qu'elle ne dépasse jamais le quota de localStorage (< 300 Ko).
 */
export function compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

function applyDomClasses(activeWallpaper, customUrl) {
  const body = document.body;
  const root = document.documentElement;

  const allIds = [...WALLPAPER_PRESETS.map((p) => p.id), 'custom'];
  allIds.forEach((id) => {
    body.classList.remove(`wallpaper-${id}`);
    root.classList.remove(`wallpaper-${id}`);
  });

  if (activeWallpaper && activeWallpaper !== 'default') {
    body.classList.add(`wallpaper-${activeWallpaper}`);
    root.classList.add(`wallpaper-${activeWallpaper}`);
  }

  if (activeWallpaper === 'custom' && customUrl) {
    root.style.setProperty('--custom-wallpaper-url', `url('${customUrl}')`);
  } else {
    root.style.removeProperty('--custom-wallpaper-url');
  }
}

export function WallpaperProvider({ children }) {
  const { user, updateProfile } = useAuth();
  const userSyncedIdRef = useRef(null);

  const [wallpaper, setWallpaperState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved || 'default';
    } catch {
      return 'default';
    }
  });

  const [customWallpaperUrl, setCustomWallpaperUrl] = useState(() => {
    try {
      return localStorage.getItem(CUSTOM_IMG_KEY) || null;
    } catch {
      return null;
    }
  });

  // Synchronisation intelligente avec la base de données :
  // Ne JAMAIS écraser un choix utilisateur local avec 'default' !
  useEffect(() => {
    if (!user?._id) {
      userSyncedIdRef.current = null;
      return;
    }

    if (userSyncedIdRef.current === user._id) {
      return;
    }
    userSyncedIdRef.current = user._id;

    const savedLocal = localStorage.getItem(STORAGE_KEY);
    const dbWallpaper = user.wallpaper;

    if (dbWallpaper && dbWallpaper !== 'default') {
      // Le profil utilisateur en base possède une préférence explicite
      setWallpaperState(dbWallpaper);
      try {
        localStorage.setItem(STORAGE_KEY, dbWallpaper);
      } catch {}
    } else if ((!dbWallpaper || dbWallpaper === 'default') && savedLocal && savedLocal !== 'default') {
      // L'utilisateur avait déjà sélectionné un fond en local, mais la base avait 'default' :
      // On conserve le choix local et on le synchronise vers la base de données.
      setWallpaperState(savedLocal);
      if (updateProfile) {
        updateProfile({ wallpaper: savedLocal }).catch((err) => {
          console.warn('[Wallpaper] Échec synchronisation fond vers profil:', err);
        });
      }
    }
  }, [user?._id, user?.wallpaper, updateProfile]);

  // Applique les classes CSS et variables DOM
  useEffect(() => {
    applyDomClasses(wallpaper, customWallpaperUrl);
    try {
      localStorage.setItem(STORAGE_KEY, wallpaper);
    } catch {}
  }, [wallpaper, customWallpaperUrl]);

  const changeWallpaper = useCallback(
    async (newWallpaper) => {
      setWallpaperState(newWallpaper);
      try {
        localStorage.setItem(STORAGE_KEY, newWallpaper);
      } catch (err) {
        console.warn('[Wallpaper] Erreur sauvegarde localStorage:', err);
      }

      // Application synchrone immédiate sur le DOM pour une réactivité instantanée
      applyDomClasses(newWallpaper, customWallpaperUrl);

      // Persistance dans le profil utilisateur en base de données
      try {
        if (updateProfile) {
          await updateProfile({ wallpaper: newWallpaper });
        } else {
          const token = localStorage.getItem('myfolio_token');
          if (token) {
            await authService.updateProfile({ wallpaper: newWallpaper });
          }
        }
      } catch (err) {
        console.warn('[Wallpaper] Impossible de sauvegarder la préférence en base:', err);
      }
    },
    [updateProfile, customWallpaperUrl]
  );

  const setCustomWallpaper = useCallback(
    async (dataUrl) => {
      try {
        localStorage.setItem(CUSTOM_IMG_KEY, dataUrl);
      } catch (e) {
        console.warn('[Wallpaper] Erreur sauvegarde image personnalisée:', e);
      }
      setCustomWallpaperUrl(dataUrl);
      await changeWallpaper('custom');
    },
    [changeWallpaper]
  );

  const removeCustomWallpaper = useCallback(async () => {
    try {
      localStorage.removeItem(CUSTOM_IMG_KEY);
    } catch {}
    setCustomWallpaperUrl(null);
    await changeWallpaper('default');
  }, [changeWallpaper]);

  return (
    <WallpaperContext.Provider
      value={{
        wallpaper,
        setWallpaper: changeWallpaper,
        ambiancePresets: AMBIANCE_PRESETS,
        imagePresets: IMAGE_PRESETS,
        presets: WALLPAPER_PRESETS,
        customWallpaperUrl,
        setCustomWallpaper,
        removeCustomWallpaper,
      }}
    >
      {children}
    </WallpaperContext.Provider>
  );
}

export function useWallpaper() {
  const context = useContext(WallpaperContext);
  if (!context) {
    throw new Error('useWallpaper must be used within a WallpaperProvider');
  }
  return context;
}
