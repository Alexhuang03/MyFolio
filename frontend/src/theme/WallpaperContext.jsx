import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

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

export function WallpaperProvider({ children }) {
  const { user, updateProfile } = useAuth();
  const userSyncedRef = useRef(false);

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

  // Sync with user's saved wallpaper in database once when user profile loads
  useEffect(() => {
    if (user?.wallpaper && !userSyncedRef.current) {
      userSyncedRef.current = true;
      setWallpaperState(user.wallpaper);
      try {
        localStorage.setItem(STORAGE_KEY, user.wallpaper);
      } catch {}
    }
  }, [user?.wallpaper]);

  // Apply class and custom CSS variables to body and documentElement
  useEffect(() => {
    const body = document.body;
    const root = document.documentElement;

    const allIds = [...WALLPAPER_PRESETS.map((p) => p.id), 'custom'];
    allIds.forEach((id) => {
      body.classList.remove(`wallpaper-${id}`);
      root.classList.remove(`wallpaper-${id}`);
    });

    if (wallpaper && wallpaper !== 'default') {
      body.classList.add(`wallpaper-${wallpaper}`);
      root.classList.add(`wallpaper-${wallpaper}`);
    }

    if (wallpaper === 'custom' && customWallpaperUrl) {
      root.style.setProperty('--custom-wallpaper-url', `url('${customWallpaperUrl}')`);
    } else {
      root.style.removeProperty('--custom-wallpaper-url');
    }

    try {
      localStorage.setItem(STORAGE_KEY, wallpaper);
    } catch {}
  }, [wallpaper, customWallpaperUrl]);

  const changeWallpaper = useCallback(
    async (newWallpaper) => {
      setWallpaperState(newWallpaper);
      try {
        localStorage.setItem(STORAGE_KEY, newWallpaper);
        if (user && updateProfile) {
          await updateProfile({ wallpaper: newWallpaper });
        }
      } catch (err) {
        console.warn('[Wallpaper] Could not save preference to backend:', err);
      }
    },
    [user, updateProfile]
  );

  const setCustomWallpaper = useCallback(
    async (dataUrl) => {
      try {
        localStorage.setItem(CUSTOM_IMG_KEY, dataUrl);
      } catch (e) {
        console.warn('[Wallpaper] LocalStorage save failed for custom image:', e);
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
