import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { getErrorMessage } from '../../utils/helpers';
import Navbar from '../../components/layout/Navbar';
import { PageSpinner } from '../../components/common/Spinner';

// A stat card for the admin dashboard
function StatCard({ title, value, icon, color }) {
  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className={`text-4xl opacity-80`}>{icon}</div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats]           = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    adminApi.getStats()
      .then(({ data }) => {
        setStats(data.stats);
        setRecentUsers(data.recent_users);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><PageSpinner /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <Link
            to="/admin/users"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Manage Users →
          </Link>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Users"    value={stats.total_users}    icon="👥" color="text-blue-600" />
            <StatCard title="Total Boards"   value={stats.total_boards}   icon="📋" color="text-green-600" />
            <StatCard title="Total Cards"    value={stats.total_cards}    icon="🗂" color="text-purple-600" />
            <StatCard title="Total Comments" value={stats.total_comments} icon="💬" color="text-orange-600" />
            <StatCard title="Active Boards"  value={stats.active_boards}  icon="✅" color="text-teal-600" />
            <StatCard title="Admin Users"    value={stats.admin_users}    icon="⭐" color="text-yellow-600" />
          </div>
        )}

        {/* Recent signups */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Signups</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">User</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Email</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Role</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium text-gray-800">{user.name}</td>
                    <td className="py-2 px-3 text-gray-600">{user.email}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.role === 'admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
