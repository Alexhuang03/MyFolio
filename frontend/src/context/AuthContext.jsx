import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('myfolio_token') || null);
  const [loading, setLoading] = useState(true);

  // Vérifier la session au démarrage
  useEffect(() => {
    async function checkAuth() {
      const storedToken = localStorage.getItem('myfolio_token');
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const userData = await authService.getMe();
        setUser(userData);
      } catch (err) {
        console.warn('[AuthContext] Session invalide ou expirée:', err.message);
        localStorage.removeItem('myfolio_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authService.login({ email, password });
    localStorage.setItem('myfolio_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password, termsAccepted, hp_website = '') => {
    const data = await authService.register({ name, email, password, termsAccepted, hp_website });
    if (data.token) {
      localStorage.setItem('myfolio_token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }, []);

  const verifyEmail = useCallback(async (verifyToken) => {
    const data = await authService.verifyEmail(verifyToken);
    if (data.token) {
      localStorage.setItem('myfolio_token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }, []);

  const verifyCode = useCallback(async (email, code) => {
    const data = await authService.verifyCode(email, code);
    if (data.token) {
      localStorage.setItem('myfolio_token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }, []);

  const resendVerification = useCallback(async (email) => {
    return await authService.resendVerification(email);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    localStorage.removeItem('myfolio_token');
    setToken(null);
    setUser(null);
  }, []);

  const forgotPassword = useCallback(async (email) => {
    return await authService.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (resetToken, password) => {
    return await authService.resetPassword(resetToken, password);
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    const data = await authService.updateProfile(profileData);
    if (data.user) {
      setUser(data.user);
    }
    return data;
  }, []);

  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    return await authService.changePassword({ currentPassword, newPassword });
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    verifyEmail,
    verifyCode,
    resendVerification,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

