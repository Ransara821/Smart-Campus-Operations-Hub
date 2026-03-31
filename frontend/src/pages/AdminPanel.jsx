// AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Badge from '../components/Badge';
import axiosInstance from '../api/axiosInstance';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [userData, setUserData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({ name: '', email: '', role: 'USER' });
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await axiosInstance.get('/api/auth/me');
      setUserData(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get('/api/admin/users');
      setUsers(response.data);
    } catch (err) {
      setError('Failed to fetch users: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setSuccessMessage('');
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) {
      setError('Please select a user and role');
      return;
    }

    try {
      setUpdating(true);
      setError('');
      await axiosInstance.patch(`/api/admin/users/${selectedUser.id}/role`, null, {
        params: { role: newRole }
      });
      setSuccessMessage(`✨ User role updated to ${newRole}`);
      setSelectedUser({ ...selectedUser, role: newRole });
      fetchUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to update role: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await axiosInstance.delete(`/api/admin/users/${userId}`);
      setSuccessMessage('🗑️ User deleted successfully');
      setSelectedUser(null);
      fetchUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete user: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberForm.name || !newMemberForm.email) {
      setError('Please fill in all required fields');
      return;
    }

    if (!newMemberForm.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setAddingMember(true);
      setError('');
      await axiosInstance.post('/api/admin/users', {
        name: newMemberForm.name,
        email: newMemberForm.email,
        role: newMemberForm.role
      });
      setSuccessMessage('✅ Member added successfully');
      setNewMemberForm({ name: '', email: '', role: 'USER' });
      setShowAddMemberModal(false);
      fetchUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to add member: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setAddingMember(false);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div className="flex min-h-screen bg-gradient-main">
      <Sidebar user={userData} />
      
      <div className="flex-1 lg:ml-72 flex flex-col">
        <Header title="Team Members" subtitle="Manage your campus community" />
        
        <div className="flex-1 p-4 lg:p-8">
          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded-xl text-red-800 animate-shake">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-100 border-l-4 border-emerald-500 rounded-xl text-emerald-800 animate-slideDown">
              <div className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <span>{successMessage}</span>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            <div className="bg-gradient-to-br from-jordy-blue to-ylnmn-blue rounded-2xl p-5 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lavender/90 text-sm">Total Members</p>
                  <p className="text-3xl font-bold mt-1">{users.length}</p>
                </div>
                <div className="text-4xl opacity-80">👥</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-ylnmn-blue to-space-cadet rounded-2xl p-5 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lavender/90 text-sm">Active Now</p>
                  <p className="text-3xl font-bold mt-1">142</p>
                </div>
                <div className="text-4xl opacity-80">🟢</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-space-cadet to-oxford rounded-2xl p-5 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lavender/90 text-sm">New This Week</p>
                  <p className="text-3xl font-bold mt-1">24</p>
                </div>
                <div className="text-4xl opacity-80">✨</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-lavender to-jordy-blue rounded-2xl p-5 text-oxford shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-oxford/70 text-sm">Completion Rate</p>
                  <p className="text-3xl font-bold mt-1">94%</p>
                </div>
                <div className="text-4xl opacity-80">📈</div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white rounded-2xl shadow-lg p-4 lg:p-6 mb-8">
            <div className="flex flex-col lg:flex-row justify-between gap-4">
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => setShowAddMemberModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-ylnmn-blue to-space-cadet hover:from-space-cadet hover:to-oxford text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md flex items-center gap-2">
                  <span>➕</span> Add Member
                </button>
                <button className="px-5 py-2.5 bg-gradient-to-r from-lavender to-jordy-blue hover:from-jordy-blue hover:to-lavender text-oxford font-semibold rounded-xl transition-all duration-300 flex items-center gap-2">
                  <span>📥</span> Import
                </button>
                <button className="px-5 py-2.5 bg-gradient-to-r from-lavender to-jordy-blue hover:from-jordy-blue hover:to-lavender text-oxford font-semibold rounded-xl transition-all duration-300 flex items-center gap-2">
                  <span>📤</span> Export
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-jordy-blue focus:ring-2 focus:ring-jordy-blue/20 w-full lg:w-64 text-oxford"
                />
                <span className="absolute left-3 top-3 text-slate-400">🔍</span>
              </div>
            </div>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
              <p className="text-slate-600">Loading amazing members...</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-50 to-lavender/50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs lg:text-sm font-semibold text-oxford">Member</th>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs lg:text-sm font-semibold text-oxford">Contact</th>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs lg:text-sm font-semibold text-oxford hidden md:table-cell">Role</th>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs lg:text-sm font-semibold text-oxford">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentUsers.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                          <div className="text-5xl mb-3">👻</div>
                          No members found
                        </td>
                      </tr>
                    ) : (
                      currentUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gradient-to-r hover:from-lavender/40 hover:to-transparent transition-all duration-300 group">
                          <td className="px-4 lg:px-6 py-4">
                            <div className="flex items-center gap-3">
                              {user.picture ? (
                                <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ylnmn-blue to-space-cadet flex items-center justify-center text-white font-bold shadow-md">
                                  {user.name?.charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-oxford">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <p className="text-slate-600 text-sm">{user.phone || '—'}</p>
                          </td>
                          <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                            <Badge status={user.role} text={user.role} />
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSelectUser(user)}
                                className="p-2 text-ylnmn-blue hover:bg-lavender/40 rounded-lg transition-all duration-200"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center p-4 border-t border-gray-100">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-oxford hover:bg-lavender/40 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ← Previous
                  </button>
                    <span className="text-sm text-slate-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                      className="px-4 py-2 text-oxford hover:bg-lavender/40 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* User Detail Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
                <div className="bg-gradient-to-r from-ylnmn-blue to-space-cadet p-6 rounded-t-2xl">
                  <h2 className="text-2xl font-bold text-white">Update User Role</h2>
                  <p className="text-lavender/90 text-sm mt-1">Manage user permissions</p>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-oxford mb-2">Full Name</label>
                      <div className="bg-slate-50 rounded-xl p-3 text-oxford font-medium">
                        {selectedUser.name}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-oxford mb-2">Email Address</label>
                      <div className="bg-slate-50 rounded-xl p-3 text-slate-600">
                        {selectedUser.email}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-oxford mb-2">Current Role</label>
                      <Badge status={selectedUser.role} text={selectedUser.role} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-oxford mb-2">Assign New Role</label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-jordy-blue focus:ring-2 focus:ring-jordy-blue/20 transition-all"
                      >
                        <option value="USER">👤 User</option>
                        <option value="TECHNICIAN">🔧 Technician</option>
                        <option value="ADMIN">👑 Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleUpdateRole}
                      disabled={updating || newRole === selectedUser.role}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
                    >
                      {updating ? '⏳ Updating...' : '✓ Update Role'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(selectedUser.id)}
                      className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300"
                    >
                      🗑️ Delete
                    </button>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="flex-1 py-3 bg-lavender hover:bg-jordy-blue/50 text-oxford font-semibold rounded-xl transition-all duration-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Member Modal */}
          {showAddMemberModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
                <div className="bg-gradient-to-r from-ylnmn-blue to-space-cadet p-6 rounded-t-2xl">
                  <h2 className="text-2xl font-bold text-white">Add New Member</h2>
                  <p className="text-lavender/90 text-sm mt-1">Create a new team member account</p>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-oxford mb-2">Full Name *</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={newMemberForm.name}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-jordy-blue focus:ring-2 focus:ring-jordy-blue/20 text-oxford"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-oxford mb-2">Email Address *</label>
                      <input
                        type="email"
                        placeholder="john@example.com"
                        value={newMemberForm.email}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-jordy-blue focus:ring-2 focus:ring-jordy-blue/20 text-oxford"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-oxford mb-2">Assign Role</label>
                      <select
                        value={newMemberForm.role}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-jordy-blue focus:ring-2 focus:ring-jordy-blue/20 transition-all"
                      >
                        <option value="USER">👤 User</option>
                        <option value="TECHNICIAN">🔧 Technician</option>
                        <option value="ADMIN">👑 Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleAddMember}
                      disabled={addingMember}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
                    >
                      {addingMember ? '⏳ Adding...' : '✓ Add Member'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddMemberModal(false);
                        setNewMemberForm({ name: '', email: '', role: 'USER' });
                      }}
                      className="flex-1 py-3 bg-lavender hover:bg-jordy-blue/50 text-oxford font-semibold rounded-xl transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;