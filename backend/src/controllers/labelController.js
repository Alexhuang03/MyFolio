import Label from '../models/Label.js';
import Product from '../models/Product.js';
import Book from '../models/Book.js';
import { getBookAccess } from '../utils/permissionHelper.js';
import { emitToBook } from '../utils/socketEmitter.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Créer un label
export const createLabel = async (req, res) => {
  try {
    const { name, color, bookId } = req.body;
    if (!name || !name.trim() || !bookId) {
      return res.status(400).json({ message: 'Nom et bookId sont requis' });
    }

    // Vérifier l'accès au livre et les permissions
    const { hasAccess, book, role } = await getBookAccess(bookId, req.userId);
    if (!hasAccess || !book) {
      return res.status(404).json({ message: 'Livre introuvable ou accès non autorisé' });
    }
    if (role === 'viewer') {
      return res.status(403).json({ message: 'Action non autorisée en lecture seule' });
    }

    const trimmedName = name.trim();
    const existing = await Label.findOne({
      bookId,
      name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') },
    });

    if (existing) {
      return res.status(400).json({
        message: `Un label nommé "${trimmedName}" existe déjà dans ce livre. Les noms doivent être uniques.`,
      });
    }

    const label = await Label.create({
      name: trimmedName,
      color: color || '#6366f1',
      bookId,
    });

    // Émettre en temps réel
    emitToBook(bookId, 'label:created', label);

    res.status(201).json(label);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du label', error: error.message });
  }
};

// Modifier un label (nom, couleur)
export const updateLabel = async (req, res) => {
  try {
    const { name, color } = req.body;
    const label = await Label.findById(req.params.id);

    if (!label) {
      return res.status(404).json({ message: 'Label introuvable' });
    }

    // Vérifier l'accès au livre et les permissions
    const { hasAccess, book, role } = await getBookAccess(label.bookId, req.userId);
    if (!hasAccess || !book) {
      return res.status(404).json({ message: 'Livre introuvable ou accès non autorisé' });
    }
    if (role === 'viewer') {
      return res.status(403).json({ message: 'Action non autorisée en lecture seule' });
    }

    if (name && name.trim()) {
      const trimmedName = name.trim();
      const existing = await Label.findOne({
        _id: { $ne: req.params.id },
        bookId: label.bookId,
        name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') },
      });

      if (existing) {
        return res.status(400).json({
          message: `Un label nommé "${trimmedName}" existe déjà dans ce livre. Les noms doivent être uniques.`,
        });
      }
      label.name = trimmedName;
    }

    if (color) {
      label.color = color;
    }

    await label.save();

    // Émettre en temps réel
    emitToBook(label.bookId, 'label:updated', label);

    res.json(label);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du label', error: error.message });
  }
};

// Supprimer un label (avec suppression en cascade des produits associés)
export const deleteLabel = async (req, res) => {
  try {
    const labelId = req.params.id;
    const { mode } = req.query; // 'cascade' (défaut) ou 'detach'

    const label = await Label.findById(labelId);
    if (!label) {
      return res.status(404).json({ message: 'Label introuvable' });
    }

    // Vérifier l'accès au livre et les permissions
    const { hasAccess, book, role } = await getBookAccess(label.bookId, req.userId);
    if (!hasAccess || !book) {
      return res.status(404).json({ message: 'Livre introuvable ou accès non autorisé' });
    }
    if (role === 'viewer') {
      return res.status(403).json({ message: 'Action non autorisée en lecture seule' });
    }

    let deletedProductsCount = 0;
    const bookId = label.bookId;

    if (mode === 'detach') {
      await Product.updateMany(
        { labelIds: labelId },
        { $pull: { labelIds: labelId } }
      );
    } else {
      const deleteResult = await Product.deleteMany({ labelIds: labelId });
      deletedProductsCount = deleteResult.deletedCount;
    }

    await Label.findByIdAndDelete(labelId);

    // Émettre en temps réel
    emitToBook(bookId, 'label:deleted', {
      labelId,
      mode,
      deletedProductsCount,
    });

    res.json({
      message: 'Label supprimé avec succès',
      labelId,
      deletedProductsCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du label', error: error.message });
  }
};
