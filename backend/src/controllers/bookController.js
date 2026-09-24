import Book from '../models/Book.js';
import User from '../models/User.js';
import Label from '../models/Label.js';
import SubLabel from '../models/SubLabel.js';
import Product from '../models/Product.js';
import { getBookAccess } from '../utils/permissionHelper.js';

// Récupérer tous les livres accessibles par l'utilisateur connecté (créés ou partagés)
export const getBooks = async (req, res) => {
  try {
    const userIdStr = req.userId.toString();
    const books = await Book.find({
      $or: [{ userId: req.userId }, { 'collaborators.userId': req.userId }],
    })
      .populate('userId', 'name email')
      .sort({ updatedAt: -1 });

    const formattedBooks = books.map((book) => {
      const bookObj = book.toObject();
      const isOwner = book.userId?._id
        ? book.userId._id.toString() === userIdStr
        : book.userId?.toString() === userIdStr;

      const myCollaborator = !isOwner
        ? book.collaborators?.find((c) => c.userId && c.userId.toString() === userIdStr)
        : null;

      const myRole = isOwner ? 'owner' : (myCollaborator?.role || 'viewer');
      const collaboratorsCount = book.collaborators?.length || 0;

      return {
        ...bookObj,
        userId: book.userId?._id || book.userId,
        ownerInfo: book.userId?._id ? { name: book.userId.name, email: book.userId.email } : null,
        isOwner,
        myRole,
        collaboratorsCount,
      };
    });

    res.json(formattedBooks);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des livres', error: error.message });
  }
};

// Récupérer un livre par ID si l'utilisateur y a accès
export const getBookById = async (req, res) => {
  try {
    const { hasAccess, book, role, isOwner } = await getBookAccess(req.params.id, req.userId);
    if (!hasAccess || !book) {
      return res.status(404).json({ message: 'Livre introuvable ou accès non autorisé' });
    }

    const ownerUser = await User.findById(book.userId).select('name email');
    const bookObj = book.toObject();

    res.json({
      ...bookObj,
      isOwner,
      myRole: role,
      collaboratorsCount: book.collaborators?.length || 0,
      ownerInfo: ownerUser ? { name: ownerUser.name, email: ownerUser.email } : null,
    });
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
      collaborators: [],
    });

    const bookObj = book.toObject();
    res.status(201).json({
      ...bookObj,
      isOwner: true,
      myRole: 'owner',
      collaboratorsCount: 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du livre', error: error.message });
  }
};

