import React, { useState } from 'react';
import { BookOpen, Plus, Search, Sparkles, BookMarked, Library } from 'lucide-react';
import BookCard from './BookCard';
import CreateBookModal from './CreateBookModal';
import BookOpeningAnimation from '../book/BookOpeningAnimation';

export default function LibraryView({
  books,
  loading,
  onCreateBook,
  onUpdateBook,
  onDeleteBook,
  onSelectBook,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [openingBook, setOpeningBook] = useState(null);

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (book.description && book.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleBookClick = (book) => {
    setOpeningBook(book);
  };

  const handleAnimationComplete = () => {
    if (openingBook) {
      onSelectBook(openingBook);
      setOpeningBook(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-stone-800 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-stone-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/20">
              <Library className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-2xl tracking-tight text-stone-900 flex items-center gap-2">
                MyFolio <span className="text-amber-700 text-sm font-sans font-normal px-2 py-0.5 bg-amber-100/60 rounded-full border border-amber-200">Bibliothèque</span>
              </h1>
              <p className="text-xs text-stone-500">
                Vos collections organisées en livres interactifs multidimensionnels
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-64 hidden sm:block">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un livre..."
                className="w-full pl-9.5 pr-4 py-2 bg-stone-100 border border-stone-200/80 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>

            {/* Create Book Button */}
            <button
              onClick={() => {
                setEditingBook(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Livre</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content / Shelf */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-stone-600">Chargement de votre bibliothèque...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white/60 border border-dashed border-stone-300 rounded-3xl p-12 max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <BookMarked className="w-8 h-8" />
            </div>
            <h3 className="font-serif font-bold text-xl text-stone-800 mb-2">
              {searchQuery ? 'Aucun livre ne correspond à votre recherche' : 'Votre bibliothèque est encore vide'}
            </h3>
            <p className="text-xs text-stone-500 mb-6 max-w-sm">
              {searchQuery
                ? 'Essayez avec d’autres termes ou réinitialisez la recherche.'
                : 'Créez votre tout premier livre de collection personnalisé en un clic.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setIsModalOpen(true);
              }}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Créer un livre</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Shelf Banner */}
            <div className="flex items-center justify-between mb-8 pb-3 border-b border-stone-300/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Collections ({filteredBooks.length})
                </span>
              </div>
              <span className="text-xs text-stone-400 italic">
                Cliquez sur un livre pour l'ouvrir
              </span>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-12 gap-x-8 justify-items-center">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book._id}
                  book={book}
                  onOpen={handleBookClick}
                  onEdit={(b) => {
                    setEditingBook(b);
                    setIsModalOpen(true);
                  }}
                  onDelete={onDeleteBook}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Book Opening Animation */}
      {openingBook && (
        <BookOpeningAnimation
          book={openingBook}
          onAnimationComplete={handleAnimationComplete}
        />
      )}

      {/* Modal Création / Edition Livre */}
      <CreateBookModal
        isOpen={isModalOpen}
        initialBook={editingBook}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBook(null);
        }}
        onSubmit={async (data) => {
          if (editingBook) {
            await onUpdateBook(editingBook._id, data);
          } else {
            await onCreateBook(data);
          }
        }}
      />
    </div>
  );
}
