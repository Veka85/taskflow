import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { getErrorMessage } from '../utils/helpers';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [form, setForm]   = useState({
    name:                  user?.name || '',
    email:                 user?.email || '',
    password:              '',
    password_confirmation: '',
  });
  const [saving, setSaving]   = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors]   = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setErrors({});

    // Build payload — only include password if user is changing it
    const payload = { name: form.name, email: form.email };
    if (form.password) {
      payload.password = form.password;
      payload.password_confirmation = form.password_confirmation;
    }

    try {
      const { data } = await authApi.updateProfile(payload);
      updateUser(data.user);
      setMessage('Profile updated successfully!');
      setForm({ ...form, password: '', password_confirmation: '' });
    } catch (err) {
      if (err.response?.data?.errors) {
        const fieldErrors = {};
        Object.entries(err.response.data.errors).forEach(([field, messages]) => {
          fieldErrors[field] = messages[0];
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: getErrorMessage(err) });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Avatar display */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <h2 className="font-semibold text-gray-900">{user?.name}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                user?.role === 'admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {user?.role}
              </span>
            </div>
          </div>

          {message && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{message}</div>}
          {errors.general && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{errors.general}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              required
            />

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-500 mb-3">Leave password blank to keep your current password</p>
              <div className="flex flex-col gap-4">
                <Input
                  label="New Password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  error={errors.password}
                  placeholder="Leave blank to keep current"
                  autoComplete="new-password"
                />
                {form.password && (
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={form.password_confirmation}
                    onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                )}
              </div>
            </div>

            <Button type="submit" loading={saving} className="self-start mt-2">
              Save Changes
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
