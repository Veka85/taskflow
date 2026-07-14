import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { boardsApi } from '../api/boards';
import { getErrorMessage } from '../utils/helpers';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { PageSpinner } from '../components/common/Spinner';

const BOARD_COLORS = [
  '#0079BF', '#D29034', '#519839', '#B04632',
  '#89609E', '#CD5A91', '#4BBF6B', '#00AECC', '#838C91',
];

export default function BoardSettingsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [board, setBoard]     = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ title: '', description: '', color: '' });
  const [message, setMessage] = useState('');
  const [error, setError]     = useState('');

  // Invite member
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole]   = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError]   = useState('');

  useEffect(() => {
    Promise.all([
      boardsApi.getById(id),
      boardsApi.getMembers(id),
    ]).then(([boardRes, membersRes]) => {
      setBoard(boardRes.data.board);
      setForm({
        title:       boardRes.data.board.title,
        description: boardRes.data.board.description || '',
        color:       boardRes.data.board.color,
      });
      setMembers(membersRes.data.members);
    })
    .catch((err) => setError(getErrorMessage(err)))
    .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await boardsApi.update(id, form);
      setMessage('Board settings saved successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError('');
    try {
      await boardsApi.addMember(id, { email: inviteEmail, role: inviteRole });
      const membersRes = await boardsApi.getMembers(id);
      setMembers(membersRes.data.members);
      setInviteEmail('');
    } catch (err) {
      setInviteError(getErrorMessage(err));
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member from the board?')) return;
    try {
      await boardsApi.removeMember(id, userId);
      setMembers(members.filter((m) => m.id !== userId));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDeleteBoard = async () => {
    if (!confirm(`Are you sure you want to delete "${board.title}"? This cannot be undone.`)) return;
    try {
      await boardsApi.delete(id);
      navigate('/dashboard');
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><PageSpinner /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/boards/${id}`} className="text-blue-600 hover:underline text-sm">
            ← Back to Board
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Board Settings</h1>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">General</h2>

          {message && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{message}</div>}
          {error   && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Input
              label="Board Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What's this board for?"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Board Color</label>
              <div className="flex flex-wrap gap-2">
                {BOARD_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${form.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <Button type="submit" loading={saving} className="self-start">
              Save Changes
            </Button>
          </form>
        </div>

        {/* Members */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Members</h2>

          {/* Invite form */}
          <form onSubmit={handleInvite} className="flex gap-2 mb-4">
            <input
              type="email"
              placeholder="Invite by email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
            <Button type="submit" loading={inviteLoading} size="sm">
              Invite
            </Button>
          </form>
          {inviteError && <p className="text-xs text-red-600 mb-3">{inviteError}</p>}

          {/* Member list */}
          <div className="flex flex-col gap-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50">
                <img src={member.avatar} alt={member.name} className="w-9 h-9 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{member.name}</div>
                  <div className="text-xs text-gray-500 truncate">{member.email}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  member.role === 'owner' ? 'bg-yellow-100 text-yellow-700' :
                  member.role === 'member' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {member.role}
                </span>
                {member.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-400 hover:text-red-600 text-sm transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-600 mb-4">
            Deleting this board will permanently remove all its lists, cards, and comments. This cannot be undone.
          </p>
          <Button variant="danger" onClick={handleDeleteBoard}>
            Delete This Board
          </Button>
        </div>
      </div>
    </div>
  );
}
