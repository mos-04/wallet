import React, { useState } from 'react';
import { apiClient } from '../services/apiClient';
import { User } from '../types';
import { Lock, User as UserIcon } from 'lucide-react';
import LogoImage from '../src/images/sabic international logo.png';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await apiClient.login(username, password);
      
      if (user) {
        // Login successful
        onLogin(user);
      } else {
        // Invalid credentials (401)
        setError('Invalid username or password');
      }
    } catch (err) {
      // Other errors (network, server error, etc.)
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-white pt-8 px-8 py-8 pb-0 text-center">
          <img src={LogoImage} alt="Logo" className="mx-auto mb-4 h-20" />
        </div>
        <div className="bg-slate-50 text-center">
        <p className="text-black font-semibold text-lg">System Login</p>
        </div>
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3d579d] focus:border-[#5a70b5] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5a70b5] focus:border-[#3d579d] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username || !password}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all ${
                loading 
                  ? 'bg-[#5a70b5] cursor-wait' 
                  : 'bg-[#3d579d] hover:bg-[#2f4377] hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-[#3d579d] disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            <p className="font-medium mb-2">Demo Credentials:</p>
            <div className="space-y-1">
              <p><span className="text-slate-600">Admin:</span> admin / admin123</p>
              <p><span className="text-slate-600">Cashier:</span> cashier1 / cashier123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};