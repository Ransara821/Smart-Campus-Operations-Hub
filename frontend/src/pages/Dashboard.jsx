// Dashboard.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Badge from '../components/Badge';
import axiosInstance from '../api/axiosInstance';
import { getRole } from '../utils/auth';
import { FiBookOpen, FiCheckCircle, FiClock, FiAward, FiCalendar, FiCode, FiBriefcase, FiCpu } from 'react-icons/fi';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userRole = getRole();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/auth/me');
      setUser(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load user data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { title: 'Active Courses', value: '12', icon: <FiBookOpen />, color: 'from-jordy-blue to-ylnmn-blue' },
    { title: 'Tasks Completed', value: '28', icon: <FiCheckCircle />, color: 'from-ylnmn-blue to-space-cadet' },
    { title: 'Hours Learned', value: '156', icon: <FiClock />, color: 'from-lavender to-jordy-blue' },
    { title: 'Achievements', value: '8', icon: <FiAward />, color: 'from-space-cadet to-oxford' },
  ];

  const events = [
    { title: 'Tech Workshop 2026', icon: <FiCpu />, date: 'April 10, 2026', time: '10:00 AM', color: 'from-jordy-blue to-ylnmn-blue' },
    { title: 'Campus Sports Day', icon: <FiAward />, date: 'April 15, 2026', time: '9:00 AM', color: 'from-ylnmn-blue to-space-cadet' },
    { title: 'Career Fair', icon: <FiBriefcase />, date: 'April 20, 2026', time: '11:00 AM', color: 'from-lavender to-jordy-blue' },
    { title: 'Hackathon 2026', icon: <FiCode />, date: 'April 25, 2026', time: '8:00 AM', color: 'from-space-cadet to-oxford' },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-main">
        <Sidebar user={user} />
        <div className="flex-1 lg:ml-72 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin text-5xl text-ylnmn-blue mb-4"><FiClock /></div>
            <p className="text-slate-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-main">
      <Sidebar user={user} />
      
      <div className="flex-1 lg:ml-72 flex flex-col">
        <Header title="Dashboard" subtitle="Welcome back to Smart Campus" />
        
        <div className="flex-1 p-4 lg:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded-xl text-red-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">❌</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Welcome Card */}
          {user && (
            <div className="mb-8 bg-gradient-to-r from-jordy-blue via-ylnmn-blue to-space-cadet rounded-2xl shadow-lg p-6 lg:p-8 text-white transform hover:scale-[1.02] transition-all duration-300 border border-lavender/20">
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="relative">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt="Profile"
                      className="w-24 h-24 rounded-full border-4 border-lavender shadow-xl object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-lavender/20 backdrop-blur flex items-center justify-center text-5xl font-bold border-4 border-lavender">
                      {user.firstName?.charAt(0).toUpperCase() || user.name?.charAt(0)}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <h2 className="text-3xl lg:text-4xl font-bold mb-2">Hello, {user.firstName || user.name}!</h2>
                  <p className="text-lavender/80 mb-3">{user.email}</p>
                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                    <Badge status={user.role} text={user.role} />
                    <span className="px-3 py-1.5 bg-lavender/20 backdrop-blur rounded-xl text-sm font-semibold">
                      🎓 Student ID: #SMART{Math.floor(Math.random() * 10000)}
                    </span>
                  </div>
                </div>
                <div className="text-center lg:text-right">
                  <div className="text-5xl mb-2">🏆</div>
                  <p className="text-sm text-lavender/80">Member since 2026</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`bg-gradient-to-r ${stat.color} rounded-2xl p-5 text-white shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer group border border-lavender/20`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/85 text-sm">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1 group-hover:animate-bounce">{stat.value}</p>
                  </div>
                  <div className="text-4xl opacity-80 group-hover:scale-110 transition-transform">
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Events */}
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-slate-200">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-bold text-oxford flex items-center gap-2">
                    📅 Upcoming Events
                  </h3>
                  <button className="text-ylnmn-blue text-sm hover:underline font-semibold">View all →</button>
                </div>
                <div className="space-y-3">
                  {events.map((event, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all cursor-pointer border border-slate-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 bg-gradient-to-r ${event.color} rounded-xl flex items-center justify-center text-white font-bold text-sm`}>
                          {event.date.split(',')[0].slice(0, 3)}
                        </div>
                        <div>
                          <p className="font-semibold text-oxford">{event.title}</p>
                          <p className="text-sm text-slate-500">{event.date} • {event.time}</p>
                        </div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 transition-all text-ylnmn-blue text-lg">
                        📍
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-slate-200">
                <h3 className="text-xl font-bold text-oxford mb-5 flex items-center gap-2">
                  🚀 Recent Activity
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all">
                    <div className="w-10 h-10 bg-gradient-to-r from-jordy-blue to-ylnmn-blue rounded-xl flex items-center justify-center text-white">✓</div>
                    <div className="flex-1">
                      <p className="font-medium text-oxford">✅ Completed "React Advanced" module</p>
                      <p className="text-sm text-slate-500">2 hours ago • 50 points earned</p>
                    </div>
                    <span className="text-emerald-600">+50</span>
                  </div>
                  <div className="flex gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all">
                    <div className="w-10 h-10 bg-gradient-to-r from-ylnmn-blue to-space-cadet rounded-xl flex items-center justify-center text-white">📚</div>
                    <div className="flex-1">
                      <p className="font-medium text-oxford">📖 Joined "Coding Club" workshop</p>
                      <p className="text-sm text-slate-500">5 hours ago • Registration confirmed</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all">
                    <div className="w-10 h-10 bg-gradient-to-r from-lavender to-jordy-blue rounded-xl flex items-center justify-center text-oxford">💬</div>
                    <div className="flex-1">
                      <p className="font-medium text-oxford">💌 New message from Professor Smith</p>
                      <p className="text-sm text-slate-500">1 day ago • About your project</p>
                    </div>
                    <span className="text-emerald-600">New</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-ylnmn-blue to-space-cadet rounded-2xl shadow-lg p-6 text-lavender border border-jordy-blue/20">
                <h3 className="text-xl font-bold mb-5 flex items-center gap-2">⚡ Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full py-3 px-4 bg-gradient-to-r from-jordy-blue to-lavender hover:from-lavender hover:to-jordy-blue text-oxford rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                    📚 Browse Courses
                  </button>
                  <button className="w-full py-3 px-4 bg-gradient-to-r from-lavender to-jordy-blue hover:from-jordy-blue hover:to-lavender text-oxford rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                    🗓️ Book Lab Session
                  </button>
                  <button className="w-full py-3 px-4 bg-gradient-to-r from-space-cadet to-ylnmn-blue hover:from-ylnmn-blue hover:to-space-cadet text-lavender rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                    🎓 View Grades
                  </button>
                  <button className="w-full py-3 px-4 bg-gradient-to-r from-ylnmn-blue to-space-cadet hover:from-space-cadet hover:to-ylnmn-blue text-lavender rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                    💡 Submit Feedback
                  </button>
                </div>
              </div>

              {/* Campus Info */}
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-slate-200">
                <h3 className="text-xl font-bold text-oxford mb-4 flex items-center gap-2">
                  ℹ️ Campus Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="font-semibold text-oxford">Location</p>
                      <p className="text-sm text-slate-500">Building A, 3rd Floor</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-2xl">📞</span>
                    <div>
                      <p className="font-semibold text-oxford">Support Hotline</p>
                      <p className="text-sm text-slate-500">+1 (234) 567-8900</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-2xl">📧</span>
                    <div>
                      <p className="font-semibold text-oxford">Email Support</p>
                      <p className="text-sm text-slate-500">support@campus.edu</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Card */}
              <div className="bg-gradient-to-r from-ylnmn-blue to-space-cadet rounded-2xl shadow-lg p-6 text-lavender border border-jordy-blue/20">
                <h3 className="text-xl font-bold mb-3">🎯 Your Progress</h3>
                <p className="text-lavender/70 text-sm mb-4">Overall completion rate</p>
                <div className="relative">
                  <div className="w-full bg-lavender/30 rounded-full h-3">
                    <div className="bg-lavender h-3 rounded-full animate-slideIn" style={{ width: '68%' }}></div>
                  </div>
                  <p className="text-right mt-2 font-bold text-xl">68%</p>
                </div>
                <div className="mt-4 pt-4 border-t border-lavender/30">
                  <div className="flex justify-between text-sm">
                    <span>📚 12/18 Courses</span>
                    <span>🏆 8 Achievements</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Section */}
          {userRole === 'ADMIN' && (
            <div className="mt-8 bg-gradient-to-r from-lavender via-jordy-blue to-ylnmn-blue rounded-2xl shadow-lg p-6 text-oxford transform hover:scale-[1.02] transition-all duration-300 border border-lavender/20">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">🔒</div>
                  <div>
                    <h3 className="text-2xl font-bold">Admin Access 👤</h3>
                    <p className="text-oxford/80">Manage users, roles, and system settings</p>
                  </div>
                </div>
                <a
                  href="/admin"
                  className="px-8 py-3 bg-white text-ylnmn-blue font-bold rounded-xl hover:shadow-xl transition-all transform hover:scale-105"
                >
                  Go to Admin Panel →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;