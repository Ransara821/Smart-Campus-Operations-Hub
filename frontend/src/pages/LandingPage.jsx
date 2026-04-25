import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    ArrowRight, Box, Calendar, Clock, Lock, ShieldCheck, Zap, 
    Search, CheckCircle, Users, Mail, Phone, MapPin, 
    Facebook, Twitter, Linkedin, Github, LayoutGrid, ClipboardCheck, MessageSquare
} from 'lucide-react';
import './LandingPage.css';
import heroBg from '../assets/hero-bg.png';

export const LandingPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect logged-in users away from the landing page
    useEffect(() => {
        if (user) {
            navigate('/resources');
        }
    }, [user, navigate]);

    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    const heroStats = [
        { value: '2,400+', label: 'Campus Users' },
        { value: '98%', label: 'Uptime' },
        { value: '4 Modules', label: 'Fully Integrated' },
        { value: '< 2 min', label: 'Avg Response Time' }
    ];

    const pulseCards = [
        {
            icon: CalendarDays,
            title: 'Active Bookings',
            value: '142',
            suffix: 'today',
            accent: '#a78bfa',
            detail: 'Rooms, labs, and equipment reserved',
            progress: 72,
            footer: 'Updated just now'
        },
        {
            icon: Ticket,
            title: 'Open Tickets',
            value: '28',
            accent: '#c084fc',
            detail: 'Maintenance issues in progress',
            badges: ['Plumbing', 'Electrical', 'HVAC'],
            footer: 'Technicians assigned'
        },
        {
            icon: Users,
            title: 'Active Users',
            value: '1,840',
            accent: '#8b5cf6',
            detail: 'Students and staff on platform',
            progress: 85,
            footer: 'Across all roles'
        },
        {
            icon: ScanLine,
            title: 'QR Verifications',
            value: '96%',
            suffix: 'success',
            accent: '#d946ef',
            detail: 'Access validations today',
            progress: 96,
            footer: 'Secure and real-time'
        }
    ];

    // Define core features for the landing page grid
    const modules = [
        {
            icon: <Calendar className="w-8 h-8 text-blue-500" />,
            title: "Smart Reservations",
            description: "Instant booking for lecture halls, laboratories, and study spaces with real-time status."
        },
        {
            icon: <Zap className="w-8 h-8 text-amber-500" />,
            title: "Rapid Maintenance",
            description: "Found an issue? Raise a ticket in seconds. Our technicians are notified instantly."
        },
        {
            icon: <ShieldCheck className="w-8 h-8 text-emerald-500" />,
            title: "Secure Operations",
            description: "Encrypted QR-based access verification and role-based permissions for total security."
        }
    ];

    // Define the step-by-sequence for the How It Works section
    const quickFlow = [
        {
            step: "01",
            icon: <Search className="w-6 h-6" />,
            title: "Find Resources",
            description: "Browse available classrooms, labs, or equipment across the entire campus in real-time."
        },
        {
            step: "02",
            icon: <ClipboardCheck className="w-6 h-6" />,
            title: "Book Instantly",
            description: "Select your time slot and reserve your space with a single click. No paperwork needed."
        },
        {
            step: "03",
            icon: <CheckCircle className="w-6 h-6" />,
            title: "Manage & Access",
            description: "Track your bookings and use your digital QR code for quick, secure entry verification."
        }
    ];

    const navItems = [
        { label: 'Overview', target: 'overview', type: 'section' },
        { label: 'About Us', path: '/about-us', type: 'route' },
        { label: 'Campus Pulse', target: 'pulse', type: 'section' },
        { label: 'Modules', target: 'modules', type: 'section' },
        { label: 'Wayfinding', target: 'wayfinding', type: 'section' }
    ];

      return (
        <div className="min-h-screen bg-[#fcf8ff] text-slate-900">
            <div className="relative overflow-hidden bg-[linear-gradient(180deg,#fdfaff_0%,#f6efff_36%,#f9f5ff_100%)]">
                <div className="absolute inset-0 opacity-100" style={{ background: 'radial-gradient(circle at top left, rgba(216,180,254,0.35), transparent 28%), radial-gradient(circle at top right, rgba(196,181,253,0.3), transparent 34%), radial-gradient(circle at 50% 70%, rgba(244,208,255,0.4), transparent 30%)' }} />
                <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.14) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

                <nav className="sticky top-0 z-30 border-b border-violet-100 bg-white/75 backdrop-blur-xl">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
                        <button type="button" onClick={() => scrollToSection('overview')} className="flex items-center gap-3 text-left">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-300 via-fuchsia-300 to-purple-400 shadow-[0_12px_30px_rgba(168,85,247,0.22)]">
                                <GraduationCap className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <div className="text-sm font-black uppercase tracking-[0.25em] text-slate-900">SmartCampus</div>
                                <div className="text-xs font-medium text-violet-500">Operations Hub</div>
                            </div>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section" style={{ backgroundImage: `url(${heroBg})` }}>
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <div className="badge animate-fade-in">Next Generation Campus Management</div>
                    <h1 className="hero-title animate-slide-up">
                        Elevate Your Campus <br />
                        <span className="text-gradient">Experience</span>
                    </h1>
                    <p className="hero-subtitle animate-slide-up-delay">
                        The all-in-one hub for facility management, resource booking, and maintenance tracking. 
                        Streamlining campus operations with smart technology.
                    </p>
                    <div className="hero-actions animate-slide-up-delay-2">
                        <button onClick={() => navigate('/login')} className="btn-main">
                            Get Started Free
                        </button>
                        <button onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })} className="btn-outline">
                            How it Works
                        </button>
                    </div>
                </div>
                
                <div className="hero-stats">
                    <div className="stat-item">
                        <span className="stat-value">200+</span>
                        <span className="stat-label">Resources</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-value">15k+</span>
                        <span className="stat-label">Users</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-value">99.9%</span>
                        <span className="stat-label">Uptime</span>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="how-it-works">
                <div className="section-header">
                    <h1 className="section-tag">Process</h1>
                    <h2 className="section-title">How SmartCampus Works</h2>
                    <p className="section-subtitle">A seamless experience designed for modern education environments.</p>
                </div>
                
                <div className="steps-container">
                    {howItWorks.map((item, index) => (
                        <div key={index} className="step-card">
                            <div className="step-number">{item.step}</div>
                            <div className="step-icon-box">{item.icon}</div>
                            <h3 className="step-title">{item.title}</h3>
                            <p className="step-description">{item.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="features-layout">
                    <div className="features-text">
                        <h1 className="section-tag">Key Features</h1>
                        <h2 className="section-title">Everything you need <br/>in one powerful hub</h2>
                        <p className="section-subtitle">We build the tools, you focus on education. Our platform handles the complexity of campus logistics.</p>
                        
                        <ul className="features-checklist">
                            <li><CheckCircle className="w-5 h-5 text-emerald-500" /> Automated conflict resolution</li>
                            <li><CheckCircle className="w-5 h-5 text-emerald-500" /> Integrated maintenance workflow</li>
                            <li><CheckCircle className="w-5 h-5 text-emerald-500" /> Detailed analytics & reporting</li>
                        </ul>
                    </div>
                    
                    <div className="features-grid-wrapper">
                        <div className="features-grid">
                            {features.map((feature, index) => (
                                <div key={index} className="feature-card">
                                    <div className="feature-icon-wrapper">
                                        {feature.icon}
                                    </div>
                                    <h3 className="feature-title">{feature.title}</h3>
                                    <p className="feature-description">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-box">
                    <h2 className="cta-title">Ready to transform your campus?</h2>
                    <p className="cta-subtitle">Join thousands of students and faculty members already using SmartCampus.</p>
                    <button onClick={() => navigate('/login')} className="btn-white">
                        Get Started Now <ArrowRight className="w-5 h-5" />
                    </button>
                    
                    <div className="cta-blobs">
                        <div className="blob blob-1"></div>
                        <div className="blob blob-2"></div>
                    </div>
                </div>
            </section>

            {/* Professional Multi-Column Footer */}
            <footer className="main-footer">
                <div className="footer-top">
                    <div className="footer-column brand-col">
                        <div className="footer-logo">
                            <div className="logo-icon small">SC</div>
                            <span className="logo-text dark">SmartCampus</span>
                        </div>
                        <p className="brand-desc">
                            The comprehensive operations hub designed to modernize campus management through smart automation and real-time connectivity.
                        </p>
                        <div className="social-links">
                            <a href="#" className="social-icon"><Facebook /></a>
                            <a href="#" className="social-icon"><Twitter /></a>
                            <a href="#" className="social-icon"><Linkedin /></a>
                            <a href="#" className="social-icon"><Github /></a>
                        </div>
                    </div>
                    
                    <div className="footer-column">
                        <h4 className="footer-heading">Platform</h4>
                        <ul className="footer-links-list">
                            <li><Link to="/resources">Room Booking</Link></li>
                            <li><Link to="/tickets">Maintenance Hub</Link></li>
                            <li><Link to="/resources">Equipment Management</Link></li>
                            <li><Link to="/verify-qr">QR Verification</Link></li>
                        </ul>
                    </div>
                    
                    <div className="footer-column">
                        <h4 className="footer-heading">Resources</h4>
                        <ul className="footer-links-list">
                            <li><a href="#">User Manual</a></li>
                            <li><a href="#">API Documentation</a></li>
                            <li><a href="#">Security Overview</a></li>
                            <li><a href="#">Help Center</a></li>
                        </ul>
                    </div>
                    
                    <div className="footer-column contact-col">
                        <h4 className="footer-heading">Contact Us</h4>
                        <ul className="contact-info">
                            <li><MapPin className="w-5 h-5" /> 123 University Ave, Campus City</li>
                            <li><Mail className="w-5 h-5" /> support@smartcampus.edu</li>
                            <li><Phone className="w-5 h-5" /> +1 (555) 123-4567</li>
                        </ul>
                    </div>
                </div>
                
                <div className="footer-bottom">
                    <div className="footer-copyright">
                        &copy; 2026 SmartCampus Operations Hub. All rights reserved.
                    </div>
                    <div className="footer-legal">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                        <a href="#">Cookie Policy</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

