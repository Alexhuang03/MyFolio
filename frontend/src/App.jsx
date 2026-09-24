import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import LibraryView from './components/library/LibraryView';
import BookDetailView from './components/book/BookDetailView';
import AuthScreen from './components/auth/AuthScreen';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useLanguage } from './i18n/LanguageContext';
import { useAuth } from './context/AuthContext';
import { useWallpaper } from './theme/WallpaperContext';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookContent, setBookContent] = useState({
    labels: [],
    subLabels: [],
    products: [],
  });

  const { t } = useLanguage();
  const { wallpaper, customWallpaperUrl } = useWallpaper();

  // Notification Toast
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Charger la liste des livres au démarrage quand l'utilisateur est connecté
  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await api.getBooks();
      setBooks(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadBooks();
    } else {
      setBooks([]);
      setSelectedBook(null);
      setBookContent({ labels: [], subLabels: [], products: [] });
      setLoading(false);
    }
  }, [user]);



  // Ouvrir un livre (Mega-Fetch)
  const handleSelectBook = async (book) => {
    try {
      setLoading(true);
      const data = await api.getBookContent(book._id);
      setSelectedBook(data.book);
      setBookContent({
        labels: data.labels,
        subLabels: data.subLabels,
        products: data.products,
      });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLibrary = () => {
    setSelectedBook(null);
    loadBooks();
  };

  // --- Gestion des Livres ---
  const handleCreateBook = async (bookData) => {
    const newBook = await api.createBook(bookData);
    setBooks((prev) => [newBook, ...prev]);
    showToast(t('book_created', { title: newBook.title }));
  };

  const handleUpdateBook = async (id, bookData) => {
    const updated = await api.updateBook(id, bookData);
    setBooks((prev) => prev.map((b) => (b._id === id ? updated : b)));
    if (selectedBook && selectedBook._id === id) {
      setSelectedBook(updated);
    }
    showToast(t('book_updated'));
  };

  const handleToggleFavoriteBook = async (book) => {
    try {
      const nextFavorite = !book.isFavorite;
      const updated = await api.updateBook(book._id, { isFavorite: nextFavorite });
      setBooks((prev) => prev.map((b) => (b._id === book._id ? updated : b)));
      if (selectedBook && selectedBook._id === book._id) {
        setSelectedBook(updated);
      }
      showToast(
        nextFavorite
          ? t('book_favorited', { title: book.title })
          : t('book_unfavorited', { title: book.title })
      );
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteBook = async (book) => {
    const isOwner = book.isOwner !== false;
    const confirmMsg = isOwner
      ? t('delete_book_confirm', { title: book.title })
      : t('leave_book_confirm');

    if (window.confirm(confirmMsg)) {
      try {
        const res = await api.deleteBook(book._id);
        setBooks((prev) => prev.filter((b) => b._id !== book._id));
        if (selectedBook && selectedBook._id === book._id) {
          setSelectedBook(null);
        }
        showToast(
          res.leftBook
            ? t('left_book_success')
            : t('book_deleted', { title: book.title })
        );
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  const handleCollaboratorsUpdated = (bookId, updatedCollaborators) => {
    setBooks((prev) =>
      prev.map((b) =>
        b._id === bookId
          ? {
              ...b,
              collaborators: updatedCollaborators,
              collaboratorsCount: updatedCollaborators.length,
            }
          : b
      )
    );
    if (selectedBook && selectedBook._id === bookId) {
      setSelectedBook((prev) => ({
        ...prev,
        collaborators: updatedCollaborators,
        collaboratorsCount: updatedCollaborators.length,
      }));
    }
  };

  // --- Gestion des Labels ---
  const handleCreateLabel = async (labelData) => {
    try {
      const newLabel = await api.createLabel(labelData);
      setBookContent((prev) => ({
        ...prev,
        labels: [...prev.labels, newLabel],
      }));
      showToast(t('label_created', { name: newLabel.name }));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateLabel = async (id, labelData) => {
    try {
      const updated = await api.updateLabel(id, labelData);
      setBookContent((prev) => ({
        ...prev,
        labels: prev.labels.map((l) => (l._id === id ? updated : l)),
      }));
      showToast(t('label_updated', { name: updated.name }));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteLabel = async (id, mode = 'cascade') => {
    try {
      const res = await api.deleteLabel(id, mode);
      setBookContent((prev) => {
        const remainingLabels = prev.labels.filter((l) => l._id !== id);
        let updatedProducts = prev.products;

        if (mode === 'cascade') {
          // Supprimer de la liste locale les produits qui avaient ce label
          updatedProducts = prev.products.filter(
            (p) => !p.labelIds || !p.labelIds.includes(id)
          );
        } else {
          // Détacher le label
          updatedProducts = prev.products.map((p) => ({
            ...p,
            labelIds: (p.labelIds || []).filter((lblId) => lblId !== id),
          }));
        }

        return {
          ...prev,
          labels: remainingLabels,
          products: updatedProducts,
        };
      });

      showToast(
        mode === 'cascade' && res.deletedProductsCount > 0
          ? t('label_deleted_cascade', { count: res.deletedProductsCount })
          : t('label_deleted')
      );
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- Gestion des Sous-Labels ---
  const handleCreateSubLabel = async (subLabelData) => {
    try {
      const newSub = await api.createSubLabel(subLabelData);
      setBookContent((prev) => ({
        ...prev,
        subLabels: [...prev.subLabels, newSub],
      }));
      showToast(t('sublabel_created', { name: newSub.name }));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateSubLabel = async (id, subLabelData) => {
    try {
      const updated = await api.updateSubLabel(id, subLabelData);
      setBookContent((prev) => ({
        ...prev,
        subLabels: prev.subLabels.map((s) => (s._id === id ? updated : s)),
      }));
      showToast(t('sublabel_updated', { name: updated.name }));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteSubLabel = async (id, mode = 'cascade') => {
    try {
      const res = await api.deleteSubLabel(id, mode);
      setBookContent((prev) => {
        const remainingSubLabels = prev.subLabels.filter((s) => s._id !== id);
        let updatedProducts = prev.products;

        if (mode === 'cascade') {
          updatedProducts = prev.products.filter(
            (p) => !p.subLabelIds || !p.subLabelIds.includes(id)
          );
        } else {
          updatedProducts = prev.products.map((p) => ({
            ...p,
            subLabelIds: (p.subLabelIds || []).filter((sId) => sId !== id),
          }));
        }

        return {
          ...prev,
          subLabels: remainingSubLabels,
          products: updatedProducts,
        };
      });

      showToast(
        mode === 'cascade' && res.deletedProductsCount > 0
          ? t('sublabel_deleted_cascade', { count: res.deletedProductsCount })
          : t('sublabel_deleted')
      );
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- Gestion des Produits ---
  const handleCreateProduct = async (productData) => {
    try {
      const newProduct = await api.createProduct(productData);
      setBookContent((prev) => ({
        ...prev,
        products: [newProduct, ...prev.products],
      }));
      showToast(t('product_added', { name: newProduct.name }));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateProduct = async (id, productData) => {
    try {
      const updated = await api.updateProduct(id, productData);
      setBookContent((prev) => ({
        ...prev,
        products: prev.products.map((p) => (p._id === id ? updated : p)),
      }));
      showToast(t('product_updated', { name: updated.name }));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(t('delete_product_confirm', { name: product.name }))) {
      try {
        await api.deleteProduct(product._id);
        setBookContent((prev) => ({
          ...prev,
          products: prev.products.filter((p) => p._id !== product._id),
        }));
        showToast(t('product_deleted', { name: product.name }));
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 dark:bg-stone-950">
        <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen font-sans text-stone-900 dark:text-stone-100 transition-colors duration-200 relative">
      {/* Illustrated Wallpaper: Chat Bibliophile (fond.png cropped and transparent) */}
      {wallpaper === 'fond' && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-end justify-center pb-0 sm:pb-1 select-none">
          <img
            src="/img/fond.png"
            alt="Fond d'écran Chat Bibliophile"
            className="w-auto h-auto max-w-[min(560px,90vw)] max-h-[44vh] sm:max-h-[58vh] md:max-h-[72vh] object-contain opacity-85 dark:opacity-75 dark:invert dark:hue-rotate-180 transition-all duration-700 pointer-events-none"
          />
        </div>
      )}

      {/* Custom User Uploaded Wallpaper */}
      {wallpaper === 'custom' && customWallpaperUrl && (
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center transition-opacity duration-700 opacity-90 dark:opacity-75"
          style={{ backgroundImage: `url('${customWallpaperUrl}')` }}
        />
      )}

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md animate-slide-up bg-white/95 dark:bg-stone-900/95 text-xs font-medium border-stone-200 dark:border-stone-700">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          )}
          <span className="text-stone-800 dark:text-stone-100">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main View router */}
      <div className="relative z-10">
        {selectedBook ? (
          <BookDetailView
            book={selectedBook}
            labels={bookContent.labels}
            subLabels={bookContent.subLabels}
            products={bookContent.products}
            onBackToLibrary={handleBackToLibrary}
            onCreateLabel={handleCreateLabel}
            onUpdateLabel={handleUpdateLabel}
            onDeleteLabel={handleDeleteLabel}
            onCreateSubLabel={handleCreateSubLabel}
            onUpdateSubLabel={handleUpdateSubLabel}
            onDeleteSubLabel={handleDeleteSubLabel}
            onCreateProduct={handleCreateProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        ) : (
          <LibraryView
            books={books}
            loading={loading}
            onCreateBook={handleCreateBook}
            onUpdateBook={handleUpdateBook}
            onDeleteBook={handleDeleteBook}
            onSelectBook={handleSelectBook}
            onToggleFavoriteBook={handleToggleFavoriteBook}
            onCollaboratorsUpdated={handleCollaboratorsUpdated}
          />
        )}
      </div>
    </div>
  );
}
