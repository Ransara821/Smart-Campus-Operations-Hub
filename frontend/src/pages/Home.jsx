// Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBarChart2, FiUsers, FiShield, FiSmartphone, FiZap, FiStar, FiArrowRight, FiPlayCircle, FiTrendingUp, FiCheckCircle, FiPhone, FiHome } from 'react-icons/fi';

function Home() {
  const navigate = useNavigate();

  const features = [
    { icon: <FiBarChart2 />, title: 'Smart Dashboard', desc: 'Real-time analytics and insights', color: 'from-jordy-blue to-ylnmn-blue' },
    { icon: <FiUsers />, title: 'User Management', desc: 'Role-based access control', color: 'from-ylnmn-blue to-space-cadet' },
    { icon: <FiShield />, title: 'Secure Platform', desc: 'Enterprise-grade security', color: 'from-lavender to-jordy-blue' },
    { icon: <FiSmartphone />, title: 'Mobile Ready', desc: 'Fully responsive design', color: 'from-space-cadet to-oxford' },
    { icon: <FiZap />, title: 'Fast Performance', desc: 'Optimized for speed', color: 'from-jordy-blue to-ylnmn-blue' },
    { icon: <FiStar />, title: 'Modern UI', desc: 'Beautiful interface', color: 'from-lavender to-jordy-blue' },
  ];

  return (
    <div className="min-h-screen bg-gradient-main">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-jordy-blue to-ylnmn-blue rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl text-white"><FiHome /></span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-oxford to-ylnmn-blue bg-clip-text text-transparent">
                Smart Campus
              </h1>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-gradient-to-r from-ylnmn-blue to-space-cadet hover:from-space-cadet hover:to-oxford text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-md flex items-center gap-2"
            >
              Get Started <FiArrowRight />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 lg:pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-lavender/50 rounded-full border border-jordy-blue/30">
              <span className="text-sm font-semibold text-ylnmn-blue">The Future of Education</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-oxford to-ylnmn-blue bg-clip-text text-transparent">
              Smart Campus
              <span className="block text-3xl lg:text-4xl mt-2 bg-gradient-to-r from-jordy-blue to-ylnmn-blue bg-clip-text text-transparent">
                Management System
              </span>
            </h1>
            <p className="text-xl text-slate-700 max-w-3xl mx-auto mb-8 leading-relaxed">
              Transform your campus experience with our intelligent platform. 
              Manage users, track progress, and streamline operations all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-gradient-to-r from-ylnmn-blue to-space-cadet hover:from-space-cadet hover:to-oxford text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg text-lg flex items-center justify-center gap-2"
              >
                Get Started for Free <FiArrowRight />
              </button>
              <button className="px-8 py-4 bg-white border-2 border-slate-200 hover:border-jordy-blue text-oxford font-bold rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                <FiPlayCircle /> Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="text-center p-4 bg-white rounded-xl border border-slate-200 shadow-soft">
                <div className="text-3xl font-bold text-jordy-blue flex items-center justify-center gap-2">10K+ <FiUsers /></div>
                <div className="text-sm text-slate-600">Active Users</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-slate-200 shadow-soft">
                <div className="text-3xl font-bold text-ylnmn-blue flex items-center justify-center gap-2">99.9% <FiCheckCircle /></div>
                <div className="text-sm text-slate-600">Uptime</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-slate-200 shadow-soft">
                <div className="text-3xl font-bold text-jordy-blue flex items-center justify-center gap-2">24/7 <FiPhone /></div>
                <div className="text-sm text-slate-600">Support</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-slate-200 shadow-soft">
                <div className="text-3xl font-bold text-ylnmn-blue flex items-center justify-center gap-2">150+ <FiHome /></div>
                <div className="text-sm text-slate-600">Campuses</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-oxford to-ylnmn-blue bg-clip-text text-transparent mb-4 flex items-center justify-center gap-3">
              <FiTrendingUp /> Powerful Features
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Everything you need to manage your campus efficiently 🎓
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-slate-200"
              >
                <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-oxford mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-jordy-blue via-ylnmn-blue to-space-cadet py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            🚀 Ready to transform your campus?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of institutions using Smart Campus. 📚
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-white text-oxford font-bold rounded-xl hover:shadow-2xl transition-all transform hover:scale-105 text-lg"
          >
            Start Your Journey → 🎓
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
              <span className="text-2xl">🏫</span>
              <span className="text-white font-bold text-xl">📚 Smart Campus</span>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              &copy; 2026 Smart Campus. All rights reserved.
            </p>
            <p className="text-slate-500 text-xs">
              Built with React ⚛️, Spring Boot 🍃, and Tailwind CSS 🎨
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;