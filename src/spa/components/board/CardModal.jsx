import { useState, useEffect } from 'react';
import { cardsApi } from '../../api/cards';
import { useAuth } from '../../context/AuthContext';
import { formatDate, isOverdue, getErrorMessage } from '../../utils/helpers';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';

// CONCEPT — Complex Modal Component:
// The card detail modal is one of the most complex components in the app.
// It manages multiple sub-states: editing title, editing description,
// managing comments, labels, and assigned members.
// We break it into focused sections for readability.

export default function CardModal({ card, boardMembers, boardLabels, isOpen, onClose, onUpdate }) {
  const { user } = useAuth();

  const [editing, setEditing]             = useState({ title: false, description: false });
  const [form, setForm]                   = useState({ title: '', description: '', due_date: '', cover_color: '' });
  const [saving, setSaving]               = useState(false);
  const [newComment, setNewComment]       = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [localCard, setLocalCard]         = useState(card);

  // Sync local state when the card prop changes (e.g., after a drag-drop move)
  useEffect(() => {
    if (card) {
      setLocalCard(card);
      setForm({
        title:       card.title || '',
        description: card.description || '',
        due_date:    card.due_date ? new Date(card.due_date).toISOString().slice(0, 16) : '',
        cover_color: card.cover_color || '',
      });
    }
  }, [card]);

  const saveField = async (field, value) => {
    setSaving(true);
    try {
      const { data } = await cardsApi.update(localCard.id, { [field]: value });
      const updated = { ...localCard, ...data.card };
      setLocalCard(updated);
      onUpdate(updated);
    } catch (err) {
      console.error(getErrorMessage(err));
    } finally {
      setSaving(false);
      setEditing({ ...editing, [field]: false });
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const { data } = await cardsApi.addComment(localCard.id, newComment);
      const updated = {
        ...localCard,
        comments: [data.comment, ...(localCard.comments || [])],
      };
      setLocalCard(updated);
      onUpdate(updated);
      setNewComment('');
    } catch (err) {
      console.error(getErrorMessage(err));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await cardsApi.deleteComment(commentId);
      const updated = {
        ...localCard,
        comments: (localCard.comments || []).filter((c) => c.id !== commentId),
      };
      setLocalCard(updated);
      onUpdate(updated);
    } catch (err) {
      console.error(getErrorMessage(err));
    }
  };

  const handleToggleLabel = async (labelId) => {
    try {
      const { data } = await cardsApi.toggleLabel(localCard.id, labelId);
      const updated = { ...localCard, labels: data.labels };
      setLocalCard(updated);
      onUpdate(updated);
    } catch (err) {
      console.error(getErrorMessage(err));
    }
  };

  const handleToggleMember = async (memberId) => {
    const isAssigned = (localCard.members || []).some((m) => m.id === memberId);
    try {
      if (isAssigned) {
        await cardsApi.removeMember(localCard.id, memberId);
        const updated = { ...localCard, members: (localCard.members || []).filter((m) => m.id !== memberId) };
        setLocalCard(updated);
        onUpdate(updated);
      } else {
        await cardsApi.addMember(localCard.id, memberId);
        const member = boardMembers.find((m) => m.id === memberId);
        const updated = { ...localCard, members: [...(localCard.members || []), member] };
        setLocalCard(updated);
        onUpdate(updated);
      }
    } catch (err) {
      console.error(getErrorMessage(err));
    }
  };

  if (!localCard) return null;

  const overdue = isOverdue(localCard.due_date);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg" className="overflow-visible">
      {/* Cover color bar */}
      {localCard.cover_color && (
        <div
          className="h-8 rounded-t-lg -mt-6 -mx-6 mb-4"
          style={{ backgroundColor: localCard.cover_color }}
        />
      )}

      <div className="flex gap-6">
        {/* Main content column */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          {editing.title ? (
            <div className="mb-4">
              <input
                className="w-full text-xl font-bold border-b-2 border-blue-500 outline-none pb-1 bg-transparent"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onBlur={() => saveField('title', form.title)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveField('title', form.title); if (e.key === 'Escape') setEditing({ ...editing, title: false }); }}
                autoFocus
              />
            </div>
          ) : (
            <h2
              className="text-xl font-bold text-gray-900 mb-1 cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 -mx-1"
              onClick={() => setEditing({ ...editing, title: true })}
            >
              {localCard.title}
            </h2>
          )}

          {/* Labels */}
          {localCard.labels?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {localCard.labels.map((label) => (
                <Badge key={label.id} label={label.name} color={label.color} />
              ))}
            </div>
          )}

          {/* Due date */}
          {localCard.due_date && (
            <div className={`inline-flex items-center gap-1.5 text-sm px-2 py-1 rounded mb-4 ${overdue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
              <span>🗓</span>
              <span>{formatDate(localCard.due_date)}</span>
              {overdue && <span className="font-medium">(Overdue)</span>}
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span>📝</span> Description
            </h3>
            {editing.description ? (
              <div>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Add a more detailed description..."
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => saveField('description', form.description)} loading={saving}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing({ ...editing, description: false })}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div
                className="text-sm text-gray-600 cursor-pointer hover:bg-gray-100 rounded-lg p-3 min-h-[60px] whitespace-pre-wrap"
                onClick={() => setEditing({ ...editing, description: true })}
              >
                {localCard.description || <span className="text-gray-400">Add a description...</span>}
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>💬</span> Comments
            </h3>

            {/* Add comment form */}
            <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
              <img src={user?.avatar} alt={user?.name} className="w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1">
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                />
                {newComment.trim() && (
                  <Button type="submit" size="sm" className="mt-1" loading={submittingComment}>
                    Save
                  </Button>
                )}
              </div>
            </form>

            {/* Comment list */}
            <div className="flex flex-col gap-3">
              {(localCard.comments || []).map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <img
                    src={comment.author?.avatar}
                    alt={comment.author?.name}
                    className="w-8 h-8 rounded-full shrink-0"
                  />
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700">{comment.author?.name}</span>
                        <span className="text-xs text-gray-400">{comment.created_at}</span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.body}</p>
                    </div>
                    {/* Only show delete for author */}
                    {comment.author?.id === user?.id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-gray-400 hover:text-red-500 mt-0.5 ml-1 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar — labels, members, due date */}
        <div className="w-44 shrink-0 flex flex-col gap-4">
          {/* Labels */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Labels</h4>
            <div className="flex flex-col gap-1">
              {boardLabels.map((label) => {
                const active = (localCard.labels || []).some((l) => l.id === label.id);
                return (
                  <button
                    key={label.id}
                    onClick={() => handleToggleLabel(label.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium transition-all ${active ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-70 hover:opacity-100'}`}
                    style={{ backgroundColor: label.color, color: '#fff' }}
                  >
                    {active && <span>✓</span>}
                    {label.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Members */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Members</h4>
            <div className="flex flex-col gap-1">
              {boardMembers.map((member) => {
                const assigned = (localCard.members || []).some((m) => m.id === member.id);
                return (
                  <button
                    key={member.id}
                    onClick={() => handleToggleMember(member.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${assigned ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    <img src={member.avatar} alt={member.name} className="w-5 h-5 rounded-full" />
                    <span className="truncate">{member.name}</span>
                    {assigned && <span className="ml-auto">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Due Date</h4>
            <input
              type="datetime-local"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              onBlur={(e) => saveField('due_date', e.target.value || null)}
              className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
