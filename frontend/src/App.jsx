import { BrowserRouter, Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { BookingsPage } from './pages/BookingsPage';
import { TicketsPage } from './pages/TicketsPage';
import { QRVerificationPage } from './pages/QRVerificationPage';
import { NotificationsPage } from './pages/NotificationsPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import { LandingPage } from './pages/LandingPage';
import {
  Bell, LayoutDashboard, CalendarDays, Ticket, Scan,
  LogOut, Building2, GraduationCap, Wrench, ShieldCheck
} from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from './api/axios';
import './App.css';

// ─── Page title resolver ────────────────────────────────────────────
function usePageTitle(pathname) {
  const map = {
    '/resources':     { title: 'Facilities & Assets', icon: Building2 },
    '/bookings':      { title: 'My Bookings',          icon: CalendarDays },
    '/tickets':       { title: 'Maintenance Tickets',  icon: Ticket },
    '/notifications': { title: 'Notifications',        icon: Bell },
    '/verify-qr':     { title: 'QR Verification',      icon: Scan },
  };
  return map[pathname] || { title: 'SmartCampus', icon: LayoutDashboard };
}

// ─── Sidebar ────────────────────────────────────────────────────────
function Sidebar({ user, unreadCount, onLogout }) {
  const navItems = [
    { to: '/resources',     label: 'Facilities',   icon: Building2     },
    { to: '/bookings',      label: 'Bookings',     icon: CalendarDays  },
    { to: '/tickets',       label: 'Tickets',      icon: Ticket        },
    { to: '/notifications', label: 'Notifications',icon: Bell, badge: unreadCount },
    ...(user?.role === 'ADMIN' ? [{ to: '/verify-qr', label: 'Verify QR', icon: Scan }] : []),
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
            {badge > 0 && (
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
          <button onClick={onLogout} className="sidebar-logout-btn" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
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

  const isPublicPage = ['/', '/login', '/select-role', '/verify-qr'].includes(location.pathname);
  const showLayout = user && !isPublicPage;

  if (showLayout) {
    return (
      <div className="app-layout">
        <Sidebar user={user} unreadCount={unreadCount} onLogout={logout} />
        <TopHeader pathname={location.pathname} unreadCount={unreadCount} />
        <main className="app-main">
          <Routes>
            <Route path="/resources"     element={<ResourcesPage />} />
            <Route path="/bookings"      element={<BookingsPage />} />
            <Route path="/tickets"       element={<TicketsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/verify-qr"     element={<QRVerificationPage />} />
            <Route path="*"              element={<ResourcesPage />} />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/"            element={<LandingPage />} />
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
