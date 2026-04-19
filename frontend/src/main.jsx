import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { GoogleOAuthProvider } from '@react-oauth/google'

// Prevent unhandled promise rejections from showing as alerts
window.addEventListener('unhandledrejection', (event) => {
  // Silently handle 401 errors from auth checks
  if (event.reason?.response?.status === 401) {
    event.preventDefault();
    console.log('Handled expected 401 error');
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
