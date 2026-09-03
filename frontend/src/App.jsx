import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import LibraryView from './components/library/LibraryView';
import BookDetailView from './components/book/BookDetailView';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookContent, setBookContent] = useState({
    labels: [],
    subLabels: [],
    products: [],
  });

  // Notification Toast
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Charger la liste des livres au démarrage
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
    loadBooks();
  }, []);

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
    showToast(`Le livre "${newBook.title}" a été créé avec succès.`);
  };

  const handleUpdateBook = async (id, bookData) => {
    const updated = await api.updateBook(id, bookData);
    setBooks((prev) => prev.map((b) => (b._id === id ? updated : b)));
    if (selectedBook && selectedBook._id === id) {
      setSelectedBook(updated);
    }
    showToast('Livre mis à jour.');
  };

  const handleDeleteBook = async (book) => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer définitivement le livre "${book.title}" et l'ensemble de ses collections ?`
      )
    ) {
      try {
        await api.deleteBook(book._id);
        setBooks((prev) => prev.filter((b) => b._id !== book._id));
        if (selectedBook && selectedBook._id === book._id) {
          setSelectedBook(null);
        }
        showToast(`Livre "${book.title}" supprimé.`);
      } catch (err) {
        showToast(err.message, 'error');
      }
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
      showToast(`Label "${newLabel.name}" créé.`);
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
      showToast(`Label "${updated.name}" mis à jour.`);
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
          ? `Label supprimé avec ${res.deletedProductsCount} produit(s) associé(s).`
          : 'Label supprimé.'
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
      showToast(`Sous-label "${newSub.name}" créé.`);
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
      showToast(`Sous-label "${updated.name}" mis à jour.`);
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
          ? `Sous-label supprimé avec ${res.deletedProductsCount} produit(s) associé(s).`
          : 'Sous-label supprimé.'
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
      showToast(`"${newProduct.name}" ajouté au livre.`);
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
      showToast(`"${updated.name}" mis à jour.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Supprimer "${product.name}" ?`)) {
      try {
        await api.deleteProduct(product._id);
        setBookContent((prev) => ({
          ...prev,
          products: prev.products.filter((p) => p._id !== product._id),
        }));
        showToast(`"${product.name}" supprimé.`);
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md animate-slide-up bg-white/95 text-xs font-medium border-stone-200">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          )}
          <span className="text-stone-800">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 text-stone-400 hover:text-stone-700 ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main View router */}
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
        />
      )}
    </div>
  );
}
