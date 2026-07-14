import api from './axios';

// CONCEPT — API Module:
// Instead of writing api.post('/auth/login', ...) directly in components,
// we centralize all API calls in dedicated modules.
// WHY:
//   1. If the endpoint changes, we update ONE place
//   2. Components don't need to know URL structure
//   3. Easy to mock in tests
//   4. Readable: authApi.login(data) is clearer than api.post('/auth/login', data)

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.post('/auth/logout'),
  me:       ()     => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};
