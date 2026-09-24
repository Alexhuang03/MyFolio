import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const WallpaperContext = createContext();

const STORAGE_KEY = 'myfolio-wallpaper';

export const WALLPAPER_PRESETS = [
  {
    id: 'default',
    nameKey: 'wallpaper_default',
    previewColor: '#f5f5f4',
    darkPreviewColor: '#0c0a09',
    descriptionKey: 'wallpaper_default_desc',
  },
  {
    id: 'wood',
    nameKey: 'wallpaper_wood',
    previewColor: '#b45309',
    darkPreviewColor: '#451a03',
    descriptionKey: 'wallpaper_wood_desc',
  },
  {
    id: 'paper',
    nameKey: 'wallpaper_paper',
    previewColor: '#fef3c7',
    darkPreviewColor: '#292524',
    descriptionKey: 'wallpaper_paper_desc',
  },
  {
    id: 'cosmos',
    nameKey: 'wallpaper_cosmos',
    previewColor: '#312e81',
    darkPreviewColor: '#0f172a',
    descriptionKey: 'wallpaper_cosmos_desc',
  },
  {
    id: 'slate',
    nameKey: 'wallpaper_slate',
    previewColor: '#475569',
    darkPreviewColor: '#0f172a',
    descriptionKey: 'wallpaper_slate_desc',
  },
  {
    id: 'emerald',
    nameKey: 'wallpaper_emerald',
    previewColor: '#6ee7b7',
    darkPreviewColor: '#064e3b',
    descriptionKey: 'wallpaper_emerald_desc',
  },
];

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

  // Apply class to body and documentElement
  useEffect(() => {
    const body = document.body;
    const root = document.documentElement;
    WALLPAPER_PRESETS.forEach((p) => {
      body.classList.remove(`wallpaper-${p.id}`);
      root.classList.remove(`wallpaper-${p.id}`);
    });
    if (wallpaper && wallpaper !== 'default') {
      body.classList.add(`wallpaper-${wallpaper}`);
      root.classList.add(`wallpaper-${wallpaper}`);
    }
    try {
      localStorage.setItem(STORAGE_KEY, wallpaper);
    } catch {}
  }, [wallpaper]);

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

  return (
    <WallpaperContext.Provider
      value={{
        wallpaper,
        setWallpaper: changeWallpaper,
        presets: WALLPAPER_PRESETS,
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
