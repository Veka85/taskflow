import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { searchApi } from '../../api/admin';
import { useDebounce } from '../../hooks/useDebounce';

// CONCEPT — Component:
// A React component is a function that returns JSX (HTML-like syntax).
// It can have its own state (useState) and side effects (useEffect).
// Components are the building blocks of a React app.

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching]       = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // User menu dropdown state
  const [showUserMenu, setShowUserMenu] = useState(false);

  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  // Debounce search: only call API 300ms after user stops typing
  const debouncedQuery = useDebounce(searchQuery, 300);

  // CONCEPT — useEffect with dependency:
  // This effect runs whenever `debouncedQuery` changes.
  // It fires the search API call when the debounced value updates.
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setSearching(true);
      searchApi.search(debouncedQuery)
        .then(({ data }) => {
          setSearchResults(data);
          setShowDropdown(true);
        })
        .catch(() => setSearchResults(null))
        .finally(() => setSearching(false));
    } else {
      setSearchResults(null);
      setShowDropdown(false);
    }
  }, [debouncedQuery]);

  // Close dropdowns when clicking outside — standard UX pattern
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-700 text-white px-4 py-2 flex items-center gap-4 sticky top-0 z-50 shadow-md">
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg shrink-0 hover:opacity-80 transition-opacity">
        <div className="w-7 h-7 bg-white rounded flex items-center justify-center">
          <span className="text-blue-700 text-xs font-black">TF</span>
        </div>
        <span className="hidden sm:block">TaskFlow</span>
      </Link>

      {/* Search */}
      <div className="flex-1 max-w-md relative" ref={searchRef}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search boards and cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults && setShowDropdown(true)}
            className="w-full bg-blue-600 text-white placeholder-blue-200 rounded px-3 py-1.5 text-sm outline-none focus:bg-blue-500 focus:ring-2 focus:ring-blue-300 transition-colors"
          />
          {searching && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && searchResults && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
            {searchResults.boards?.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 uppercase tracking-wide">Boards</div>
                {searchResults.boards.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => { navigate(`/boards/${board.id}`); setShowDropdown(false); setSearchQuery(''); }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                  >
                    <div className="w-4 h-4 rounded shrink-0" style={{ backgroundColor: board.color }} />
                    {board.title}
                  </button>
                ))}
              </div>
            )}
            {searchResults.cards?.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 uppercase tracking-wide">Cards</div>
                {searchResults.cards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => { navigate(`/boards/${card.board_id}`); setShowDropdown(false); setSearchQuery(''); }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                  >
                    <div className="font-medium truncate">{card.title}</div>
                    <div className="text-xs text-gray-500">{card.board_name}</div>
                  </button>
                ))}
              </div>
            )}
            {searchResults.boards?.length === 0 && searchResults.cards?.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">No results found</div>
            )}
          </div>
        )}
      </div>

      {/* Right side nav links */}
      <div className="flex items-center gap-2 ml-auto">
        {isAdmin && (
          <Link to="/admin" className="hidden sm:block text-sm px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 transition-colors">
            Admin
          </Link>
        )}

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-8 h-8 rounded-full border-2 border-blue-400 object-cover"
            />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="font-medium text-sm">{user?.name}</div>
                <div className="text-xs text-gray-500 truncate">{user?.email}</div>
              </div>
              <Link
                to="/profile"
                onClick={() => setShowUserMenu(false)}
                className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                Profile Settings
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors sm:hidden"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
