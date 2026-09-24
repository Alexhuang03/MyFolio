import SubLabel from '../models/SubLabel.js';
import Product from '../models/Product.js';
import Book from '../models/Book.js';
import { getBookAccess } from '../utils/permissionHelper.js';
import { emitToBook } from '../utils/socketEmitter.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Créer un sous-label
export const createSubLabel = async (req, res) => {
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
    const existing = await SubLabel.findOne({
      bookId,
      name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') },
    });

    if (existing) {
      return res.status(400).json({
        message: `Un sous-label nommé "${trimmedName}" existe déjà dans ce livre. Les noms doivent être uniques.`,
      });
    }

    const subLabel = await SubLabel.create({
      name: trimmedName,
      color: color || '#10b981',
      bookId,
    });

    // Émettre en temps réel
    emitToBook(bookId, 'sublabel:created', subLabel);

    res.status(201).json(subLabel);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du sous-label', error: error.message });
  }
};

// Modifier un sous-label (nom, couleur)
export const updateSubLabel = async (req, res) => {
  try {
    const { name, color } = req.body;
    const subLabel = await SubLabel.findById(req.params.id);

    if (!subLabel) {
      return res.status(404).json({ message: 'Sous-label introuvable' });
    }

    // Vérifier l'accès au livre et les permissions
    const { hasAccess, book, role } = await getBookAccess(subLabel.bookId, req.userId);
    if (!hasAccess || !book) {
      return res.status(404).json({ message: 'Livre introuvable ou accès non autorisé' });
    }
    if (role === 'viewer') {
      return res.status(403).json({ message: 'Action non autorisée en lecture seule' });
    }

    if (name && name.trim()) {
      const trimmedName = name.trim();
      const existing = await SubLabel.findOne({
        _id: { $ne: req.params.id },
        bookId: subLabel.bookId,
        name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') },
      });

      if (existing) {
        return res.status(400).json({
          message: `Un sous-label nommé "${trimmedName}" existe déjà dans ce livre. Les noms doivent être uniques.`,
        });
      }
      subLabel.name = trimmedName;
    }

    if (color) {
      subLabel.color = color;
    }

    await subLabel.save();

    // Émettre en temps réel
    emitToBook(subLabel.bookId, 'sublabel:updated', subLabel);

    res.json(subLabel);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du sous-label', error: error.message });
  }
};

// Supprimer un sous-label (avec suppression en cascade des produits associés)
export const deleteSubLabel = async (req, res) => {
  try {
    const subLabelId = req.params.id;
    const { mode } = req.query; // 'cascade' (défaut) ou 'detach'

    const subLabel = await SubLabel.findById(subLabelId);
    if (!subLabel) {
      return res.status(404).json({ message: 'Sous-label introuvable' });
    }

    // Vérifier l'accès au livre et les permissions
    const { hasAccess, book, role } = await getBookAccess(subLabel.bookId, req.userId);
    if (!hasAccess || !book) {
      return res.status(404).json({ message: 'Livre introuvable ou accès non autorisé' });
    }
    if (role === 'viewer') {
      return res.status(403).json({ message: 'Action non autorisée en lecture seule' });
    }

    let deletedProductsCount = 0;
    const bookId = subLabel.bookId;

    if (mode === 'detach') {
      await Product.updateMany(
        { subLabelIds: subLabelId },
        { $pull: { subLabelIds: subLabelId } }
      );
    } else {
      const deleteResult = await Product.deleteMany({ subLabelIds: subLabelId });
      deletedProductsCount = deleteResult.deletedCount;
    }

    await SubLabel.findByIdAndDelete(subLabelId);

    // Émettre en temps réel
    emitToBook(bookId, 'sublabel:deleted', {
      subLabelId,
      mode,
      deletedProductsCount,
    });

    res.json({
      message: 'Sous-label supprimé avec succès',
      subLabelId,
      deletedProductsCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du sous-label', error: error.message });
  }
};
