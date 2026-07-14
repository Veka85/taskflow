import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import { getErrorMessage } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]     = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear the specific field error when user starts correcting it
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setGeneralError('');

    try {
      const { data } = await authApi.register(form);
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      // CONCEPT — Laravel Validation Error Format:
      // When validation fails (422), Laravel returns:
      // { message: "...", errors: { field: ["error message"] } }
      // We parse these to show field-level errors.
      if (err.response?.data?.errors) {
        const fieldErrors = {};
        Object.entries(err.response.data.errors).forEach(([field, messages]) => {
          fieldErrors[field] = messages[0]; // Show first error per field
        });
        setErrors(fieldErrors);
      } else {
        setGeneralError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-blue-700 font-black text-xl">TF</span>
            </div>
            <h1 className="text-3xl font-bold text-white">TaskFlow</h1>
          </div>
          <p className="text-blue-200 text-sm">Organize anything, together.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create your account</h2>

          {generalError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="John Doe"
              error={errors.name}
              autoComplete="name"
              required
            />
            <Input
              label="Email address"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              error={errors.email}
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              error={errors.password}
              autoComplete="new-password"
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              name="password_confirmation"
              value={form.password_confirmation}
              onChange={handleChange}
              placeholder="Repeat your password"
              error={errors.password_confirmation}
              autoComplete="new-password"
              required
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-2"
              size="lg"
            >
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
