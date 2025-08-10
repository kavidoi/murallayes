import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../../services/authService';

export default function Login() {
  const [identifier, setIdentifier] = useState('contacto@murallacafe.cl');
  const [password, setPassword] = useState('Muralla2025');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    console.log('Login attempt:', { identifier, hasPassword: !!password });
    
    try {
      await AuthService.login(identifier, password);
      console.log('Login successful, navigating to dashboard');
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white dark:bg-neutral-800 rounded-xl shadow-soft p-6 space-y-4">
        <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">Sign in</h1>
        <div className="space-y-1">
          <label className="text-sm text-neutral-600 dark:text-neutral-300">Email or Username</label>
          <input 
            className="input" 
            type="email"
            autoComplete="username"
            value={identifier} 
            onChange={e => setIdentifier(e.target.value)} 
            placeholder="email or username"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-neutral-600 dark:text-neutral-300">Password</label>
          <input 
            className="input" 
            type="password" 
            autoComplete="current-password"
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="password"
            required
          />
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</div>}
        <button 
          disabled={loading || !identifier || !password} 
          className="btn-primary w-full disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
} 