import { useState, FormEvent } from 'react';
import { Mail, Landmark } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validateRequired } from '../utils/validation';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export const LoginPage = ({ onNavigate }: LoginPageProps) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validateRequired(password, 'Password');
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 flex flex-col justify-center min-h-screen animate-fade-in">
      <div className="text-center mb-12">
        <Landmark className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Log in to continue to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <Input
          label="Email"
          icon={Mail}
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />

        <div className="text-right">
          <button
            type="button"
            onClick={() => onNavigate('forgot')}
            className="text-sm text-yellow-600 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          Log In
        </Button>
      </form>

      <div className="text-center mt-8">
        <p className="text-gray-500 dark:text-gray-400">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('accountType')}
            className="font-bold text-yellow-600 hover:underline"
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
};
