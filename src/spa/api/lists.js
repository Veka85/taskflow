import api from './axios';

export const listsApi = {
  create:  (boardId, data)  => api.post(`/boards/${boardId}/lists`, data),
  update:  (id, data)       => api.put(`/lists/${id}`, data),
  delete:  (id)             => api.delete(`/lists/${id}`),
  reorder: (boardId, listIds) => api.put(`/boards/${boardId}/lists/reorder`, { list_ids: listIds }),
};
