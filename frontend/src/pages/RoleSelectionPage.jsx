import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { UserCircle, Wrench } from 'lucide-react';

const RoleSelectionPage = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const roles = [
    {
      id: 'USER',
      name: 'User',
      description: 'Book resources and raise tickets',
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
      description: 'Handle maintenance tickets',
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
      setUser(response.data);
      navigate('/');
    } catch (err) {
      console.error('Failed to set role:', err);
      setError('Failed to set role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Smart Campus</h1>
          <p className="text-gray-600">Please select your role to continue</p>
          <p className="text-xs text-gray-500 mt-2">Admin access is assigned automatically for approved admin emails.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? `${role.colorClass.border} ${role.colorClass.bg} shadow-lg scale-105`
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  isSelected ? role.colorClass.iconBg : 'bg-gray-100'
                }`}>
                  <Icon className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${
                  isSelected ? role.colorClass.text : 'text-gray-800'
                }`}>
                  {role.name}
                </h3>
                <p className="text-sm text-gray-600">{role.description}</p>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleRoleSelect}
          disabled={!selectedRole || loading}
          className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 ${
            selectedRole && !loading
              ? 'bg-gradient-to-r from-cyan-600 to-slate-800 hover:from-cyan-700 hover:to-slate-900 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {loading ? 'Setting up your account...' : 'Continue'}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          You can change your role later by contacting an administrator
        </p>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
