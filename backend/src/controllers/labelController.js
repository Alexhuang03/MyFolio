import Label from '../models/Label.js';
import Product from '../models/Product.js';

// Créer un label
export const createLabel = async (req, res) => {
  try {
    const { name, color, bookId } = req.body;
    if (!name || !name.trim() || !bookId) {
      return res.status(400).json({ message: 'Nom et bookId sont requis' });
    }

    const label = await Label.create({
      name: name.trim(),
      color: color || '#6366f1',
      bookId,
    });

    res.status(201).json(label);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du label', error: error.message });
  }
};

// Modifier un label (nom, couleur)
export const updateLabel = async (req, res) => {
  try {
    const { name, color } = req.body;
    const label = await Label.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name: name.trim() }),
        ...(color && { color }),
      },
      { new: true, runValidators: true }
    );

    if (!label) {
      return res.status(404).json({ message: 'Label introuvable' });
    }

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

    let deletedProductsCount = 0;

    if (mode === 'detach') {
      // Retirer le label des produits sans les supprimer s'ils ont d'autres labels
      await Product.updateMany(
        { labelIds: labelId },
        { $pull: { labelIds: labelId } }
      );
    } else {
      // Suppression en cascade stricte selon la spécification
      const deleteResult = await Product.deleteMany({ labelIds: labelId });
      deletedProductsCount = deleteResult.deletedCount;
    }

    await Label.findByIdAndDelete(labelId);

    res.json({
      message: 'Label supprimé avec succès',
      labelId,
      deletedProductsCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du label', error: error.message });
  }
};
