import Book from '../models/Book.js';
import Label from '../models/Label.js';
import SubLabel from '../models/SubLabel.js';
import Product from '../models/Product.js';

// Récupérer tous les livres de l'utilisateur connecté
export const getBooks = async (req, res) => {
  try {
    const books = await Book.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des livres', error: error.message });
  }
};

// Récupérer un livre par ID pour l'utilisateur connecté
export const getBookById = async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, userId: req.userId });
    if (!book) {
      return res.status(404).json({ message: 'Livre introuvable' });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Créer un nouveau livre rattaché à l'utilisateur connecté
export const createBook = async (req, res) => {
  try {
    const { title, description, coverImage, colorTheme, isFavorite, fieldsConfig } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Le titre est obligatoire' });
    }

    const book = await Book.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      coverImage: coverImage || 'cover-classic.svg',
      colorTheme: colorTheme || '#3b82f6',
      isFavorite: Boolean(isFavorite),
      fieldsConfig: fieldsConfig || undefined,
      userId: req.userId,
    });

    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du livre', error: error.message });
  }
};

// Modifier un livre de l'utilisateur connecté
export const updateBook = async (req, res) => {
  try {
    const { title, description, coverImage, colorTheme, isFavorite, fieldsConfig } = req.body;
    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(coverImage && { coverImage }),
        ...(colorTheme && { colorTheme }),
        ...(isFavorite !== undefined && { isFavorite: Boolean(isFavorite) }),
        ...(fieldsConfig !== undefined && { fieldsConfig }),
      },
      { new: true, runValidators: true }
    );

    if (!book) {
      return res.status(404).json({ message: 'Livre introuvable' });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du livre', error: error.message });
  }
};

// Supprimer un livre et toutes ses données associées (cascade totale)
export const deleteBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    const book = await Book.findOneAndDelete({ _id: bookId, userId: req.userId });
    if (!book) {
      return res.status(404).json({ message: 'Livre introuvable' });
    }

    // Cascade: suppression des labels, sous-labels et produits
    await Label.deleteMany({ bookId });
    await SubLabel.deleteMany({ bookId });
    await Product.deleteMany({ bookId });

    res.json({ message: 'Livre et ensemble de son contenu supprimés avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du livre', error: error.message });
  }
};

// Route "Mega-Fetch" (GET /api/books/:id/content)
// Renvoie tout le contenu d'un livre d'un coup (Livre, Labels, Sous-labels, Produits)
export const getBookContent = async (req, res) => {
  try {
    const bookId = req.params.id;
    const book = await Book.findOne({ _id: bookId, userId: req.userId });

    if (!book) {
      return res.status(404).json({ message: 'Livre introuvable' });
    }

    const [labels, subLabels, products] = await Promise.all([
      Label.find({ bookId }).sort({ createdAt: 1 }),
      SubLabel.find({ bookId }).sort({ createdAt: 1 }),
      Product.find({ bookId }).sort({ createdAt: -1 }),
    ]);

    res.json({
      book,
      labels,
      subLabels,
      products,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du contenu du livre', error: error.message });
  }
};
