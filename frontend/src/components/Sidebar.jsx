// Sidebar.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiUser, FiUsers, FiFolder, FiCheckSquare, FiBarChart2, FiMessageSquare, FiSettings, FiLogOut, FiArchive, FiMail } from 'react-icons/fi';
import { removeToken, getRole } from '../utils/auth';

function Sidebar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = getRole();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { label: 'Dashboard', icon: <FiHome />, path: '/dashboard', roles: ['USER', 'ADMIN', 'TECHNICIAN'], color: 'from-jordy-blue to-ylnmn-blue' },
    { label: 'Profile', icon: <FiUser />, path: '/profile', roles: ['USER', 'ADMIN', 'TECHNICIAN'], color: 'from-ylnmn-blue to-space-cadet' },
    { label: 'Users', icon: <FiUsers />, path: '/admin', roles: ['ADMIN'], color: 'from-lavender to-jordy-blue' },
    { label: 'Projects', icon: <FiFolder />, path: '#', roles: ['ADMIN', 'TECHNICIAN'], color: 'from-space-cadet to-oxford' },
    { label: 'Tasks', icon: <FiCheckSquare />, path: '#', roles: ['ADMIN', 'TECHNICIAN'], color: 'from-jordy-blue to-ylnmn-blue' },
    { label: 'Analytics', icon: <FiBarChart2 />, path: '#', roles: ['ADMIN'], color: 'from-ylnmn-blue to-lavender' },
    { label: 'Messages', icon: <FiMessageSquare />, path: '#', roles: ['USER', 'ADMIN', 'TECHNICIAN'], color: 'from-lavender to-jordy-blue' },
    { label: 'Settings', icon: <FiSettings />, path: '#', roles: ['ADMIN'], color: 'from-space-cadet to-oxford' },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 lg:p-6 border-b border-lavender/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-jordy-blue to-ylnmn-blue rounded-xl flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-xl text-white"><FiArchive /></span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-lavender">Smart Campus</h1>
            <p className="text-lavender/60 text-xs mt-0.5">Management System</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 lg:p-5 space-y-1.5 overflow-y-auto">
        {filteredItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={(e) => {
              if (item.path === '#') e.preventDefault();
              setIsMobileMenuOpen(false);
            }}
            className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              isActive(item.path)
                ? `bg-gradient-to-r ${item.color} text-white shadow-lg scale-105`
                : 'text-lavender/70 hover:text-lavender hover:bg-lavender/10 hover:scale-105'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium text-sm lg:text-base">{item.label}</span>
            {isActive(item.path) && (
              <div className="absolute right-3 w-1.5 h-1.5 bg-lavender rounded-full animate-pulse" />
            )}
          </Link>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-lavender/20 p-4 lg:p-5">
        {user && (
          <div className="mb-4 p-3 bg-lavender/10 rounded-xl backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-jordy-blue to-ylnmn-blue rounded-full flex items-center justify-center text-lavender font-bold shadow-lg">
                {user.firstName?.charAt(0).toUpperCase() || user.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lavender font-semibold text-sm truncate flex items-center gap-2">{user.firstName || user.name} <FiUser /></p>
                <p className="text-lavender/60 text-xs truncate flex items-center gap-2"><FiMail /> {user.email}</p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-ylnmn-blue to-space-cadet hover:from-space-cadet hover:to-oxford text-lavender font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
        >
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white/90 backdrop-blur rounded-xl shadow-lg"
      >
        <span className="text-2xl">{isMobileMenuOpen ? '✕' : '☰'}</span>
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 bg-gradient-to-br from-oxford via-space-cadet to-ylnmn-blue min-h-screen fixed left-0 top-0 shadow-2xl border-r border-jordy-blue/20">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 w-72 h-full bg-gradient-to-br from-oxford via-space-cadet to-ylnmn-blue z-50 shadow-2xl animate-slideIn lg:hidden border-r border-jordy-blue/20">
            <SidebarContent />
          </div>
        </>
      )}
    </>
  );
}

export default Sidebar;