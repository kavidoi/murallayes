import React, { useState } from 'react';
import { AuthService } from '../../services/authService';

interface DevLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const DevLoginModal: React.FC<DevLoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('demo@muralla.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store tokens using AuthService
        if (data.access_token && data.refresh_token) {
          AuthService.setTokens(data.access_token, data.refresh_token);
          onLoginSuccess();
          onClose();
        } else {
          setError('Invalid response from server');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError('Connection error. Make sure backend is running on localhost:4000');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemoUser = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:4000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'demo@muralla.com',
          password: 'demo123',
          firstName: 'Demo',
          lastName: 'User'
        }),
      });

      if (response.ok) {
        setError('Demo user created! Now try logging in.');
      } else {
        const errorData = await response.json();
        setError(`Registration failed: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError('Connection error. Make sure backend is running on localhost:4000');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          🔑 Development Login
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Login to test the Universal Interconnection System with real backend storage.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              disabled={loading}
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {loading ? '🔄 Logging in...' : '🚀 Login'}
            </button>
            
            <button
              type="button"
              onClick={handleCreateDemoUser}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {loading ? '🔄 Creating...' : '👤 Create Demo User'}
            </button>
          </div>
        </form>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 text-sm"
          >
            Cancel
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            💡 <strong>Dev Tip:</strong> After logging in, expenses will save to the backend database and the Universal Interconnection System will work with real data persistence.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DevLoginModal;