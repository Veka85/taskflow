import api from './axios';

export const adminApi = {
  getStats: ()             => api.get('/admin/stats'),
  getUsers: (params)       => api.get('/admin/users', { params }),
  updateUser: (id, data)   => api.put(`/admin/users/${id}`, data),
  deleteUser: (id)         => api.delete(`/admin/users/${id}`),
};

export const searchApi = {
  search: (q) => api.get('/search', { params: { q } }),
};
