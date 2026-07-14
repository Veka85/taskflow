import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useDebounce } from '../../hooks/useDebounce';
import { getErrorMessage } from '../../utils/helpers';
import Navbar from '../../components/layout/Navbar';
import Button from '../../components/common/Button';
import { PageSpinner } from '../../components/common/Spinner';
import { useAuth } from '../../context/AuthContext';

export default function UsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers]     = useState([]);
  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Filters
  const [search, setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage]         = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  // Fetch users whenever filters change
  useEffect(() => {
    setLoading(true);
    adminApi.getUsers({ q: debouncedSearch || undefined, role: roleFilter || undefined, page })
      .then(({ data }) => {
        setUsers(data.users.data);
        setMeta(data.meta);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [debouncedSearch, roleFilter, page]);

  const handleRoleChange = async (userId, newRole) => {
    if (!confirm(`Change this user's role to "${newRole}"?`)) return;
    try {
      const { data } = await adminApi.updateUser(userId, { role: newRole });
      setUsers(users.map((u) => u.id === userId ? data.user : u));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Delete this user? This will also delete all their boards.')) return;
    try {
      await adminApi.deleteUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin" className="text-blue-600 hover:underline text-sm">← Admin Dashboard</Link>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          {meta && <span className="text-sm text-gray-500">({meta.total} users)</span>}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 min-w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-12"><PageSpinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Joined</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                          <span className="font-medium text-gray-800">{user.name}</span>
                          {user.id === currentUser.id && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">You</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        {user.id !== currentUser.id ? (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className={`text-xs px-2 py-1 rounded-full font-medium border-0 outline-none cursor-pointer ${
                              user.role === 'admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        ) : (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            user.role === 'admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500">{user.created_at}</td>
                      <td className="py-3 px-4 text-right">
                        {user.id !== currentUser.id && (
                          <Button
                            variant="danger"
                            size="xs"
                            onClick={() => handleDelete(user.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Page {meta.current_page} of {meta.last_page} · {meta.total} users
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={meta.current_page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  ← Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={meta.current_page === meta.last_page}
                  onClick={() => setPage(page + 1)}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
