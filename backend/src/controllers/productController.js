import Product from '../models/Product.js';
import Book from '../models/Book.js';

// Créer un produit
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      image,
      price,
      location,
      date,
      rating,
      url,
      customValues,
      bookId,
      labelIds,
      subLabelIds,
    } = req.body;

    if (!name || !name.trim() || !bookId) {
      return res.status(400).json({ message: 'Le nom du produit et bookId sont requis' });
    }

    // Vérifier l'appartenance du livre à l'utilisateur connecté
    const book = await Book.findOne({ _id: bookId, userId: req.userId });
    if (!book) {
      return res.status(404).json({ message: 'Livre introuvable ou accès non autorisé' });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      image: image || '',
      price: price !== undefined && price !== '' && price !== null ? Number(price) : null,
      location: location ? location.trim() : '',
      date: date ? date.trim() : '',
      rating: rating !== undefined && rating !== '' && rating !== null ? Number(rating) : null,
      url: url ? url.trim() : '',
      customValues: customValues && typeof customValues === 'object' ? customValues : {},
      bookId,
      labelIds: Array.isArray(labelIds) ? labelIds : [],
      subLabelIds: Array.isArray(subLabelIds) ? subLabelIds : [],
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du produit', error: error.message });
  }
};

// Mettre à jour un produit
export const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      image,
      price,
      location,
      date,
      rating,
      url,
      customValues,
      labelIds,
      subLabelIds,
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    // Vérifier l'appartenance du livre à l'utilisateur connecté
    const book = await Book.findOne({ _id: product.bookId, userId: req.userId });
    if (!book) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const updateData = {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(image !== undefined && { image }),
      ...(price !== undefined && { price: price !== '' && price !== null ? Number(price) : null }),
      ...(location !== undefined && { location: location.trim() }),
      ...(date !== undefined && { date: date.trim() }),
      ...(rating !== undefined && { rating: rating !== '' && rating !== null ? Number(rating) : null }),
      ...(url !== undefined && { url: url.trim() }),
      ...(customValues !== undefined && { customValues }),
      ...(labelIds !== undefined && { labelIds: Array.isArray(labelIds) ? labelIds : [] }),
      ...(subLabelIds !== undefined && { subLabelIds: Array.isArray(subLabelIds) ? subLabelIds : [] }),
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du produit', error: error.message });
  }
};

// Supprimer un produit
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    // Vérifier l'appartenance du livre à l'utilisateur connecté
    const book = await Book.findOne({ _id: product.bookId, userId: req.userId });
    if (!book) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Produit supprimé avec succès', productId: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du produit', error: error.message });
  }
};

// Upload d'image pour un produit
export const uploadProductImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier fourni' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
};
