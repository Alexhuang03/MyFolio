import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Users,
  UserCheck,
  Crown,
  Trash2,
  Check,
  AlertCircle,
  Shield,
  Eye,
  Edit3,
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export default function ShareBookModal({ isOpen, onClose, book, onCollaboratorsUpdated }) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (book) {
      setCollaborators(book.collaborators || []);
      setError('');
      setSuccess('');
      setEmail('');
      setRole('viewer');
    }
  }, [book, isOpen]);

  if (!isOpen || !book) return null;

  const isOwner = book.isOwner !== undefined ? book.isOwner : (book.userId === user?._id || book.userId?._id === user?._id);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    if (user?.email && email.trim().toLowerCase() === user.email.toLowerCase()) {
      setError(t('cannot_share_self'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const res = await api.shareBook(book._id, {
        email: email.trim(),
        role,
      });

      setCollaborators(res.collaborators || []);
      setEmail('');
      setSuccess(t('book_shared_success'));

      if (onCollaboratorsUpdated) {
        onCollaboratorsUpdated(book._id, res.collaborators);
      }
    } catch (err) {
      setError(err.message || t('generic_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (collaboratorId, newRole) => {
    try {
      setUpdatingId(collaboratorId);
      setError('');
      setSuccess('');

      const res = await api.updateCollaboratorRole(book._id, collaboratorId, newRole);
      setCollaborators(res.collaborators || []);
      setSuccess(t('role_updated_success'));

      if (onCollaboratorsUpdated) {
        onCollaboratorsUpdated(book._id, res.collaborators);
      }
    } catch (err) {
      setError(err.message || t('generic_error'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (collab) => {
    const displayName = collab.name || collab.email;
    const confirmMsg = t('remove_collaborator_confirm', { name: displayName });
    if (!window.confirm(confirmMsg)) return;

    try {
      setUpdatingId(collab._id);
      setError('');
      setSuccess('');

      const res = await api.removeCollaborator(book._id, collab._id);
      setCollaborators(res.collaborators || []);
      setSuccess(t('collaborator_removed_success'));

      if (onCollaboratorsUpdated) {
        onCollaboratorsUpdated(book._id, res.collaborators);
      }
    } catch (err) {
      setError(err.message || t('generic_error'));
    } finally {
      setUpdatingId(null);
    }
  };

  const getInitials = (name, fallbackEmail) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length > 1) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    return (fallbackEmail || 'U').slice(0, 2).toUpperCase();
  };

  const ownerName = book.ownerInfo?.name || (isOwner ? (user?.name || 'Moi') : 'Propriétaire');
  const ownerEmail = book.ownerInfo?.email || (isOwner ? user?.email : '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 dark:border-stone-800 animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/70 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-white line-clamp-1">
                {t('share_modal_title', { title: book.title })}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {t('share_modal_desc')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Messages */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm text-red-700 dark:text-red-400 animate-fade-in">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 animate-fade-in">
              <Check className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Invite Form (only owner can invite) */}
          {isOwner ? (
            <form onSubmit={handleShare} className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {t('share_input_placeholder')}
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@exemple.com"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="px-3 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <option value="viewer">{t('role_viewer')}</option>
                    <option value="editor">{t('role_editor')}</option>
                  </select>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs sm:text-sm font-medium rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>{t('share_btn')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-400 flex items-center gap-2">
              <Shield className="w-4 h-4 text-stone-400 shrink-0" />
              <span>{t('readonly_banner')}</span>
            </div>
          )}

          {/* Collaborators list */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{t('collaborators_list_title')}</span>
              <span className="text-[11px] font-normal lowercase text-stone-400">
                ({1 + (collaborators?.length || 0)})
              </span>
            </h3>

            <div className="space-y-2">
              {/* Owner Item */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/60 dark:border-stone-800">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    {getInitials(ownerName, ownerEmail)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-stone-900 dark:text-white truncate flex items-center gap-1.5">
                      <span>{ownerName}</span>
                      {isOwner && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-medium">
                          Vous
                        </span>
                      )}
                    </p>
                    {ownerEmail && (
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                        {ownerEmail}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg font-medium shrink-0">
                  <Crown className="w-3 h-3" />
                  <span>{t('role_owner')}</span>
                </div>
              </div>

              {/* Collaborators */}
              {collaborators.map((collab) => {
                const isMe = user?.email && collab.email.toLowerCase() === user.email.toLowerCase();
                const isCollabUpdating = updatingId === collab._id;

                return (
                  <div
                    key={collab._id || collab.userId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 hover:border-stone-300 dark:hover:border-stone-600 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                        {getInitials(collab.name, collab.email)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-stone-900 dark:text-white truncate flex items-center gap-1.5">
                          <span>{collab.name || collab.email.split('@')[0]}</span>
                          {isMe && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-medium">
                              Vous
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                          {collab.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isOwner ? (
                        <>
                          <select
                            disabled={isCollabUpdating}
                            value={collab.role}
                            onChange={(e) => handleRoleChange(collab._id, e.target.value)}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                          >
                            <option value="viewer">{t('role_viewer')}</option>
                            <option value="editor">{t('role_editor')}</option>
                          </select>

                          <button
                            type="button"
                            disabled={isCollabUpdating}
                            onClick={() => handleRemove(collab)}
                            title={t('remove_collaborator')}
                            className="p-1.5 text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center gap-1">
                          {collab.role === 'editor' ? (
                            <>
                              <Edit3 className="w-3 h-3 text-blue-500" />
                              <span>{t('role_editor')}</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 text-stone-400" />
                              <span>{t('role_viewer')}</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-xl transition-colors"
          >
            {t('terms_btn_close')}
          </button>
        </div>
      </div>
    </div>
  );
}
