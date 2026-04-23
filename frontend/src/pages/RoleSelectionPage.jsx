import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { UserCircle, Wrench, CheckCircle } from 'lucide-react';

const RoleSelectionPage = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, setUser } = useAuth();

  const isNewUser = searchParams.get('new') === 'true';

  // 1. AuthContext already reads ?token= on mount. We just wait for it.
  // 2. If the user is NOT a new signup, skip this page.
  useEffect(() => {
    if (authLoading) return; // Still loading, wait

    if (!user) {
      // No user after auth check = bad/missing token → go to login
      navigate('/login');
      return;
    }

    // Existing returning users skip role selection — go straight to dashboard
    if (!isNewUser) {
      navigate('/resources');
    }
  }, [authLoading, user, isNewUser, navigate]);

  const roles = [
    {
      id: 'USER',
      name: 'User',
      description: 'Book facilities and raise maintenance tickets',
      icon: UserCircle,
      colorClass: {
        border: 'border-emerald-500',
        bg: 'bg-emerald-50',
        iconBg: 'bg-emerald-500',
        text: 'text-emerald-700'
      }
    },
    {
      id: 'TECHNICIAN',
      name: 'Technician',
      description: 'Handle and resolve maintenance tickets',
      icon: Wrench,
      colorClass: {
        border: 'border-amber-500',
        bg: 'bg-amber-50',
        iconBg: 'bg-amber-500',
        text: 'text-amber-700'
      }
    }
  ];

  const handleRoleSelect = async () => {
    if (!selectedRole) {
      setError('Please select a role to continue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/select-role', { role: selectedRole });
      // Server returns { user, token } — save the fresh token that includes the role
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      setUser(response.data.user || response.data);
      navigate('/resources');
    } catch (err) {
      console.error('Failed to set role:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to set role. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show spinner while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-600 mb-4"></div>
          <p className="text-xl text-gray-600 font-medium">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // Only show role picker for new users
  if (!isNewUser || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Smart Campus!</h1>
          <p className="text-gray-500">Hi <strong>{user.name}</strong>! Please choose your role to get started.</p>
          <p className="text-xs text-gray-400 mt-1">Admin access is assigned automatically for approved admin emails.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? `${role.colorClass.border} ${role.colorClass.bg} shadow-lg scale-105`
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className={`w-14 h-14 mb-4 rounded-full flex items-center justify-center ${
                  isSelected ? role.colorClass.iconBg : 'bg-gray-100'
                }`}>
                  <Icon className={`w-7 h-7 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <h3 className={`text-xl font-semibold mb-1 ${isSelected ? role.colorClass.text : 'text-gray-800'}`}>
                  {role.name}
                </h3>
                <p className="text-sm text-gray-500">{role.description}</p>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleRoleSelect}
          disabled={!selectedRole || loading}
          className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 ${
            selectedRole && !loading
              ? 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {loading ? 'Setting up your account...' : `Continue as ${roles.find(r => r.id === selectedRole)?.name || '...'}`}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          You can contact an administrator to change your role later.
        </p>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
