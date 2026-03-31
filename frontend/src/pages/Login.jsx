// Login.jsx
import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiLogIn, FiMail, FiLock } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'google'
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleGoogleLoginCallback = useCallback(async (response) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8089'}/api/auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: response.credential
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        navigate('/dashboard');
      } else {
        const data = await res.json();
        setError(data.message || 'Google login failed');
      }
    } catch (err) {
      setError('An error occurred with Google login. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8089'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        navigate('/dashboard');
      } else {
        const data = await res.json();
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error details:', err);
      if (err.message === 'Failed to fetch') {
        setError('Unable to reach the server. Please check your backend is running and API URL is correct.');
      } else {
        setError('An error occurred during login. Please try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.google && loginMethod === 'google') {
      const buttonElement = document.getElementById('google-login-button');
      if (buttonElement) {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
          callback: handleGoogleLoginCallback
        });
        
        window.google.accounts.id.renderButton(
          buttonElement,
          {
            theme: 'outline',
            size: 'large',
            width: '100%'
          }
        );
      }
    }
  }, [loginMethod, handleGoogleLoginCallback]);

  const handleOAuthLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:8089'}/oauth2/authorization/google`;
  };

  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
        <div className="hidden lg:flex relative bg-gradient-to-br from-oxford via-space-cadet to-ylnmn-blue text-white p-10 xl:p-12 flex-col justify-between">
          <div className="absolute -top-16 -left-10 w-52 h-52 rounded-full bg-lavender/20 blur-2xl" />
          <div className="absolute -bottom-16 -right-10 w-52 h-52 rounded-full bg-jordy-blue/30 blur-2xl" />
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 border border-white/20 mb-6">
              <FiHome className="text-3xl" />
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight">Smart Campus</h1>
            <p className="mt-4 text-lavender/90 max-w-md">
              Access your dashboard, facilities and campus services with one secure sign in.
            </p>
          </div>
          <div className="relative z-10 space-y-3 text-sm text-lavender/95">
            <p>Secure JWT sessions</p>
            <p>Email or Google login</p>
            <p>Fast access on all devices</p>
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10 animate-fadeIn">
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-jordy-blue to-ylnmn-blue rounded-2xl mb-4 shadow-xl">
              <span className="text-3xl text-white"><FiHome /></span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-oxford to-ylnmn-blue bg-clip-text text-transparent">
              Smart Campus
            </h1>
            <p className="text-slate-600 mt-2">Sign in to continue</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded-xl text-red-800 text-sm animate-shake">
              <span className="font-semibold">⚠️ {error}</span>
            </div>
          )}

          <div className="bg-white rounded-2xl p-0 lg:p-2">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-oxford">Welcome Back!</h2>
            <p className="text-slate-600 text-sm mt-1">Please sign in to your account</p>
          </div>

          {/* Login Method Tabs */}
          <div className="flex gap-2 mb-6 bg-slate-50 p-1 rounded-lg">
            <button
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all ${
                loginMethod === 'email'
                  ? 'bg-gradient-to-r from-jordy-blue to-ylnmn-blue text-white'
                  : 'bg-transparent text-oxford hover:bg-slate-100'
              }`}
            >
              <FiMail className="inline mr-2" />
              Email
            </button>
            <button
              onClick={() => setLoginMethod('google')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all ${
                loginMethod === 'google'
                  ? 'bg-gradient-to-r from-jordy-blue to-ylnmn-blue text-white'
                  : 'bg-transparent text-oxford hover:bg-slate-100'
              }`}
            >
              <FcGoogle className="inline mr-2" />
              Google
            </button>
          </div>

          {/* Email/Password Login Form */}
          {loginMethod === 'email' && (
            <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-oxford mb-2">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-jordy-blue focus:ring-2 focus:ring-jordy-blue/20 text-oxford disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-oxford mb-2">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-jordy-blue focus:ring-2 focus:ring-jordy-blue/20 text-oxford disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-jordy-blue to-ylnmn-blue hover:from-ylnmn-blue hover:to-jordy-blue text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FiLogIn className="text-lg" />
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Google Login */}
          {loginMethod === 'google' && (
            <div className="space-y-4">
              <div id="google-login-button" className="flex justify-center"></div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-600">Or use OAuth2</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOAuthLogin}
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-space-cadet to-oxford hover:from-oxford hover:to-space-cadet text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="text-xl">🔐</span>
                {loading ? 'Signing in...' : 'Sign in with OAuth2'}
              </button>
            </div>
          )}

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-600 text-sm">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-oxford hover:text-jordy-blue font-semibold transition-colors"
              >
                ✍️ Create one
              </button>
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default Login;