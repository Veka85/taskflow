import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';

// CONCEPT — React Context:
// Context solves the "prop drilling" problem: passing data through many layers
// of components. Instead, any component in the tree can access auth state
// by calling useAuth() without needing props passed through every parent.
//
// HOW IT WORKS:
// 1. AuthContext is the "container" for the auth data
// 2. AuthProvider wraps our entire app — it holds the state
// 3. useAuth() is a custom hook that reads from the nearest Provider above it

const AuthContext = createContext(null);

// The Provider component manages auth state and exposes login/logout functions
export function AuthProvider({ children }) {
  // Initialize from localStorage so auth survives page refreshes
  // WHY: Without this, every page refresh logs the user out
  const [user, setUser]   = useState(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken]     = useState(() => localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true); // True while we verify the stored token

  // On app load: if we have a stored token, verify it's still valid
  // WHY: Token could have been revoked server-side (user logged out elsewhere)
  useEffect(() => {
    if (token) {
      authApi.me()
        .then(({ data }) => {
          setUser(data.user);
          // Update stored user data in case it changed (e.g. name update)
          localStorage.setItem('auth_user', JSON.stringify(data.user));
        })
        .catch(() => {
          // Token is invalid — clear everything and force re-login
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // Empty array = run once on mount

  // Login: store token + user, update state
  const login = useCallback((userData, authToken) => {
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  }, []);

  // Logout: call API to revoke token, then clear local state
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the API call fails, clear local state
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setToken(null);
      setUser(null);
    }
  }, []);

  // Update local user state without re-fetching from API
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook: enforces that useAuth() is only called inside AuthProvider
// CONCEPT — Custom Hooks:
// Custom hooks are just functions that call other hooks. They let us
// encapsulate and reuse stateful logic across components.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
