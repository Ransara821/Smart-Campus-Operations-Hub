// Profile.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import axiosInstance from '../api/axiosInstance';
import { getRole } from '../utils/auth';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  
  const userRole = getRole();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/auth/me');
      setUser(response.data);
      setFormData({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        email: response.data.email || '',
      });
      setError('');
    } catch (err) {
      setError('❌ Failed to load profile data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axiosInstance.put('/api/auth/profile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      });
      setUser(response.data);
      setSuccess('✅ Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('❌ Failed to update profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Sidebar user={user} />
        <div className="flex-1 lg:ml-72 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin text-5xl mb-4">⏳</div>
            <p className="text-slate-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-main">
      <Sidebar user={user} />
      
      <div className="flex-1 lg:ml-72 flex flex-col">
        <Header title="My Profile" subtitle="Manage your account information" />
        
        <div className="flex-1 p-4 lg:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded-xl text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-100 border-l-4 border-emerald-500 rounded-xl text-emerald-800">
              {success}
            </div>
          )}

          {user && (
            <div className="max-w-4xl">
              {/* Profile Header Card */}
              <div className="mb-8 bg-gradient-to-r from-jordy-blue to-lavender rounded-2xl shadow-lg p-8 text-oxford">
                <div className="flex items-center gap-6 flex-col lg:flex-row">
                  <div className="w-24 h-24 bg-gradient-to-br from-jordy-blue to-ylnmn-blue rounded-full flex items-center justify-center text-5xl shadow-lg border-4 border-lavender">
                    {user.firstName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 text-center lg:text-left">
                    <h1 className="text-4xl font-bold mb-2">
                      {user.firstName} {user.lastName}
                    </h1>
                    <p className="text-oxford/70 text-lg mb-3">📧 {user.email}</p>
                    <div className="flex gap-3 justify-center lg:justify-start">
                      <span className="px-4 py-2 bg-oxford/20 rounded-full font-semibold">
                        🎓 {userRole || 'User'}
                      </span>
                      <span className="px-4 py-2 bg-oxford/20 rounded-full font-semibold">
                        ✅ Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Information */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-oxford flex items-center gap-2">
                      📋 Account Information
                    </h2>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-gradient-to-r from-ylnmn-blue to-space-cadet text-white rounded-lg font-semibold hover:scale-105 transition-all duration-300"
                      >
                        ✏️ Edit
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block text-oxford text-sm font-semibold mb-2">
                          👤 First Name
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg text-oxford placeholder-slate-400 focus:border-jordy-blue focus:outline-none transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-oxford text-sm font-semibold mb-2">
                          👨‍👩‍👦 Last Name
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg text-oxford placeholder-slate-400 focus:border-jordy-blue focus:outline-none transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-oxford text-sm font-semibold mb-2">
                          📧 Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg text-oxford placeholder-slate-400 focus:border-jordy-blue focus:outline-none transition-all"
                          required
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:scale-105 transition-all duration-300 disabled:opacity-50"
                        >
                          💾 Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setFormData({
                              firstName: user.firstName || '',
                              lastName: user.lastName || '',
                              email: user.email || '',
                            });
                          }}
                          className="flex-1 px-4 py-3 bg-slate-100 text-oxford rounded-lg font-semibold hover:scale-105 transition-all duration-300 border-2 border-slate-200"
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="pb-4 border-b border-slate-200">
                        <p className="text-slate-500 text-sm">👤 First Name</p>
                        <p className="text-oxford text-xl font-semibold">{user.firstName}</p>
                      </div>
                      <div className="pb-4 border-b border-slate-200">
                        <p className="text-slate-500 text-sm">👨‍👩‍👦 Last Name</p>
                        <p className="text-oxford text-xl font-semibold">{user.lastName}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-sm">📧 Email</p>
                        <p className="text-oxford text-xl font-semibold">{user.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats Sidebar */}
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                    <p className="text-slate-500 text-sm mb-2">🎓 Role</p>
                    <p className="text-oxford text-2xl font-bold capitalize">{userRole}</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                    <p className="text-slate-500 text-sm mb-2">📅 Joined</p>
                    <p className="text-oxford text-lg font-bold">
                      {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                    <p className="text-slate-500 text-sm mb-2">✅ Status</p>
                    <p className="text-emerald-600 text-lg font-bold">🟢 Active</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
                <h3 className="text-2xl font-bold text-oxford mb-6 flex items-center gap-2">
                  🛠️ Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-4 bg-gradient-to-r from-ylnmn-blue to-space-cadet text-white rounded-lg font-semibold hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                    🔐 Change Password
                  </button>
                  <button className="p-4 bg-gradient-to-r from-ylnmn-blue to-space-cadet text-white rounded-lg font-semibold hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                    🔔 Notifications
                  </button>
                  <button className="p-4 bg-gradient-to-r from-ylnmn-blue to-space-cadet text-white rounded-lg font-semibold hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                    ⚙️ Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
