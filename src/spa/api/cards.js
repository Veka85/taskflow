import api from './axios';

export const cardsApi = {
  getById:       (id)           => api.get(`/cards/${id}`),
  create:        (listId, data) => api.post(`/lists/${listId}/cards`, data),
  update:        (id, data)     => api.put(`/cards/${id}`, data),
  delete:        (id)           => api.delete(`/cards/${id}`),
  move:          (id, data)     => api.put(`/cards/${id}/move`, data),
  reorder:       (listId, cardIds) => api.put(`/lists/${listId}/cards/reorder`, { card_ids: cardIds }),

  // Members
  addMember:     (cardId, userId)   => api.post(`/cards/${cardId}/members`, { user_id: userId }),
  removeMember:  (cardId, userId)   => api.delete(`/cards/${cardId}/members/${userId}`),

  // Labels
  toggleLabel:   (cardId, labelId)  => api.post(`/cards/${cardId}/labels/toggle`, { label_id: labelId }),

  // Comments
  getComments:   (cardId)           => api.get(`/cards/${cardId}/comments`),
  addComment:    (cardId, body)     => api.post(`/cards/${cardId}/comments`, { body }),
  updateComment: (commentId, body)  => api.put(`/comments/${commentId}`, { body }),
  deleteComment: (commentId)        => api.delete(`/comments/${commentId}`),
};
