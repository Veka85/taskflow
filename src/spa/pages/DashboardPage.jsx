import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { boardsApi } from '../api/boards';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/helpers';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { PageSpinner } from '../components/common/Spinner';
import Input from '../components/common/Input';

// Board color picker options (matches seeder colors)
const BOARD_COLORS = [
  '#0079BF', '#D29034', '#519839', '#B04632',
  '#89609E', '#CD5A91', '#4BBF6B', '#00AECC',
  '#838C91',
];

// A single board card in the dashboard grid
function BoardCard({ board }) {
  return (
    <Link
      to={`/boards/${board.id}`}
      className="group rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-white/20 relative h-28"
      style={{ backgroundColor: board.color }}
    >
      {/* Board background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/0 to-black/30" />

      <div className="relative p-4 h-full flex flex-col justify-between">
        <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">
          {board.title}
        </h3>
        <div className="flex items-center gap-1">
          <span className="text-white/70 text-xs">
            {board.members_count} member{board.members_count !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

export default function DashboardPage() {
  const { user }    = useAuth();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  // Create board modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm]           = useState({ title: '', description: '', color: BOARD_COLORS[0] });
  const [createLoading, setCreateLoading]     = useState(false);
  const [createError, setCreateError]         = useState('');

  // Fetch all boards on page load
  useEffect(() => {
    setLoading(true);
    boardsApi.getAll()
      .then(({ data }) => setBoards(data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      const { data } = await boardsApi.create(createForm);
      // Add the new board to the top of the list without re-fetching
      setBoards([data.board, ...boards]);
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', color: BOARD_COLORS[0] });
    } catch (err) {
      setCreateError(getErrorMessage(err));
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-gray-500 text-sm mt-1">Here are your boards</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            + New Board
          </Button>
        </div>

        {loading ? (
          <PageSpinner />
        ) : error ? (
          <div className="text-red-600 text-center py-12">{error}</div>
        ) : boards.length === 0 ? (
          /* Empty state — guide the user to create their first board */
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No boards yet</h2>
            <p className="text-gray-500 mb-6">Create your first board to get started organizing your work.</p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Your First Board
            </Button>
          </div>
        ) : (
          <div>
            {/* Boards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {boards.map((board) => (
                <BoardCard key={board.id} board={board} />
              ))}

              {/* "Create new board" tile */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-28 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-500 hover:text-gray-700 text-sm font-medium border-2 border-dashed border-gray-300 hover:border-gray-400"
              >
                + Create Board
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Create Board Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setCreateError(''); }}
        title="Create New Board"
        size="sm"
      >
        <form onSubmit={handleCreateBoard} className="flex flex-col gap-4">
          {createError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {createError}
            </div>
          )}

          <Input
            label="Board Title"
            value={createForm.title}
            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            placeholder="e.g. Product Roadmap"
            required
            autoFocus
          />

          <Input
            label="Description (optional)"
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            placeholder="What's this board for?"
          />

          {/* Color Picker */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Board Color</label>
            <div className="flex flex-wrap gap-2">
              {BOARD_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCreateForm({ ...createForm, color })}
                  className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${
                    createForm.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div
            className="rounded-lg h-16 flex items-center px-4"
            style={{ backgroundColor: createForm.color }}
          >
            <span className="text-white font-semibold text-sm">
              {createForm.title || 'Board Title Preview'}
            </span>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createLoading}>
              Create Board
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
