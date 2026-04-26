import { BrowserRouter, Routes, Route, Link, NavLink, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { BookingsPage } from './pages/BookingsPage';
import { TicketsPage } from './pages/TicketsPage';
import { QRVerificationPage } from './pages/QRVerificationPage';
import { NotificationsPage } from './pages/NotificationsPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import { LandingPage } from './pages/LandingPage';
import { AboutUsPage } from './pages/AboutUsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { UsersPage } from './pages/UsersPage';
import {
  Bell, LayoutDashboard, CalendarDays, Ticket, Scan,
  LogOut, Building2, GraduationCap, Wrench, ShieldCheck, Users
} from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from './api/axios';
import './App.css';

// ─── Page title resolver ────────────────────────────────────────────
function usePageTitle(pathname) {
  const map = {
    '/dashboard':     { title: 'Admin Dashboard',      icon: LayoutDashboard },
    '/resources':     { title: 'Facilities & Assets',  icon: Building2 },
    '/bookings':      { title: 'Bookings',              icon: CalendarDays },
    '/tickets':       { title: 'Maintenance Tickets',  icon: Ticket },
    '/notifications': { title: 'Notifications',        icon: Bell },
    '/verify-qr':     { title: 'QR Verification',      icon: Scan },
    '/users':         { title: 'User Management',      icon: Users },
  };
  return map[pathname] || { title: 'SmartCampus', icon: LayoutDashboard };
}

// ─── Sidebar ────────────────────────────────────────────────────────
function Sidebar({ user, unreadCount, onLogout, showLogoutConfirm, setShowLogoutConfirm }) {
  const navItems = [
    ...(user?.role === 'ADMIN' ? [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    { to: '/resources',     label: 'Facilities',    icon: Building2    },
    { to: '/bookings',      label: 'Bookings',      icon: CalendarDays },
    { to: '/tickets',       label: 'Tickets',       icon: Ticket       },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    ...(user?.role === 'ADMIN' ? [
      { to: '/verify-qr', label: 'Verify QR', icon: Scan },
      { to: '/users', label: 'Users', icon: Users }
    ] : []),
  ];

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const roleIcon = {
    ADMIN: <ShieldCheck className="w-3 h-3" />,
    TECHNICIAN: <Wrench className="w-3 h-3" />,
    USER: <GraduationCap className="w-3 h-3" />,
  }[user?.role] || null;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link to="/" className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <span className="sidebar-logo-text">
          Smart<span>Campus</span>
        </span>
      </Link>

      {/* Nav */}
      <span className="sidebar-section-label">Navigation</span>
      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icon className="sidebar-icon" />
            {label}
            {badge === 'new' && (
              <span className="dash-nav-badge">new</span>
            )}
            {typeof badge === 'number' && badge > 0 && (
              <span className="sidebar-badge">{badge > 9 ? '9+' : badge}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-divider" />

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="sidebar-user-avatar" />
          ) : (
            <div className="sidebar-user-avatar-placeholder">{initials}</div>
          )}
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-role" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              {roleIcon}{user?.role || 'GUEST'}
            </div>
          </div>
          <button onClick={() => setShowLogoutConfirm(true)} className="sidebar-logout-btn" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
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
                    onLogout();
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
    </aside>
  );
}

// ─── Top Header ─────────────────────────────────────────────────────
function TopHeader({ pathname, unreadCount }) {
  const { title, icon: PageIcon } = usePageTitle(pathname);
  return (
    <header className="app-header">
      <div className="header-page-title">
        <PageIcon className="w-5 h-5 text-cyan-600" />
        {title}
      </div>
      <div className="header-actions">
        <Link to="/notifications" className="header-bell-btn" title="Notifications">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="header-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </Link>
      </div>
    </header>
  );
}

// ─── App Content ─────────────────────────────────────────────────────
function AppContent() {
  const { user, loading, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const res = await axios.get('/api/notifications?unreadOnly=true');
      setUnreadCount(res.data.length);
    } catch {}
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, border: '4px solid #e2e8f0', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ fontSize: '1.1rem', color: '#475569', fontWeight: 600 }}>Loading SmartCampus...</p>
      </div>
    </div>
  );

  const isPublicPage = ['/', '/about-us', '/login', '/select-role', '/verify-qr'].includes(location.pathname);
  const showLayout = user && !isPublicPage;

  if (showLayout) {
    return (
      <div className="app-layout">
        <Sidebar user={user} unreadCount={unreadCount} onLogout={logout} showLogoutConfirm={showLogoutConfirm} setShowLogoutConfirm={setShowLogoutConfirm} />
        <TopHeader pathname={location.pathname} unreadCount={unreadCount} />
        <main className="app-main">
          <Routes>
            {user?.role === 'ADMIN' && (
              <Route path="/dashboard" element={<AdminDashboard />} />
            )}
            <Route path="/resources"     element={<ResourcesPage />} />
            <Route path="/bookings"      element={<BookingsPage />} />
            <Route path="/tickets"       element={<TicketsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/verify-qr"     element={<QRVerificationPage />} />
            {user?.role === 'ADMIN' && (
              <Route path="/users" element={<UsersPage />} />
            )}
            <Route path="*" element={
              user?.role === 'ADMIN'
                ? <Navigate to="/dashboard" replace />
                : <ResourcesPage />
            } />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/"            element={<LandingPage />} />
      <Route path="/about-us"    element={<AboutUsPage />} />
      <Route path="/login"       element={<LoginPage />} />
      <Route path="/select-role" element={<RoleSelectionPage />} />
      <Route path="/verify-qr"   element={<QRVerificationPage />} />
      <Route path="*"            element={<LoginPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
