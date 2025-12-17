import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { SalesPage } from './components/SalesPage';
import { Dashboard } from './components/Dashboard';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Check session on mount - in production this would verify with backend
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        // In production: verify existing session token with backend
        // For now, just check if we have a user in state
        // Backend will manage session via httpOnly cookies or JWT
        setLoading(false);
      } catch (err) {
        console.error('Auth initialization error:', err);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setError('');
    // Backend handles session persistence via:
    // - httpOnly secure cookies (recommended)
    // - JWT tokens in sessionStorage (if needed)
    // DO NOT use localStorage for sensitive user data
  };

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint to clear session
      // await db.logout(); // if implemented
      setUser(null);
      setError('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 font-semibold">Loading System...</p>
        </div>
      </div>
    );
  }

  // Show login page if no user
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Role-based routing
  if (user.role === 'admin') {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  if (user.role === 'cashier') {
    return <SalesPage user={user} onLogout={handleLogout} />;
  }

  // Unknown role
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
        <p className="text-slate-600 mb-4">Unknown user role: {user.role}</p>
        <button
          onClick={handleLogout}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default App;