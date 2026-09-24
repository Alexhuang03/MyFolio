import React, { useState } from 'react';
import { Plus, Search, BookMarked, Library, LogOut, Bookmark, Settings } from 'lucide-react';
import BookCard from './BookCard';
import CreateBookModal from './CreateBookModal';
import SettingsModal from '../settings/SettingsModal';
import BookOpeningAnimation from '../book/BookOpeningAnimation';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../settings/ThemeToggle';

export default function LibraryView({
  books,
  loading,
  onCreateBook,
  onUpdateBook,
  onDeleteBook,
  onSelectBook,
  onToggleFavoriteBook,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [openingBook, setOpeningBook] = useState(null);

  const { t } = useLanguage();
  const { user, logout } = useAuth();

  const favoritesCount = books.filter((b) => b.isFavorite).length;

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.description && book.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFavorite = !filterFavorites || Boolean(book.isFavorite);
    return matchesSearch && matchesFavorite;
  });

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
    <div className="min-h-screen text-stone-800 dark:text-stone-100 flex flex-col transition-colors duration-200">
      {/* Top Header */}
      <header className="border-b border-stone-200/80 dark:border-stone-850 bg-white/70 dark:bg-stone-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/20 flex-shrink-0">
                <Library className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-lg sm:text-2xl tracking-tight text-stone-900 dark:text-white flex items-center gap-2">
                  MyFolio <span className="text-amber-700 dark:text-amber-300 text-xs sm:text-sm font-sans font-normal px-2 py-0.5 bg-amber-100/60 dark:bg-amber-950/70 rounded-full border border-amber-200 dark:border-amber-800/80">{t('library_badge')}</span>
                </h1>
                <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 line-clamp-1">
                  {t('library_subtitle')}
                </p>
              </div>
            </div>

            {/* Mobile Actions in top bar */}
            <div className="flex items-center gap-1.5 sm:hidden">
              <ThemeToggle />
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors border border-transparent hover:border-stone-200 dark:hover:border-stone-700"
                title={t('settings')}
              >
                <Settings className="w-4 h-4" />
              </button>
              {user && (
                <button
                  onClick={logout}
                  className="p-1.5 text-stone-500 hover:text-rose-600 dark:text-stone-400 dark:hover:text-rose-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  title={t('logout_btn')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Search Input with correct pl-10 padding */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_book')}
                className="w-full pl-10 pr-4 py-2 bg-stone-100 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-750 rounded-xl text-xs text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-850 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-stone-400 dark:placeholder:text-stone-500"
              />
            </div>

            <div className="hidden sm:flex items-center">
              <ThemeToggle />
            </div>

            {/* Desktop Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hidden sm:flex px-3.5 py-2 text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-750 border border-stone-200/80 dark:border-stone-700 rounded-xl text-xs font-semibold transition-all items-center gap-2 flex-shrink-0 cursor-pointer shadow-2xs"
              title={t('settings')}
            >
              <Settings className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              <span>{t('settings')}</span>
            </button>

            {/* Desktop User Profile & Logout */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 pl-1 border-l border-stone-200 dark:border-stone-800">
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-300"
                  title={user.email}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="max-w-[100px] truncate">{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                  title={t('logout_btn')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>


      {/* Main Content / Shelf */}
      <main className="flex-1 max-w-7xl mx-auto px-3.5 sm:px-6 py-6 sm:py-10 w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-stone-600 dark:text-stone-300">{t('loading_library')}</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="py-14 sm:py-20 flex flex-col items-center justify-center text-center bg-white/60 dark:bg-stone-900/60 border border-dashed border-stone-300 dark:border-stone-800 rounded-3xl p-6 sm:p-12 max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              {filterFavorites ? <Bookmark className="w-8 h-8" /> : <BookMarked className="w-8 h-8" />}
            </div>
            <h3 className="font-serif font-bold text-xl text-stone-800 dark:text-stone-100 mb-2">
              {filterFavorites
                ? t('no_favorites')
                : searchQuery
                ? t('no_results')
                : t('library_empty')}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 max-w-sm">
              {filterFavorites
                ? t('no_favorites_desc')
                : searchQuery
                ? t('try_other_terms')
                : t('create_first_book')}
            </p>
            {filterFavorites ? (
              <button
                onClick={() => setFilterFavorites(false)}
                className="px-5 py-2.5 bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2"
              >
                <span>{t('all_books')}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsModalOpen(true);
                }}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{t('create_book_btn')}</span>
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Shelf Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8 pb-3 border-b border-stone-300/60 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {t('collections')} ({filteredBooks.length})
                </span>

                {/* Filter Favorites Pill */}
                <button
                  onClick={() => setFilterFavorites(!filterFavorites)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    filterFavorites
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-stone-200/70 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-600 dark:text-stone-300'
                  }`}
                  title={t('filter_favorites')}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${filterFavorites ? 'fill-current' : ''}`} />
                  <span>{t('favorites')}</span>
                  {favoritesCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        filterFavorites
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-300 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {favoritesCount}
                    </span>
                  )}
                </button>
              </div>

              <button
                onClick={() => {
                  setEditingBook(null);
                  setIsModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('new_book')}</span>
              </button>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-7 sm:gap-y-10 gap-x-3 sm:gap-x-6 justify-items-center">
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
                  onToggleFavorite={onToggleFavoriteBook}
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
      {isModalOpen && (
        <CreateBookModal
          key={editingBook ? editingBook._id : 'new-book'}
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
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
