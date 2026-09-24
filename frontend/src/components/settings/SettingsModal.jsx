import React, { useState, useRef } from 'react';
import {
  X,
  User,
  Shield,
  Palette,
  Globe,
  Mail,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Check,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
  Upload,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useWallpaper, compressImage } from '../../theme/WallpaperContext';

export default function SettingsModal({ isOpen, onClose }) {
  const { user, updateProfile, changePassword } = useAuth();
  const { t, lang, switchLanguage } = useLanguage();
  const {
    wallpaper,
    setWallpaper,
    ambiancePresets,
    imagePresets,
    customWallpaperUrl,
    setCustomWallpaper,
    removeCustomWallpaper,
  } = useWallpaper();

  const [activeTab, setActiveTab] = useState('account');
  const [wallpaperCategory, setWallpaperCategory] = useState(() =>
    wallpaper === 'fond' || wallpaper === 'custom' ? 'image' : 'ambiance'
  );
  const fileInputRef = useRef(null);

  // Account Tab State
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameError, setNameError] = useState('');

  // Security Tab State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  if (!isOpen) return null;

  // Format creation date
  const memberSinceFormatted = user?.createdAt
    ? new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-US' : 'fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(user.createdAt))
    : null;

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSavingName(true);
      setNameError('');
      setNameSuccess('');
      await updateProfile({ name: name.trim() });
      setNameSuccess(t('account_name_updated'));
      setTimeout(() => setNameSuccess(''), 3000);
    } catch (err) {
      setNameError(err.message || t('generic_error'));
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError(t('current_password_required'));
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError(t('password_too_short'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('passwords_dont_match'));
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword({ currentPassword, newPassword });
      setPasswordSuccess(t('password_updated_success'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      setPasswordError(err.message || t('generic_error'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCustomImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    try {
      const dataUrl = await compressImage(file, 1920, 1080, 0.82);
      if (dataUrl) {
        setCustomWallpaper(dataUrl);
      }
    } catch (err) {
      console.warn('[Settings] Failed to compress image, using raw dataUrl fallback:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result;
        if (dataUrl) {
          setCustomWallpaper(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'account', label: t('tab_account'), icon: User },
    { id: 'security', label: t('tab_security'), icon: Shield },
    { id: 'wallpaper', label: t('tab_wallpaper'), icon: Palette },
    { id: 'language', label: t('tab_language'), icon: Globe },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-2xl w-full h-[580px] sm:h-[620px] max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 dark:border-stone-800 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/70 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-stone-800 dark:text-stone-100">
                {t('settings_modal_title')}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {t('settings_modal_desc')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-stone-200/80 dark:border-stone-800 px-4 sm:px-6 bg-stone-50/30 dark:bg-stone-900/30 overflow-x-auto gap-1.5 sm:gap-2 py-2 flex-shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* TAB 1: ACCOUNT & PROFILE */}
          {activeTab === 'account' && (
            <div className="space-y-6 animate-fade-in">
              {/* User Identity Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white font-serif font-bold text-2xl shadow-sm">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-base truncate">
                    {user?.name}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mt-0.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>{user?.email}</span>
                  </p>
                  {memberSinceFormatted && (
                    <p className="text-[11px] text-stone-400 dark:text-stone-500 flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>{t('member_since')} {memberSinceFormatted}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Form: Name Update */}
              <form onSubmit={handleUpdateName} className="space-y-4">
                {nameSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>{nameSuccess}</span>
                  </div>
                )}
                {nameError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                    <span>{nameError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    {t('account_name')}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    {t('account_email')}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-stone-100 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800 rounded-xl text-stone-500 dark:text-stone-400 text-sm cursor-not-allowed select-none"
                    />
                    <Lock className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingName || name.trim() === user?.name}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {savingName ? t('saving') : t('save_changes')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: SECURITY (CHANGE PASSWORD) */}
          {activeTab === 'security' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="text-sm font-serif font-bold text-stone-800 dark:text-stone-100">
                  {t('change_password_title')}
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {t('change_password_desc')}
                </p>
              </div>

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    {t('current_password_label')}
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t('current_password_placeholder')}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                      {t('new_password_label')}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t('new_password_placeholder')}
                        className="w-full pl-3.5 pr-10 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                      {t('confirm_new_password_label')}
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('confirm_new_password_placeholder')}
                      className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                  >
                    {passwordLoading ? t('updating_password') : t('update_password_btn')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: WALLPAPER (FOND D'ECRAN & AMBIANCE) */}
          {activeTab === 'wallpaper' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h4 className="text-sm font-serif font-bold text-stone-800 dark:text-stone-100">
                  {t('wallpaper_section_title')}
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {t('wallpaper_section_desc')}
                </p>
              </div>

              {/* Segmented switch between Fond d'écran and Ambiance across full width */}
              <div className="flex items-center gap-1.5 p-1 bg-stone-200/80 dark:bg-stone-950 rounded-2xl border border-stone-300/70 dark:border-stone-800 w-full transition-colors">
                <button
                  type="button"
                  onClick={() => setWallpaperCategory('image')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    wallpaperCategory === 'image'
                      ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm border border-stone-300/50 dark:border-stone-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-900/50 border border-transparent'
                  }`}
                >
                  <ImageIcon className={`w-4 h-4 transition-colors ${wallpaperCategory === 'image' ? 'text-amber-600 dark:text-amber-400' : 'text-stone-500 dark:text-stone-400'}`} />
                  <span>{t('wallpaper_section_wallpapers')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWallpaperCategory('ambiance')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    wallpaperCategory === 'ambiance'
                      ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm border border-stone-300/50 dark:border-stone-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-900/50 border border-transparent'
                  }`}
                >
                  <Palette className={`w-4 h-4 transition-colors ${wallpaperCategory === 'ambiance' ? 'text-amber-600 dark:text-amber-400' : 'text-stone-500 dark:text-stone-400'}`} />
                  <span>{t('wallpaper_section_ambiances')}</span>
                </button>
              </div>

              {/* SECTION 1: FONDS D'ÉCRAN (IMAGES & ILLUSTRATIONS) */}
              {wallpaperCategory === 'image' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                      <ImageIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-stone-800 dark:text-stone-100 uppercase tracking-wider">
                        {t('wallpaper_section_wallpapers')}
                      </h5>
                    </div>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {t('wallpaper_section_wallpapers_desc')}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Presets d'images réelles (ex: fond.jpeg) */}
                    {imagePresets.map((p) => {
                      const isSelected = wallpaper === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setWallpaper(p.id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3.5 relative cursor-pointer group ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 ring-2 ring-amber-500/20 shadow-xs'
                              : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 hover:border-stone-300 dark:hover:border-stone-600'
                          }`}
                        >
                          {/* Miniature de l'illustration */}
                          <div className="w-14 h-14 rounded-xl shadow-xs border border-stone-200 dark:border-stone-700 flex-shrink-0 relative overflow-hidden bg-white dark:bg-stone-900 flex items-center justify-center p-1">
                            <img
                              src={p.previewImage}
                              alt=""
                              className="w-full h-full object-contain dark:invert dark:hue-rotate-180 transition-transform group-hover:scale-105"
                            />
                          </div>

                          <div className="flex-1 min-w-0 pr-6">
                            <span className="text-xs font-bold text-stone-800 dark:text-stone-100 block">
                              {t(p.nameKey)}
                            </span>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug">
                              {t(p.descriptionKey)}
                            </p>
                          </div>

                          {isSelected && (
                            <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}

                    {/* Carte Importer une image (style Google Chrome "Importer depuis l'appareil") */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3.5 relative cursor-pointer group ${
                        wallpaper === 'custom'
                          ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/30 hover:border-amber-500/60 dark:hover:border-amber-500/60'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCustomImageUpload}
                        className="hidden"
                      />

                      <div className="w-14 h-14 rounded-xl shadow-xs border border-stone-200 dark:border-stone-700 flex-shrink-0 relative overflow-hidden bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                        {customWallpaperUrl ? (
                          <img
                            src={customWallpaperUrl}
                            alt=""
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <Upload className="w-5 h-5 text-stone-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-100 block">
                          {t('wallpaper_custom')}
                        </span>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug">
                          {customWallpaperUrl ? t('wallpaper_custom_change') : t('wallpaper_custom_desc')}
                        </p>

                        {customWallpaperUrl && (
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                              }}
                              className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                            >
                              {t('wallpaper_custom_change')}
                            </button>
                            <span className="text-stone-300 dark:text-stone-700">•</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCustomWallpaper();
                              }}
                              className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{t('wallpaper_custom_remove')}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {wallpaper === 'custom' && (
                        <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: AMBIANCE (COULEURS, MATIÈRES & DÉGRADÉS) */}
              {wallpaperCategory === 'ambiance' && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                      <Palette className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-stone-800 dark:text-stone-100 uppercase tracking-wider">
                        {t('wallpaper_section_ambiances')}
                      </h5>
                    </div>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {t('wallpaper_section_ambiances_desc')}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {ambiancePresets.map((p) => {
                      const isSelected = wallpaper === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setWallpaper(p.id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 relative cursor-pointer ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 ring-2 ring-amber-500/20 shadow-xs'
                              : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 hover:border-stone-300 dark:hover:border-stone-600'
                          }`}
                        >
                          {/* Pastille double aperçu clair / sombre */}
                          <div
                            className="w-12 h-12 rounded-xl shadow-xs border border-black/10 flex-shrink-0 flex items-center justify-center relative overflow-hidden"
                            style={{
                              backgroundColor: p.previewColor,
                            }}
                          >
                            <div
                              className="w-1/2 h-full absolute right-0 top-0 shadow-inner"
                              style={{ backgroundColor: p.darkPreviewColor }}
                            />
                          </div>

                          <div className="flex-1 min-w-0 pr-6">
                            <span className="text-xs font-bold text-stone-800 dark:text-stone-100 block">
                              {t(p.nameKey)}
                            </span>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug">
                              {t(p.descriptionKey)}
                            </p>
                          </div>

                          {isSelected && (
                            <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LANGUAGE (LANGUE) */}
          {activeTab === 'language' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h4 className="text-sm font-serif font-bold text-stone-800 dark:text-stone-100">
                  {t('language_section_title')}
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {t('language_section_desc')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {[
                  { code: 'fr', label: 'Français', flag: '🇫🇷' },
                  { code: 'en', label: 'English', flag: '🇬🇧' },
                  { code: 'zh', label: '中文 (Chinois)', flag: '🇨🇳' },
                ].map((item) => {
                  const isSelected = lang === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={async () => {
                        switchLanguage(item.code);
                        if (user && updateProfile) {
                           try {
                            await updateProfile({ language: item.code });
                          } catch (_) {}
                        }
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col items-center justify-center text-center gap-2 relative ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 hover:border-stone-300 dark:hover:border-stone-600'
                      }`}
                    >
                      <span className="text-3xl select-none">{item.flag}</span>
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-100">
                        {item.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end bg-stone-50/50 dark:bg-stone-900/50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
