// Register.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiUserPlus } from 'react-icons/fi';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = useCallback(async (response) => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/auth/google-register`, {
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
        alert('Registration successful! Redirecting...');
        navigate('/dashboard');
      } else {
        const data = await res.json();
        setError(data.message || 'Google registration failed');
      }
    } catch (err) {
      setError('An error occurred with Google registration. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleGoogleSignIn = useCallback(() => {
    if (window.google?.accounts.id) {
      window.google.accounts.id.renderButton(
        document.getElementById('google-button-container'),
        { theme: 'outline', size: 'large', width: '100%' }
      );
    }
  }, []);

  useEffect(() => {
    if (window.google?.accounts.id) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
        callback: handleGoogleLogin
      });
      handleGoogleSignIn();
    }
  }, [handleGoogleLogin, handleGoogleSignIn]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        })
      });

      if (response.ok) {
        alert('✅ Registration successful! Please login.');
        navigate('/login');
      } else {
        const data = await response.json();
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center p-4 lg:p-8 py-12">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
        <div className="hidden lg:flex relative bg-gradient-to-br from-ylnmn-blue via-space-cadet to-oxford text-white p-10 xl:p-12 flex-col justify-between">
          <div className="absolute -top-16 -left-10 w-52 h-52 rounded-full bg-lavender/20 blur-2xl" />
          <div className="absolute -bottom-16 -right-10 w-52 h-52 rounded-full bg-jordy-blue/30 blur-2xl" />
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 border border-white/20 mb-6">
              <FiUserPlus className="text-3xl" />
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight">Create Account</h1>
            <p className="mt-4 text-lavender/90 max-w-md">
              Join Smart Campus to manage services, requests, and community updates in one place.
            </p>
          </div>
          <div className="relative z-10 space-y-3 text-sm text-lavender/95">
            <p>Quick registration flow</p>
            <p>Secure password protection</p>
            <p>Google sign up available</p>
          </div>
        </div>

        <div className="p-6 lg:p-10 animate-fadeIn">
          <div className="text-center mb-6 lg:hidden">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-oxford to-ylnmn-blue bg-clip-text text-transparent">
              ✍️ Create Account
            </h1>
            <p className="text-slate-600 mt-2">Join the Smart Campus community</p>
          </div>

          <div className="bg-white rounded-2xl p-0 lg:p-2 animate-scaleIn">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 text-sm animate-shake">
              <div className="flex items-center gap-2">
                <span>❌</span>
                <span>{error}</span>
              </div>
            </div>
          )}  

          {/* Google Register Button */}
          <div id="google-button-container" className="mb-6 flex justify-center"></div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-600">Or register with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-oxford mb-1">
                  <FiUser className="inline mr-2" />First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full px-4 py-2.5 border border-slate-300 bg-slate-50 text-oxford placeholder-slate-400 rounded-xl focus:outline-none focus:border-jordy-blue focus:ring-2 focus:ring-jordy-blue/20 transition-all"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-oxford mb-1">
                  <FiUser className="inline mr-2" />Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full px-4 py-2.5 border border-slate-300 bg-slate-50 text-oxford placeholder-slate-400 rounded-xl focus:outline-none focus:border-jordy-blue focus:ring-2 focus:ring-jordy-blue/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-oxford mb-1">
                <FiMail className="inline mr-2" />Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-slate-300 bg-slate-50 text-oxford placeholder-slate-400 rounded-xl focus:outline-none focus:border-jordy-blue focus:ring-2 focus:ring-jordy-blue/20 transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-oxford mb-1">
                <FiLock className="inline mr-2" />Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2.5 border border-slate-300 bg-slate-50 text-oxford placeholder-slate-400 rounded-xl focus:outline-none focus:border-jordy-blue focus:ring-2 focus:ring-jordy-blue/20 transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-oxford mb-1">
                <FiLock className="inline mr-2" />Confirm Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className="w-full px-4 py-2.5 border border-slate-300 bg-slate-50 text-oxford placeholder-slate-400 rounded-xl focus:outline-none focus:border-jordy-blue focus:ring-2 focus:ring-jordy-blue/20 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-ylnmn-blue to-space-cadet hover:from-space-cadet hover:to-oxford text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
              <FiUserPlus />
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-600 text-sm">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-ylnmn-blue hover:text-jordy-blue font-semibold transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default Register;