import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import LibraryView from './components/library/LibraryView';
import BookDetailView from './components/book/BookDetailView';
import AuthScreen from './components/auth/AuthScreen';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useLanguage } from './i18n/LanguageContext';
import { useAuth } from './context/AuthContext';
import { useWallpaper } from './theme/WallpaperContext';
import { initSocket, getSocket, disconnectSocket, joinBookRoom, leaveBookRoom } from './services/socket';

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

      const token = localStorage.getItem('myfolio_token');
      const socket = initSocket(token);

      if (socket) {
        // Livre partagé avec l'utilisateur en direct
        const onBookShared = (newBook) => {
          setBooks((prev) => {
            if (prev.some((b) => b._id === newBook._id)) {
              return prev.map((b) => (b._id === newBook._id ? newBook : b));
            }
            return [newBook, ...prev];
          });
          showToast(t('book_shared_with_you', { title: newBook.title }));
        };

        // Accès retiré ou livre supprimé par le propriétaire
        const onBookRemoved = ({ bookId }) => {
          setBooks((prev) => prev.filter((b) => b._id !== bookId));
          setSelectedBook((curr) => {
            if (curr && curr._id === bookId) {
              showToast(t('book_access_revoked'), 'error');
              return null;
            }
            return curr;
          });
        };

        socket.on('book:shared', onBookShared);
        socket.on('book:removed', onBookRemoved);

        return () => {
          socket.off('book:shared', onBookShared);
          socket.off('book:removed', onBookRemoved);
        };
      }
    } else {
      setBooks([]);
      setSelectedBook(null);
      setBookContent({ labels: [], subLabels: [], products: [] });
      setLoading(false);
      disconnectSocket();
    }
  }, [user]);

  // Synchronisation collaborative en temps réel à l'intérieur du livre actif
  useEffect(() => {
    if (!selectedBook?._id) return;

    const bookId = selectedBook._id;
    joinBookRoom(bookId);
    const socket = getSocket();

    if (!socket) return;

    // Mise à jour des informations du livre en direct
    const onBookUpdated = (updatedBook) => {
      if (updatedBook._id === bookId) {
        setSelectedBook((prev) => (prev ? { ...prev, ...updatedBook } : null));
        setBooks((prev) =>
          prev.map((b) => (b._id === bookId ? { ...b, ...updatedBook } : b))
        );
      }
    };

    // Livre supprimé par le propriétaire pendant qu'un collaborateur le consulte
    const onBookDeleted = ({ bookId: deletedId }) => {
      if (deletedId === bookId) {
        setSelectedBook(null);
        setBooks((prev) => prev.filter((b) => b._id !== deletedId));
        showToast(t('book_deleted_by_owner'), 'error');
      }
    };

    // Mise à jour de la liste des collaborateurs
    const onCollaboratorsUpdated = ({ bookId: bId, collaborators, collaboratorsCount }) => {
      if (bId === bookId) {
        setSelectedBook((prev) =>
          prev ? { ...prev, collaborators, collaboratorsCount } : null
        );
        setBooks((prev) =>
          prev.map((b) => (b._id === bId ? { ...b, collaborators, collaboratorsCount } : b))
        );
      }
    };

    // Modification des droits de l'utilisateur actuel en direct
    const onRoleUpdated = ({ bookId: bId, role }) => {
      if (bId === bookId) {
        setSelectedBook((prev) => (prev ? { ...prev, myRole: role } : null));
        setBooks((prev) =>
          prev.map((b) => (b._id === bId ? { ...b, myRole: role } : b))
        );
        showToast(t('your_role_updated'));
      }
    };

    // Produits en direct (Création, Modification, Suppression)
    const onProductCreated = (newProd) => {
      if (newProd.bookId === bookId) {
        setBookContent((prev) => {
          if (prev.products.some((p) => p._id === newProd._id)) return prev;
          return { ...prev, products: [newProd, ...prev.products] };
        });
      }
    };

    const onProductUpdated = (updatedProd) => {
      if (updatedProd.bookId === bookId) {
        setBookContent((prev) => ({
          ...prev,
          products: prev.products.map((p) => (p._id === updatedProd._id ? updatedProd : p)),
        }));
      }
    };

    const onProductDeleted = ({ productId }) => {
      setBookContent((prev) => ({
        ...prev,
        products: prev.products.filter((p) => p._id !== productId),
      }));
    };

    // Labels en direct
    const onLabelCreated = (newLabel) => {
      if (newLabel.bookId === bookId) {
        setBookContent((prev) => {
          if (prev.labels.some((l) => l._id === newLabel._id)) return prev;
          return { ...prev, labels: [...prev.labels, newLabel] };
        });
      }
    };

    const onLabelUpdated = (updatedLabel) => {
      if (updatedLabel.bookId === bookId) {
        setBookContent((prev) => ({
          ...prev,
          labels: prev.labels.map((l) => (l._id === updatedLabel._id ? updatedLabel : l)),
        }));
      }
    };

    const onLabelDeleted = ({ labelId, mode }) => {
      setBookContent((prev) => ({
        ...prev,
        labels: prev.labels.filter((l) => l._id !== labelId),
        products:
          mode === 'detach'
            ? prev.products.map((p) => ({
                ...p,
                labelIds: (p.labelIds || []).filter((id) => id !== labelId),
              }))
            : prev.products.filter((p) => !(p.labelIds || []).includes(labelId)),
      }));
    };

    // Sous-labels en direct
    const onSubLabelCreated = (newSub) => {
      if (newSub.bookId === bookId) {
        setBookContent((prev) => {
          if (prev.subLabels.some((s) => s._id === newSub._id)) return prev;
          return { ...prev, subLabels: [...prev.subLabels, newSub] };
        });
      }
    };

    const onSubLabelUpdated = (updatedSub) => {
      if (updatedSub.bookId === bookId) {
        setBookContent((prev) => ({
          ...prev,
          subLabels: prev.subLabels.map((s) => (s._id === updatedSub._id ? updatedSub : s)),
        }));
      }
    };

    const onSubLabelDeleted = ({ subLabelId, mode }) => {
      setBookContent((prev) => ({
        ...prev,
        subLabels: prev.subLabels.filter((s) => s._id !== subLabelId),
        products:
          mode === 'detach'
            ? prev.products.map((p) => ({
                ...p,
                subLabelIds: (p.subLabelIds || []).filter((id) => id !== subLabelId),
              }))
            : prev.products.filter((p) => !(p.subLabelIds || []).includes(subLabelId)),
      }));
    };

    socket.on('book:updated', onBookUpdated);
    socket.on('book:deleted', onBookDeleted);
    socket.on('collaborators:updated', onCollaboratorsUpdated);
    socket.on('role:updated', onRoleUpdated);

    socket.on('product:created', onProductCreated);
    socket.on('product:updated', onProductUpdated);
    socket.on('product:deleted', onProductDeleted);

    socket.on('label:created', onLabelCreated);
    socket.on('label:updated', onLabelUpdated);
    socket.on('label:deleted', onLabelDeleted);

    socket.on('sublabel:created', onSubLabelCreated);
    socket.on('sublabel:updated', onSubLabelUpdated);
    socket.on('sublabel:deleted', onSubLabelDeleted);

    return () => {
      leaveBookRoom(bookId);

      socket.off('book:updated', onBookUpdated);
      socket.off('book:deleted', onBookDeleted);
      socket.off('collaborators:updated', onCollaboratorsUpdated);
      socket.off('role:updated', onRoleUpdated);

      socket.off('product:created', onProductCreated);
      socket.off('product:updated', onProductUpdated);
      socket.off('product:deleted', onProductDeleted);

      socket.off('label:created', onLabelCreated);
      socket.off('label:updated', onLabelUpdated);
      socket.off('label:deleted', onLabelDeleted);

      socket.off('sublabel:created', onSubLabelCreated);
      socket.off('sublabel:updated', onSubLabelUpdated);
      socket.off('sublabel:deleted', onSubLabelDeleted);
    };
  }, [selectedBook?._id]);



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

      {/* Main View router or loading/auth screen */}
      <div className="relative z-10">
        {authLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !user ? (
          <AuthScreen />
        ) : selectedBook ? (
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
