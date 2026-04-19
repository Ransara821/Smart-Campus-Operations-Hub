import { useAuth } from '../context/AuthContext';
import { LogOut, LogIn } from 'lucide-react';

export const LoginButton = () => {
    const { user, logout } = useAuth();

    if (user) {
        return (
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    {user.avatarUrl && (
                        <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full" />
                    )}
                    <span className="text-sm font-medium text-gray-700">{user.name}</span>
                    <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">{user.role}</span>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>
        );
    }

    return (
        <div className="flex gap-3">
            <button
                onClick={() => { window.location.href = '/login'; }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:border-gray-400 rounded-lg transition-all font-medium text-gray-700"
            >
                <LogIn className="w-4 h-4" />
                Sign in
            </button>
        </div>
    );
};
