import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LoginButton } from './components/LoginButton';
import { LoginPage } from './pages/LoginPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { BookingsPage } from './pages/BookingsPage';
import { TicketsPage } from './pages/TicketsPage';
import { QRVerificationPage } from './pages/QRVerificationPage';
import { NotificationsPage } from './pages/NotificationsPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import { LandingPage } from './pages/LandingPage';
import { Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from './api/axios';

function AppContent() {
  const { user, loading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const res = await axios.get('/api/notifications?unreadOnly=true');
      setUnreadCount(res.data.length);
    } catch (error) {
      console.error('Failed to load notification count:', error);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-xl text-gray-600 font-medium">Loading SmartCampus...</p>
        <p className="text-sm text-gray-400 mt-2">Please wait while we connect to the server</p>
      </div>
    </div>
  );

  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 w-full relative">
      {!isLandingPage && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex gap-8 items-center">
                <Link to="/" className="text-2xl font-black text-primary-600 tracking-tight">
                  SmartCampus
                </Link>
                {user && (
                  <nav className="flex gap-4">
                    <Link to="/resources" className="text-gray-600 hover:text-primary-600 font-medium">Facilities</Link>
                    <Link to="/bookings" className="text-gray-600 hover:text-primary-600 font-medium">Bookings</Link>
                    <Link to="/tickets" className="text-gray-600 hover:text-primary-600 font-medium">Tickets</Link>
                    <Link to="/notifications" className="text-gray-600 hover:text-primary-600 font-medium relative">
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link to="/verify-qr" className="text-gray-600 hover:text-primary-600 font-medium">Verify QR</Link>
                    )}
                  </nav>
                )}
              </div>
              <LoginButton />
            </div>
          </div>
        </header>
      )}

      <main className="w-full">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/verify-qr" element={<QRVerificationPage />} />
          <Route path="/select-role" element={<RoleSelectionPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes - require login */}
          {!user ? (
            <Route path="*" element={<LoginPage />} />
          ) : (
            <>
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

