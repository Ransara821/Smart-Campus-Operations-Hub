import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, LogIn } from 'lucide-react';

export const LoginButton = () => {
    const { user, logout } = useAuth();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    if (user) {
        return (
            <>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        {user.avatarUrl && (
                            <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full" />
                        )}
                        <span className="text-sm font-medium text-gray-700">{user.name}</span>
                        <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">{user.role}</span>
                    </div>
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
                {showLogoutConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                            <div className="border-b border-gray-100 px-6 py-5">
                                <h2 className="text-xl font-bold text-gray-900">Confirm Logout</h2>
                                <p className="mt-1 text-sm text-gray-500">Are you sure you want to sign out of your account?</p>
                            </div>
                            <div className="px-6 py-5 space-y-4">
                                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    <span className="font-bold">{user?.name || 'User'}</span>
                                    <span className="text-red-600"> will be signed out. You'll need to sign in again to access your account.</span>
                                </div>
                                <div className="flex gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowLogoutConfirm(false)}
                                        className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 font-bold text-gray-700 transition-colors hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowLogoutConfirm(false);
                                            logout();
                                        }}
                                        className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 font-bold text-white transition-colors hover:bg-red-700"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
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
