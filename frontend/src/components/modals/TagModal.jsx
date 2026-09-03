import React, { useState } from 'react';
import { X, Tag, Check } from 'lucide-react';

const TAG_COLORS = [
  '#3b82f6', // Bleu
  '#ef4444', // Rouge
  '#10b981', // Vert
  '#f59e0b', // Jaune ambré
  '#8b5cf6', // Violet
  '#ec4899', // Rose
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#64748b', // Ardoise
];

export default function TagModal({
  isOpen,
  onClose,
  onSubmit,
  tagType = 'label', // 'label' ou 'sublabel'
  initialTag = null,
  existingTags = [],
}) {
  const isEditing = Boolean(initialTag);
  const isLabel = tagType === 'label';

  const [name, setName] = useState(initialTag ? initialTag.name : '');
  const [color, setColor] = useState(
    initialTag ? initialTag.color || '#3b82f6' : isLabel ? '#3b82f6' : '#10b981'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Veuillez spécifier un nom');
      return;
    }

    // Vérification d'unicité côté client
    const isDuplicate = existingTags.some(
      (t) =>
        (!initialTag || t._id !== initialTag._id) &&
        t.name &&
        t.name.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setError(`Un ${isLabel ? 'label' : 'sous-label'} nommé "${trimmed}" existe déjà dans ce livre. Les noms doivent être uniques.`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit({
        name: trimmed,
        color,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: color }}
            >
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-stone-800">
                {isEditing
                  ? `Modifier le ${isLabel ? 'Label' : 'Sous-label'}`
                  : `Nouveau ${isLabel ? 'Label' : 'Sous-label'}`}
              </h3>
              <p className="text-xs text-stone-500">
                {isLabel ? 'Ex: Genre, Univers, Marque, Origine...' : 'Ex: Format, Plateforme, Statut, Rareté...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Nom du {isLabel ? 'label' : 'sous-label'} *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isLabel ? 'Ex: Science-Fiction, Nintendo, Vintage, Manga...' : 'Ex: Terminé, En cours, Coup de cœur, Collector...'}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Couleur associée
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center shadow-sm ${
                    color === c ? 'scale-110 ring-2 ring-offset-2 ring-stone-600' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
              <div className="relative flex items-center">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-7 h-7 rounded-full border-0 p-0 cursor-pointer"
                  title="Couleur sur-mesure"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
