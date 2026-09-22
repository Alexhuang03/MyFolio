import React, { useState, useEffect } from 'react';
import {
  Library,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import ThemeToggle from '../settings/ThemeToggle';
import LanguageSwitcher from '../settings/LanguageSwitcher';
import LegalModal from './LegalModal';

export default function AuthScreen() {
  const { login, register, forgotPassword, resetPassword } = useAuth();
  const { t } = useLanguage();

  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [resetToken, setResetToken] = useState('');

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regTerms, setRegTerms] = useState(false);

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotFeedback, setForgotFeedback] = useState({ message: '', isSuccess: false });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetFeedback, setResetFeedback] = useState({ message: '', isSuccess: false });

  // UI helpers
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState('terms');

  // Check URL query for reset_token on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset_token');
    if (token) {
      setResetToken(token);
      setView('reset');
    }
  }, []);

  const clearErrors = () => {
    setErrorMsg('');
    setForgotFeedback({ message: '', isSuccess: false });
    setResetFeedback({ message: '', isSuccess: false });
  };

  const handleSwitchView = (newView) => {
    clearErrors();
    setShowPassword(false);
    setView(newView);
  };

  // Open Legal Modal with specific tab
  const openLegal = (tab) => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  // Helper to format errors (including network errors)
  const formatAuthError = (err, defaultMsg) => {
    if (err.message === 'NETWORK_ERROR' || err.name === 'TypeError' || err.message?.includes('fetch')) {
      return t('network_error');
    }
    return err.message || defaultMsg;
  };

  // --- SUBMIT HANDLERS ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    setIsSubmitting(true);

    try {
      await login(loginEmail.trim(), loginPassword);
    } catch (err) {
      setErrorMsg(formatAuthError(err, 'Identifiants incorrects'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    clearErrors();

    if (!regTerms) {
      setErrorMsg(t('terms_required') || 'Veuillez accepter les Conditions d\'Utilisation.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(regName.trim(), regEmail.trim(), regPassword, true);
    } catch (err) {
      setErrorMsg(formatAuthError(err, "Erreur lors de l'inscription"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    setIsSubmitting(true);

    try {
      const res = await forgotPassword(forgotEmail.trim());
      setForgotFeedback({
        message: res.message || 'Si cet e-mail existe, un lien vous a été envoyé.',
        isSuccess: true,
      });
      setForgotEmail('');
    } catch (err) {
      setForgotFeedback({
        message: formatAuthError(err, "Erreur lors de l'envoi du lien"),
        isSuccess: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    clearErrors();

    if (newPassword !== confirmPassword) {
      setErrorMsg(t('passwords_mismatch') || 'Les mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPassword(resetToken, newPassword);
      setResetFeedback({
        message: res.message || 'Mot de passe mis à jour avec succès.',
        isSuccess: true,
      });

      // Clear query from address bar and redirect to login after 2 seconds
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
        setView('login');
      }, 2000);
    } catch (err) {
      setResetFeedback({
        message: formatAuthError(err, 'Lien de réinitialisation invalide ou expiré.'),
        isSuccess: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      {/* Background Image Layer */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-no-repeat bg-bottom bg-contain sm:bg-cover transition-opacity duration-1000"
        style={{
          backgroundImage: "url('/img/accueil.jpg')",
        }}
      />

      {/* Readability Overlay Layer (Dark / Light) */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-stone-900/50 dark:bg-stone-950/75 backdrop-blur-[2px] transition-colors duration-500" />

      {/* Ambient Animated Blurred Glowing Orbs */}
      <div className="auth-floating-shapes fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
        <div className="shape shape-4" />
      </div>

      {/* Top Bar with Language and Theme Controls */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-2.5 bg-white/70 dark:bg-stone-900/70 backdrop-blur-md p-1.5 rounded-2xl border border-stone-200/60 dark:border-stone-800/60 shadow-lg">
        <LanguageSwitcher />
        <div className="w-[1px] h-4 bg-stone-300 dark:bg-stone-700" />
        <ThemeToggle />
      </div>

      {/* Main Glassmorphic Auth Card */}
      <div className="relative z-10 w-full max-w-[430px] my-auto">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-tr from-amber-600 to-amber-400 text-white shadow-xl shadow-amber-600/30 mb-3 transform hover:scale-105 transition-transform duration-300">
            <Library className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl tracking-tight text-stone-900 dark:text-white">
            {t('auth_title') || 'MyFolio'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1 font-medium">
            {t('auth_subtitle') || 'Organisez vos collections avec simplicité'}
          </p>
        </div>

        {/* Card Content */}
        <div className="bg-white/80 dark:bg-stone-900/85 backdrop-blur-xl border border-white/60 dark:border-stone-750/70 rounded-3xl shadow-2xl p-6 sm:p-8 transition-all duration-300">
          {/* Global Error Notice */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-2.5 text-rose-600 dark:text-rose-400 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ================= VIEW 1: LOGIN ================= */}
          {view === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
                {t('login_title')}
              </h2>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {t('email_label')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={t('email_placeholder')}
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-100/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    {t('password_label')}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSwitchView('forgot')}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
                  >
                    {t('forgot_password_link')}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={t('password_placeholder')}
                    className="w-full pl-10 pr-10 py-2.5 bg-stone-100/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-600/25 hover:shadow-lg hover:shadow-amber-600/35 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('logging_in')}</span>
                  </>
                ) : (
                  <span>{t('login_btn')}</span>
                )}
              </button>

              {/* Switch to Register */}
              <p className="text-center text-xs text-stone-500 dark:text-stone-400 pt-2">
                {t('no_account')}{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchView('register')}
                  className="text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                >
                  {t('show_register')}
                </button>
              </p>
            </form>
          )}

          {/* ================= VIEW 2: REGISTER ================= */}
          {view === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
                {t('register_title')}
              </h2>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {t('auth_name_label')}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={t('auth_name_placeholder')}
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-100/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {t('email_label')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder={t('email_placeholder')}
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-100/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {t('password_label')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder={t('register_password_placeholder')}
                    className="w-full pl-10 pr-10 py-2.5 bg-stone-100/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="register-terms"
                  required
                  checked={regTerms}
                  onChange={(e) => setRegTerms(e.target.checked)}
                  className="mt-1 rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="register-terms" className="text-xs text-stone-600 dark:text-stone-300 cursor-pointer leading-tight">
                  {t('terms_checkbox_label_1')}{' '}
                  <button
                    type="button"
                    onClick={() => openLegal('terms')}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                  >
                    {t('terms_link_text')}
                  </button>{' '}
                  {t('and_text')}{' '}
                  <button
                    type="button"
                    onClick={() => openLegal('privacy')}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                  >
                    {t('privacy_link_text')}
                  </button>
                  .
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-600/25 hover:shadow-lg hover:shadow-amber-600/35 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('registering')}</span>
                  </>
                ) : (
                  <span>{t('register_btn')}</span>
                )}
              </button>

              {/* Switch to Login */}
              <p className="text-center text-xs text-stone-500 dark:text-stone-400 pt-2">
                {t('has_account')}{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchView('login')}
                  className="text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                >
                  {t('show_login')}
                </button>
              </p>
            </form>
          )}

          {/* ================= VIEW 3: FORGOT PASSWORD ================= */}
          {view === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
                {t('forgot_title')}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                {t('forgot_desc')}
              </p>

              {forgotFeedback.message && (
                <div
                  className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs ${
                    forgotFeedback.isSuccess
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {forgotFeedback.isSuccess ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{forgotFeedback.message}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {t('email_label')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder={t('email_placeholder')}
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-100/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-600/25 hover:shadow-lg hover:shadow-amber-600/35 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('sending')}</span>
                  </>
                ) : (
                  <span>{t('send_link_btn')}</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSwitchView('login')}
                className="w-full text-center text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 flex items-center justify-center gap-1.5 pt-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('back_to_login')}</span>
              </button>
            </form>
          )}

          {/* ================= VIEW 4: RESET PASSWORD ================= */}
          {view === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
                {t('reset_title')}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                {t('reset_desc')}
              </p>

              {resetFeedback.message && (
                <div
                  className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs ${
                    resetFeedback.isSuccess
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {resetFeedback.isSuccess ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{resetFeedback.message}</span>
                </div>
              )}

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {t('new_password_label')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('register_password_placeholder')}
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-100/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {t('confirm_password_label')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('confirm_password_placeholder')}
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-100/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-600/25 hover:shadow-lg hover:shadow-amber-600/35 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('resetting')}</span>
                  </>
                ) : (
                  <span>{t('reset_btn')}</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSwitchView('login')}
                className="w-full text-center text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 flex items-center justify-center gap-1.5 pt-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('back_to_login')}</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer Links (GitHub + Legal) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 px-2">
          {/* GitHub Button */}
          <a
            href="https://github.com/Alexhuang03/MyFolio"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/70 dark:bg-stone-900/70 hover:bg-white dark:hover:bg-stone-800 backdrop-blur-md border border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-200 text-xs font-medium rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            <span>{t('view_on_github') || 'View on GitHub'}</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          {/* Legal Link */}
          <button
            type="button"
            onClick={() => openLegal('terms')}
            className="text-[11px] sm:text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 underline underline-offset-2 transition-colors"
          >
            {t('legal_and_terms')}
          </button>
        </div>
      </div>

      {/* Legal Modal Component */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />
    </div>
  );
}

