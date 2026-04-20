import { useState } from 'react';
import { X, User, Shield, Wrench, UserPlus } from 'lucide-react';

export const UserEditModal = ({ user, onClose, onSave }) => {
    const [name, setName] = useState(user.name);
    const [role, setRole] = useState(user.role);
    const [submitting, setSubmitting] = useState(false);

    const roles = [
        { value: 'USER', label: 'User', icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { value: 'TECHNICIAN', label: 'Technician', icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50' },
        { value: 'ADMIN', label: 'Admin', icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        await onSave(user.id, { name, role });
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-primary-600" />
                        Edit User Profile
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-medium text-gray-900"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">System Role</label>
                        <div className="grid grid-cols-1 gap-3">
                            {roles.map((r) => {
                                const Icon = r.icon;
                                const isSelected = role === r.value;
                                return (
                                    <button
                                        key={r.value}
                                        type="button"
                                        onClick={() => setRole(r.value)}
                                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                                            isSelected 
                                            ? `border-primary-500 bg-primary-50 shadow-sm` 
                                            : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-white shadow-sm' : r.bg}`}>
                                            <Icon className={`w-5 h-5 ${isSelected ? 'text-primary-600' : r.color}`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-bold text-sm ${isSelected ? 'text-primary-900' : 'text-gray-900'}`}>{r.label}</p>
                                            <p className="text-xs text-gray-500">Access level and permissions</p>
                                        </div>
                                        {isSelected && (
                                            <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-white"></div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 disabled:bg-gray-400 transition-all shadow-md active:scale-95"
                        >
                            {submitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
