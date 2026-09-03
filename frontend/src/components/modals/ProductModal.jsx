import React, { useState, useEffect } from 'react';
import { X, Plus, Upload, Image as ImageIcon, Check, DollarSign } from 'lucide-react';
import { api } from '../../services/api';

export default function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  labels = [],
  subLabels = [],
  initialProduct = null,
  defaultLabelId = null,
  defaultSubLabelId = null,
}) {
  const isEditing = Boolean(initialProduct);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState([]);
  const [selectedSubLabelIds, setSelectedSubLabelIds] = useState([]);

  const [imageType, setImageType] = useState('url'); // 'url' ou 'file'
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name || '');
      setDescription(initialProduct.description || '');
      setPrice(initialProduct.price !== null && initialProduct.price !== undefined ? initialProduct.price : '');
      setImage(initialProduct.image || '');
      setSelectedLabelIds(initialProduct.labelIds || []);
      setSelectedSubLabelIds(initialProduct.subLabelIds || []);
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setImage('');
      setSelectedLabelIds(defaultLabelId ? [defaultLabelId] : []);
      setSelectedSubLabelIds(defaultSubLabelId ? [defaultSubLabelId] : []);
    }
    setError('');
  }, [initialProduct, defaultLabelId, defaultSubLabelId, isOpen]);

  if (!isOpen) return null;

  const toggleLabel = (id) => {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSubLabel = (id) => {
    setSelectedSubLabelIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError('');
      const res = await api.uploadImage(file);
      setImage(res.url);
    } catch (err) {
      setError("Échec du téléversement de l'image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Le nom de l’élément est obligatoire');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        price: price !== '' ? parseFloat(price) : null,
        image: image.trim(),
        labelIds: selectedLabelIds,
        subLabelIds: selectedSubLabelIds,
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <div>
            <h3 className="text-lg font-serif font-bold text-stone-800">
              {isEditing ? 'Modifier le produit' : 'Ajouter un produit'}
            </h3>
            <p className="text-xs text-stone-500">
              Associez-le à un ou plusieurs labels et sous-labels
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Name & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Nom *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Sushi Burrito, Soupe à l'oignon..."
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Prix (€)
              </label>
              <input
                type="number"
                step="0.1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex: 14.50"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ingrédients, provenance, particularités..."
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm resize-none"
            />
          </div>

          {/* Image (URL ou Upload) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Illustration / Photo
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setImageType('url')}
                  className={`px-2 py-0.5 rounded ${imageType === 'url' ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  Lien URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageType('file')}
                  className={`px-2 py-0.5 rounded ${imageType === 'file' ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  Fichier local
                </button>
              </div>
            </div>

            {imageType === 'url' ? (
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
              />
            ) : (
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-stone-300 hover:border-stone-400 rounded-xl cursor-pointer bg-stone-50 hover:bg-stone-100/60 transition-all text-xs font-medium text-stone-600">
                  <Upload className="w-4 h-4 text-stone-500" />
                  <span>{uploading ? 'Téléversement...' : 'Sélectionner une photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            )}

            {image && (
              <div className="mt-2 flex items-center gap-3 p-2 bg-stone-50 rounded-xl border border-stone-200">
                <img
                  src={image}
                  alt="Aperçu"
                  className="w-12 h-12 object-cover rounded-lg shadow-sm"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <span className="text-xs text-stone-500 truncate flex-1">{image}</span>
                <button
                  type="button"
                  onClick={() => setImage('')}
                  className="p-1 text-stone-400 hover:text-rose-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Multi-Tagging : Labels (ex: Pays) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Labels (Multi-tagging)
              </label>
              <span className="text-[11px] text-stone-400">
                {selectedLabelIds.length} sélectionné(s)
              </span>
            </div>
            {labels.length === 0 ? (
              <p className="text-xs text-stone-400 italic">Aucun label créé pour le moment</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {labels.map((lbl) => {
                  const isChecked = selectedLabelIds.includes(lbl._id);
                  return (
                    <button
                      key={lbl._id}
                      type="button"
                      onClick={() => toggleLabel(lbl._id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                        isChecked
                          ? 'shadow-sm ring-1 ring-offset-1'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                      style={{
                        backgroundColor: isChecked ? `${lbl.color}15` : undefined,
                        borderColor: isChecked ? lbl.color : undefined,
                        color: isChecked ? lbl.color : undefined,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: lbl.color }}
                      />
                      <span>{lbl.name}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Multi-Tagging : Sous-labels (ex: Types de plat) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Sous-labels (ex: Type de plat)
              </label>
              <span className="text-[11px] text-stone-400">
                {selectedSubLabelIds.length} sélectionné(s)
              </span>
            </div>
            {subLabels.length === 0 ? (
              <p className="text-xs text-stone-400 italic">Aucun sous-label créé pour le moment</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subLabels.map((sub) => {
                  const isChecked = selectedSubLabelIds.includes(sub._id);
                  return (
                    <button
                      key={sub._id}
                      type="button"
                      onClick={() => toggleSubLabel(sub._id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                        isChecked
                          ? 'shadow-sm ring-1 ring-offset-1'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                      style={{
                        backgroundColor: isChecked ? `${sub.color}15` : undefined,
                        borderColor: isChecked ? sub.color : undefined,
                        color: isChecked ? sub.color : undefined,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: sub.color }}
                      />
                      <span>{sub.name}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="mt-1 text-[11px] text-stone-400">
              Si aucun sous-label n'est coché, l'élément apparaîtra dans la section "Général".
            </p>
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
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Ajouter au livre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
