import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { UserEditModal } from '../components/UserEditModal';
import { 
    Users, Search, Edit3, Trash2, Shield, Wrench, GraduationCap, 
    Mail, MoreVertical, ShieldCheck, Filter, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UsersPage = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [error, setError] = useState('');
    const [toast, setToast] = useState({ message: '', tone: 'success' });
    const [userToDelete, setUserToDelete] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (!toast.message) {
            return;
        }

        const timeoutId = setTimeout(() => setToast({ message: '', tone: 'success' }), 3000);
        return () => clearTimeout(timeoutId);
    }, [toast]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/users');
            setUsers(res.data);
            setError('');
        } catch (error) {
            setError('Failed to fetch users. Access might be restricted.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (userId, updates) => {
        try {
            await axios.put(`/api/users/${userId}`, updates);
            setEditingUser(null);
            await fetchUsers();
            setToast({ message: 'Changes saved successfully.', tone: 'success' });
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update user');
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await axios.delete(`/api/users/${userToDelete.id}`);
            setUserToDelete(null);
            await fetchUsers();
            setToast({ message: 'Deleted Successfully', tone: 'danger' });
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(search.toLowerCase()) || 
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.role?.toLowerCase().includes(search.toLowerCase())
    );

    const RoleBadge = ({ role }) => {
        const config = {
            ADMIN: { icon: ShieldCheck, color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-200', label: 'Admin' },
            TECHNICIAN: { icon: Wrench, color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-200', label: 'Technician' },
            USER: { icon: GraduationCap, color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', label: 'Student' }
        };
        const s = config[role] || config.USER;
        const Icon = s.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${s.bg} ${s.color} ${s.border}`}>
                <Icon className="w-3 h-3" />
                {s.label}
            </span>
        );
    };

    return (
        <div className="p-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl border bg-white/95 px-4 py-3 text-sm font-semibold shadow-lg backdrop-blur-sm transition-all duration-300 ${toast.message ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none'} ${toast.tone === 'danger' ? 'border-red-200 text-red-700' : 'border-emerald-200 text-emerald-700'}`}>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${toast.tone === 'danger' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {toast.tone === 'danger' ? <Trash2 className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </div>
                <span>{toast.message}</span>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary-600" />
                        User Management
                    </h1>
                    <p className="text-sm font-medium text-gray-500">View and manage system permissions for all campus users.</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search users by name, email or role..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm text-sm font-medium"
                        />
                    </div>
                    <button className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                        <Filter className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl font-bold text-sm flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User Account</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-10 bg-gray-100 rounded-lg w-48"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 bg-gray-100 rounded-lg w-20 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center text-gray-400 font-medium italic">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-xl object-cover ring-2 ring-gray-100" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                                    {user.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 mb-0.5 truncate flex items-center gap-1.5">
                                                    {user.name}
                                                    {user.id === currentUser?.id && (
                                                        <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-md font-extrabold uppercase">You</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <RoleBadge role={user.role} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => setEditingUser(user)}
                                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                title="Edit User"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            {user.id !== currentUser?.id && (
                                                <button 
                                                    onClick={() => setUserToDelete(user)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingUser && (
                <UserEditModal 
                    user={editingUser} 
                    onClose={() => setEditingUser(null)} 
                    onSave={handleUpdateUser} 
                />
            )}

            {userToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="border-b border-gray-100 px-6 py-5">
                            <h2 className="text-xl font-bold text-gray-900">Confirm Deletion</h2>
                            <p className="mt-1 text-sm text-gray-500">Please confirm if you want to permanently delete this user.</p>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <span className="font-bold">{userToDelete.name}</span>
                                <span className="text-red-600"> ({userToDelete.email}) will be removed. This action cannot be undone.</span>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setUserToDelete(null)}
                                    className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 font-bold text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteUser}
                                    className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 font-bold text-white transition-colors hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
