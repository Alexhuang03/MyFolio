import React from 'react';
import { Edit3, Trash2, Utensils, Tag } from 'lucide-react';

export default function ProductCard({
  product,
  labels = [],
  subLabels = [],
  onEdit,
  onDelete,
}) {
  const labelMap = new Map(labels.map((l) => [l._id.toString(), l]));
  const subLabelMap = new Map(subLabels.map((s) => [s._id.toString(), s]));

  const assignedLabels = (product.labelIds || [])
    .map((id) => labelMap.get(id.toString()))
    .filter(Boolean);

  const assignedSubLabels = (product.subLabelIds || [])
    .map((id) => subLabelMap.get(id.toString()))
    .filter(Boolean);

  return (
    <div className="group relative bg-white rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden">
      {/* Product Image */}
      <div className="relative w-full h-40 bg-stone-100 overflow-hidden select-none">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}

        {/* Fallback image placeholder */}
        <div
          className={`w-full h-full flex flex-col items-center justify-center text-stone-300 bg-stone-50 ${
            product.image ? 'hidden' : 'flex'
          }`}
        >
          <Utensils className="w-8 h-8 stroke-1" />
          <span className="text-[10px] mt-1 text-stone-400">Sans illustration</span>
        </div>

        {/* Price tag badge */}
        {product.price !== null && product.price !== undefined && (
          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-stone-900/85 backdrop-blur-xs text-white rounded-lg text-xs font-mono font-semibold shadow-xs">
            {Number(product.price).toFixed(2)} €
          </div>
        )}

        {/* Floating action buttons on hover */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(product)}
            className="p-1.5 bg-white/90 hover:bg-white text-stone-700 rounded-lg shadow-sm backdrop-blur-xs transition-colors"
            title="Modifier le produit"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(product)}
            className="p-1.5 bg-white/90 hover:bg-rose-50 text-rose-600 rounded-lg shadow-sm backdrop-blur-xs transition-colors"
            title="Supprimer le produit"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-serif font-bold text-stone-900 text-sm leading-snug group-hover:text-amber-700 transition-colors">
            {product.name}
          </h4>
          {product.description && (
            <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Badges container */}
        <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap gap-1.5 items-center">
          {/* Labels badges */}
          {assignedLabels.map((lbl) => (
            <span
              key={lbl._id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border"
              style={{
                backgroundColor: `${lbl.color}12`,
                borderColor: `${lbl.color}40`,
                color: lbl.color,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lbl.color }} />
              <span>{lbl.name}</span>
            </span>
          ))}

          {/* SubLabels badges */}
          {assignedSubLabels.map((sub) => (
            <span
              key={sub._id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border"
              style={{
                backgroundColor: `${sub.color}12`,
                borderColor: `${sub.color}40`,
                color: sub.color,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sub.color }} />
              <span>{sub.name}</span>
            </span>
          ))}

          {assignedLabels.length === 0 && assignedSubLabels.length === 0 && (
            <span className="text-[10px] text-stone-400 italic">Aucun tag</span>
          )}
        </div>
      </div>
    </div>
  );
}
