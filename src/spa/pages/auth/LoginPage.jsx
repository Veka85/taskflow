import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import { getErrorMessage } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

// CONCEPT — Page Component:
// Pages are top-level components rendered by React Router when a URL matches.
// They typically:
//   1. Manage local form state with useState
//   2. Call API functions on submit
//   3. Handle loading and error states
//   4. Navigate programmatically after success

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();

  // CONCEPT — useState:
  // useState returns [currentValue, setterFunction].
  // Calling the setter causes React to re-render the component with the new value.
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // Generic change handler: updates the correct field in the form object
  // CONCEPT — Computed property names: [e.target.name] dynamically sets the key
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default HTML form submission (page reload)
    setLoading(true);
    setError('');

    try {
      const { data } = await authApi.login(form);
      login(data.user, data.token); // Store in context + localStorage
      navigate('/dashboard');       // Redirect to the main app
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      // CONCEPT — finally:
      // Runs whether the try succeeded or failed.
      // Always reset loading state so the button re-enables.
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-blue-700 font-black text-xl">TF</span>
            </div>
            <h1 className="text-3xl font-bold text-white">TaskFlow</h1>
          </div>
          <p className="text-blue-200 text-sm">Organize anything, together.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign in to your account</h2>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email address"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-2"
              size="lg"
            >
              Sign In
            </Button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            <strong>Demo:</strong> demo@taskflow.com / password<br />
            <strong>Admin:</strong> admin@taskflow.com / password
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