// Modifier un livre (propriétaire ou éditeur)
export const updateBook = async (req, res) => {
  try {
    const { hasAccess, book, role, isOwner } = await getBookAccess(req.params.id, req.userId);
    if (!hasAccess || !book) {
      return res.status(404).json({ message: 'Livre introuvable' });
    }

    if (role === 'viewer') {
      return res.status(403).json({ message: 'Action non autorisée en lecture seule' });
    }

    const { title, description, coverImage, colorTheme, isFavorite, fieldsConfig } = req.body;

    if (title && title.trim()) book.title = title.trim();
    if (description !== undefined) book.description = description.trim();
    if (coverImage) book.coverImage = coverImage;
    if (colorTheme) book.colorTheme = colorTheme;
    if (isFavorite !== undefined) book.isFavorite = Boolean(isFavorite);
    if (fieldsConfig !== undefined) book.fieldsConfig = fieldsConfig;

    await book.save();

    const bookObj = book.toObject();
    res.json({
      ...bookObj,
      isOwner,
      myRole: role,
      collaboratorsCount: book.collaborators?.length || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du livre', error: error.message });
  }
};

// Supprimer un livre (propriétaire) ou quitter un livre (collaborateur)
export const deleteBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    const { hasAccess, book, isOwner } = await getBookAccess(bookId, req.userId);

    if (!hasAccess || !book) {
      return res.status(404).json({ message: 'Livre introuvable' });
    }

    if (isOwner) {
      // Le propriétaire supprime le livre et l'ensemble de son contenu en cascade
      await Book.findByIdAndDelete(bookId);
      await Label.deleteMany({ bookId });
      await SubLabel.deleteMany({ bookId });
      await Product.deleteMany({ bookId });

      return res.json({
        message: 'Livre et ensemble de son contenu supprimés avec succès',
        leftBook: false,
        bookId,
      });
    }

    // Collaborateur : quitter le livre partagé
    book.collaborators = book.collaborators.filter(
      (c) => c.userId && c.userId.toString() !== req.userId.toString()
    );
    await book.save();

    return res.json({
      message: 'Vous avez quitté ce livre avec succès',
      leftBook: true,
      bookId,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du livre', error: error.message });
  }
};

// Route "Mega-Fetch" (GET /api/books/:id/content)
// Renvoie tout le contenu d'un livre d'un coup (Livre, Labels, Sous-labels, Produits)
export const getBookContent = async (req, res) => {
  try {
    const bookId = req.params.id;
    const { hasAccess, book, role, isOwner } = await getBookAccess(bookId, req.userId);

    if (!hasAccess || !book) {
      return res.status(404).json({ message: 'Livre introuvable ou accès non autorisé' });
    }

    const [labels, subLabels, products, ownerUser] = await Promise.all([
      Label.find({ bookId }).sort({ createdAt: 1 }),
      SubLabel.find({ bookId }).sort({ createdAt: 1 }),
      Product.find({ bookId }).sort({ createdAt: -1 }),
      User.findById(book.userId).select('name email'),
    ]);

    const bookObj = book.toObject();
    const enrichedBook = {
      ...bookObj,
      isOwner,
      myRole: role,
      collaboratorsCount: book.collaborators?.length || 0,
      ownerInfo: ownerUser ? { name: ownerUser.name, email: ownerUser.email } : null,
    };

    res.json({
      book: enrichedBook,
      labels,
      subLabels,
      products,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du contenu du livre', error: error.message });
  }
};

// Partager un livre avec une personne par email (POST /api/books/:id/share)
export const shareBook = async (req, res) => {
  try {
    const { email, role = 'viewer' } = req.body;
    const bookId = req.params.id;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "L'adresse e-mail est obligatoire" });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!['viewer', 'editor'].includes(role)) {
      return res.status(400).json({ message: "Rôle invalide. Choisissez 'viewer' ou 'editor'" });
    }

    const { hasAccess, book, isOwner } = await getBookAccess(bookId, req.userId);
    if (!hasAccess || !book) {
      return res.status(404).json({ message: 'Livre introuvable' });
    }

    if (!isOwner) {
      return res.status(403).json({ message: 'Seul le propriétaire du livre peut gérer les partages' });
    }

    // Chercher l'utilisateur invité par email
    const targetUser = await User.findOne({ email: cleanEmail });
    if (!targetUser) {
      return res.status(404).json({
        message: `Aucun utilisateur trouvé avec l'adresse "${cleanEmail}". La personne doit posséder un compte MyFolio.`,
      });
    }

    // Vérifier si c'est soi-même
    if (targetUser._id.toString() === book.userId.toString()) {
      return res.status(400).json({ message: 'Vous êtes déjà le propriétaire de ce livre' });
    }

    // Vérifier si l'utilisateur est déjà collaborateur
    const existingIndex = book.collaborators.findIndex(
      (c) => c.userId.toString() === targetUser._id.toString() || c.email.toLowerCase() === cleanEmail
    );

    if (existingIndex > -1) {
      book.collaborators[existingIndex].role = role;
      book.collaborators[existingIndex].name = targetUser.name || book.collaborators[existingIndex].name;
    } else {
      book.collaborators.push({
        userId: targetUser._id,
        email: cleanEmail,
        name: targetUser.name || cleanEmail.split('@')[0],
        role,
        sharedAt: new Date(),
      });
    }

    await book.save();

    res.json({
      message: 'Livre partagé avec succès',
      collaborators: book.collaborators,
      collaboratorsCount: book.collaborators.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du partage du livre', error: error.message });
  }
};

// Modifier le rôle d'un collaborateur (PATCH /api/books/:id/share/:collaboratorId)
export const updateCollaboratorRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id: bookId, collaboratorId } = req.params;

    if (!['viewer', 'editor'].includes(role)) {
      return res.status(400).json({ message: "Rôle invalide. Choisissez 'viewer' ou 'editor'" });
    }

    const { hasAccess, book, isOwner } = await getBookAccess(bookId, req.userId);
    if (!hasAccess || !book) {
      return res.status(404).json({ message: 'Livre introuvable' });
    }

    if (!isOwner) {
      return res.status(403).json({ message: 'Seul le propriétaire peut modifier les permissions' });
    }

    const collab = book.collaborators.find(
      (c) => (c._id && c._id.toString() === collaboratorId) || (c.userId && c.userId.toString() === collaboratorId)
    );

    if (!collab) {
      return res.status(404).json({ message: 'Collaborateur introuvable' });
    }

    collab.role = role;
    await book.save();

    res.json({
      message: 'Rôle mis à jour avec succès',
      collaborators: book.collaborators,
      collaboratorsCount: book.collaborators.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la modification du rôle', error: error.message });
  }
};

// Retirer un collaborateur (DELETE /api/books/:id/share/:collaboratorId)
export const removeCollaborator = async (req, res) => {
  try {
    const { id: bookId, collaboratorId } = req.params;

    const { hasAccess, book, isOwner } = await getBookAccess(bookId, req.userId);
    if (!hasAccess || !book) {
      return res.status(404).json({ message: 'Livre introuvable' });
    }

    if (!isOwner) {
      return res.status(403).json({ message: 'Seul le propriétaire peut retirer un collaborateur' });
    }

    book.collaborators = book.collaborators.filter(
      (c) => (c._id && c._id.toString() !== collaboratorId) && (c.userId && c.userId.toString() !== collaboratorId)
    );
    await book.save();

    res.json({
      message: 'Collaborateur retiré avec succès',
      collaborators: book.collaborators,
      collaboratorsCount: book.collaborators.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du retrait du collaborateur', error: error.message });
  }
};
