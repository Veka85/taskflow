import axios from 'axios';

// CONCEPT — Axios Instance:
// Instead of using axios directly everywhere (axios.get('/api/boards')),
// we create a pre-configured instance with our base settings.
// This means:
//   1. We only configure the base URL once
//   2. Every request automatically includes the auth token
//   3. We can intercept ALL responses to handle 401 errors globally
//
// Think of it like a configured HTTP client that all our API calls use.

const api = axios.create({
  baseURL: '/api',   // Vite proxy forwards /api/* to http://localhost:8000/api/*
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',     // Tell Laravel to return JSON, not HTML
  },
});

// =============================================================================
// REQUEST INTERCEPTOR
// Runs before every request is sent.
// WHY: We need to attach the auth token to every protected API request.
// The token is stored in localStorage after login.
// =============================================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // CONCEPT — Bearer Token:
      // "Bearer" is the auth scheme. The server reads this header,
      // strips "Bearer ", and validates the remaining token string.
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =============================================================================
// RESPONSE INTERCEPTOR
// Runs after every response comes back (or fails).
// WHY: If the server returns 401 (Unauthorized), the token is expired/invalid.
// We clear stored credentials and redirect to login automatically.
// This prevents "stuck" states where the app has an invalid token.
// =============================================================================
api.interceptors.response.use(
  (response) => response, // Pass through successful responses unchanged
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid credentials
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // Redirect to login — only if not already there (prevents redirect loops)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
