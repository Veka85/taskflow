import api from './axios';

export const boardsApi = {
  // Board CRUD
  getAll:   ()             => api.get('/boards'),
  getById:  (id)           => api.get(`/boards/${id}`),
  create:   (data)         => api.post('/boards', data),
  update:   (id, data)     => api.put(`/boards/${id}`, data),
  delete:   (id)           => api.delete(`/boards/${id}`),
  archive:  (id)           => api.post(`/boards/${id}/archive`),

  // Board members
  getMembers:    (boardId)          => api.get(`/boards/${boardId}/members`),
  addMember:     (boardId, data)    => api.post(`/boards/${boardId}/members`, data),
  removeMember:  (boardId, userId)  => api.delete(`/boards/${boardId}/members/${userId}`),

  // Labels
  getLabels:  (boardId)        => api.get(`/boards/${boardId}/labels`),
  createLabel:(boardId, data)  => api.post(`/boards/${boardId}/labels`, data),
  updateLabel:(labelId, data)  => api.put(`/labels/${labelId}`, data),
  deleteLabel:(labelId)        => api.delete(`/labels/${labelId}`),
};
