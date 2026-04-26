import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Compass,
    GraduationCap,
    LayoutGrid,
    LocateFixed,
    Mail,
    Map,
    MapPin,
    Phone,
    ScanLine,
    ShieldCheck,
    Ticket,
    Users,
    Wrench,
    Zap
} from 'lucide-react';
import './LandingPage.css';
import heroBg from '../assets/hero-bg.png';

function PulseCard({ icon: Icon, title, value, suffix, accent, detail, badges, progress, footer }) {
    return (
        <div
            className="rounded-[28px] border bg-white/85 p-6 shadow-[0_20px_60px_rgba(168,85,247,0.12)] backdrop-blur-xl"
            style={{ borderColor: `${accent}22`, boxShadow: `0 20px 60px ${accent}14` }}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-slate-600">{title}</p>
                    <div className="mt-4 flex items-end gap-2">
                        <span className="text-4xl font-black tracking-tight text-slate-900">{value}</span>
                        {suffix && <span className="pb-1 text-sm font-semibold text-slate-500">{suffix}</span>}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{detail}</p>
                </div>
                <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border"
                    style={{ backgroundColor: `${accent}18`, borderColor: `${accent}30`, color: accent }}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            {typeof progress === 'number' && (
                <div className="mt-6">
                    <div className="h-2.5 overflow-hidden rounded-full bg-violet-100">
                        <div
                            className="h-full rounded-full"
                            style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accent}, #ddd6fe)` }}
                        />
                    </div>
                </div>
            )}
            {badges?.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                    {badges.map((badge) => (
                        <span key={badge} className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-medium text-slate-600">
                            {badge}
                        </span>
                    ))}
                </div>
            )}
            <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                <span>{footer}</span>
                <span className="inline-flex items-center gap-1 font-medium text-violet-500">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Live
                </span>
            </div>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, description, accent }) {
    return (
        <div
            className="group rounded-[28px] border bg-white/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white"
            style={{ borderColor: `${accent}24`, boxShadow: `0 18px 50px ${accent}10` }}
        >
            <div
                className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundColor: `${accent}18`, borderColor: `${accent}30`, color: accent }}
            >
                <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
        </div>
    );
}

export const LandingPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
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

    const modules = [
        {
            icon: CalendarDays,
            title: 'Smart Reservations',
            description: 'Book lecture halls, labs, and equipment with live availability, conflict prevention, and instant confirmations.',
            accent: '#a78bfa'
        },
        {
            icon: Wrench,
            title: 'Maintenance Workflow',
            description: 'Raise support tickets fast, assign technicians, and keep every issue moving with visible status updates.',
            accent: '#c084fc'
        },
        {
            icon: ShieldCheck,
            title: 'Secure Authentication',
            description: 'Protect users with OTP verification, role-based access, and admin control for critical campus operations.',
            accent: '#8b5cf6'
        },
        {
            icon: LayoutGrid,
            title: 'Unified Oversight',
            description: 'Give admins a single command center for facilities, bookings, tickets, users, notifications, and QR checks.',
            accent: '#d946ef'
        }
    ];

    const quickFlow = [
        {
            step: '01',
            title: 'Discover resources',
            description: 'Students and staff find rooms, labs, and equipment with real-time visibility.'
        },
        {
            step: '02',
            title: 'Reserve and manage',
            description: 'Bookings, approvals, and notifications stay in one streamlined workflow.'
        },
        {
            step: '03',
            title: 'Operate securely',
            description: 'QR verification, role controls, and ticket tracking keep the campus running smoothly.'
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

                        <div className="hidden items-center gap-2 rounded-full border border-violet-100 bg-white/75 px-2 py-1 shadow-[0_10px_30px_rgba(139,92,246,0.08)] lg:flex">
                            {navItems.map((item, index) => (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => item.type === 'route' ? navigate(item.path) : scrollToSection(item.target)}
                                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${index === 0 ? 'bg-violet-500 text-white shadow-sm' : 'text-slate-600 hover:bg-violet-50 hover:text-violet-600'}`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_35px_rgba(168,85,247,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(168,85,247,0.3)]"
                            >
                                Get Started
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </nav>

                <section id="overview" className="relative">
                    <div className="absolute inset-0 opacity-12" style={{ backgroundImage: `linear-gradient(90deg, rgba(255,250,255,0.96) 0%, rgba(249,245,255,0.78) 38%, rgba(244,237,255,0.72) 100%), url(${heroBg})`, backgroundPosition: 'center', backgroundSize: 'cover' }} />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.2)_0%,rgba(248,242,255,0.68)_68%,#fcf8ff_100%)]" />

                    <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-6 lg:px-8 lg:pb-28 lg:pt-8">
                        <div className="grid gap-12">
                            <div className="max-w-5xl pt-0">
                                <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-100/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-violet-700">
                                    <Zap className="h-3.5 w-3.5" />
                                    Intelligent campus operations
                                </div>

                                <h1 className="mt-8 max-w-5xl text-5xl font-black leading-[1.05] tracking-[-0.04em] text-slate-900 sm:text-6xl lg:text-7xl">
                                    Power a smarter campus with seamless bookings, maintenance, and secure access.
                                </h1>

                                <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
                                    Manage spaces, support requests, user roles, and QR verification from one connected platform designed for faster daily campus operations.
                                </p>

                                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/login')}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-400 px-6 py-4 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(168,85,247,0.2)] transition hover:-translate-y-0.5"
                                    >
                                        Get Started Free
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => scrollToSection('modules')}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-white/75 px-6 py-4 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
                                    >
                                        Explore Platform
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="mt-14 grid gap-4 border-t border-violet-100 pt-8 sm:grid-cols-2 xl:grid-cols-4">
                                    {heroStats.map((stat) => (
                                        <div key={stat.label} className="rounded-2xl border border-violet-100 bg-white/75 px-5 py-4 shadow-[0_16px_40px_rgba(139,92,246,0.08)] backdrop-blur-sm">
                                            <div className="text-3xl font-black tracking-tight text-slate-900">{stat.value}</div>
                                            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <section id="pulse" className="border-t border-violet-100 bg-[#fbf7ff]">
                <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                    <div className="max-w-2xl">
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-500">Campus Pulse</p>
                        <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">Operational insight across the university.</h2>
                        <p className="mt-5 text-lg leading-8 text-slate-500">
                            Surface the live data that matters most, from resource demand and parking flow to maintenance load and secure access.
                        </p>
                    </div>
                    <div className="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
                        {pulseCards.map((card) => (
                            <PulseCard key={card.title} {...card} />
                        ))}
                    </div>
                </div>
            </section>

            <section id="modules" className="border-t border-violet-100 bg-[linear-gradient(180deg,#fbf7ff_0%,#f7f0ff_100%)]">
                <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:px-8">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-500">Platform Modules</p>
                        <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">Purpose-built for modern campus teams.</h2>
                        <p className="mt-5 text-lg leading-8 text-slate-500">
                            SmartCampus combines the daily tools your institution already needs into a single, polished digital experience.
                        </p>
                        <div className="mt-10 space-y-4">
                            {quickFlow.map((item) => (
                                <div key={item.step} className="rounded-[26px] border border-violet-100 bg-white/80 p-5 shadow-[0_16px_40px_rgba(139,92,246,0.08)]">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-100 text-sm font-black text-violet-700">
                                            {item.step}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                                            <p className="mt-2 text-sm leading-7 text-slate-500">{item.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                        {modules.map((module) => (
                            <FeatureCard key={module.title} {...module} />
                        ))}
                    </div>
                </div>
            </section>

            <section id="wayfinding" className="border-t border-violet-100 bg-[#fcf8ff]">
                <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-center lg:px-8">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-500">Intelligent Wayfinding</p>
                        <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">Navigate the campus with clarity and confidence.</h2>
                        <p className="mt-5 text-lg leading-8 text-slate-500">
                            Help students, staff, technicians, and admins locate spaces, trace routes, and move between facilities with smarter operational context.
                        </p>
                        <div className="mt-8 space-y-4">
                            {[
                                { icon: Map, text: 'Find classrooms, labs, halls, and shared facilities in one place.' },
                                { icon: LocateFixed, text: 'Guide technicians to maintenance hotspots faster.' },
                                { icon: Compass, text: 'Connect route planning with bookings, schedules, and access control.' }
                            ].map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.text} className="flex items-start gap-3 rounded-2xl border border-violet-100 bg-white/80 px-4 py-4 shadow-[0_14px_35px_rgba(139,92,246,0.07)]">
                                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-200 bg-violet-100 text-violet-500">
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <p className="text-sm leading-7 text-slate-600">{item.text}</p>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-400 px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                            >
                                Explore SmartCampus
                                <ArrowRight className="h-4 w-4" />
                            </button>
                            <Link
                                to="/verify-qr"
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-white/80 px-6 py-4 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
                            >
                                Verify QR Access
                                <ScanLine className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-[34px] border border-violet-100 bg-white/82 p-4 shadow-[0_32px_90px_rgba(168,85,247,0.12)]">
                        <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.18) 1px, transparent 1px)', backgroundSize: '34px 34px' }} />
                        <div className="relative h-[420px] rounded-[28px] border border-violet-100 bg-[radial-gradient(circle_at_top,rgba(221,214,254,0.8),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f7f0ff_100%)]">
                            <div className="absolute left-[6%] top-[18%] h-[2px] w-[34%] rotate-[12deg] bg-gradient-to-r from-transparent via-violet-400/80 to-transparent" />
                            <div className="absolute left-[28%] top-[28%] h-[2px] w-[30%] rotate-[-14deg] bg-gradient-to-r from-transparent via-fuchsia-400/80 to-transparent" />
                            <div className="absolute left-[42%] top-[56%] h-[2px] w-[36%] rotate-[8deg] bg-gradient-to-r from-transparent via-purple-400/80 to-transparent" />
                            <div className="absolute left-[18%] top-[62%] h-[2px] w-[28%] rotate-[-24deg] bg-gradient-to-r from-transparent via-violet-300/70 to-transparent" />
                            {[
                                { name: 'Science Lab', position: 'left-[24%] top-[24%]', color: '#93c5fd' },
                                { name: 'Library Core', position: 'left-[48%] top-[48%]', color: '#f9a8d4' },
                                { name: 'Innovation Hub', position: 'left-[68%] top-[66%]', color: '#86efac' },
                                { name: 'Admin Center', position: 'left-[73%] top-[26%]', color: '#fcd34d' }
                            ].map((marker) => (
                                <div key={marker.name} className={`absolute ${marker.position}`}>
                                    <div className="flex flex-col items-start gap-2">
                                        <span className="h-3.5 w-3.5 rounded-full border-2 border-white shadow-[0_0_25px_rgba(168,85,247,0.16)]" style={{ backgroundColor: marker.color }} />
                                        <div className="rounded-full border border-violet-100 bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 backdrop-blur">
                                            {marker.name}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="absolute bottom-5 left-5 right-5 rounded-[24px] border border-violet-100 bg-white/88 p-4 backdrop-blur-xl">
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.18em] text-violet-500">Route confidence</p>
                                        <p className="mt-2 text-2xl font-black text-slate-900">96%</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.18em] text-violet-500">Navigation assists</p>
                                        <p className="mt-2 text-2xl font-black text-slate-900">24/7</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.18em] text-violet-500">Connected stops</p>
                                        <p className="mt-2 text-2xl font-black text-slate-900">18</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-t border-violet-100 bg-[linear-gradient(180deg,#fcf8ff_0%,#f4ebff_100%)]">
                <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                    <div className="overflow-hidden rounded-[34px] border border-violet-100 bg-[linear-gradient(135deg,#ffffff,#f6edff)] p-8 shadow-[0_30px_100px_rgba(168,85,247,0.12)] lg:p-10">
                        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.6fr)] lg:items-end">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-500">Built for smart campuses</p>
                                <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">Deliver a polished digital experience from first click to daily operations.</h2>
                                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-500">
                                    SmartCampus connects your institution's facilities, people, and processes into one seamless platform built for speed, reliability, and clarity.
                                </p>
                            </div>
                            <div className="grid gap-4">
                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-400 px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                                >
                                    Launch Platform
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                                <Link
                                    to="/verify-qr"
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-white/80 px-6 py-4 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
                                >
                                    Public QR Verification
                                    <ScanLine className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-violet-100 bg-black">
                <div className="mx-auto grid max-w-7xl gap-12 px-6 py-14 lg:grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(0,0.7fr))] lg:px-8">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-300 via-fuchsia-300 to-purple-400">
                                <GraduationCap className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <div className="text-lg font-black text-white">SmartCampus</div>
                                <div className="text-sm text-violet-400">Operations Hub</div>
                            </div>
                        </div>
                        <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
                            A connected platform for reservations, maintenance, secure authentication, QR verification, and campus-wide operational visibility.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Platform</h3>
                        <div className="mt-5 space-y-3 text-sm text-slate-400">
                            <button type="button" onClick={() => scrollToSection('modules')} className="block transition hover:text-violet-400">Smart reservations</button>
                            <button type="button" onClick={() => scrollToSection('pulse')} className="block transition hover:text-violet-400">Campus pulse</button>
                            <Link to="/verify-qr" className="block transition hover:text-violet-400">QR verification</Link>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Support</h3>
                        <div className="mt-5 space-y-3 text-sm text-slate-400">
                            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-violet-400" /> support@smartcampus.edu</div>
                            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-violet-400" /> +1 (555) 123-4567</div>
                            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-violet-400" /> Campus Operations Center</div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Built for</h3>
                        <div className="mt-5 space-y-3 text-sm text-slate-400">
                            <div className="flex items-center gap-2"><Users className="h-4 w-4 text-violet-400" /> Students &amp; faculty</div>
                            <div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-violet-400" /> Technicians</div>
                            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-violet-400" /> Admin teams</div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/10">
                    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 text-sm text-slate-500 md:flex-row md:items-center md:justify-between lg:px-8">
                        <p>© 2026 SmartCampus Operations Hub. Intelligent management in motion.</p>
                        <div className="flex flex-wrap items-center gap-5">
                            <button type="button" onClick={() => scrollToSection('overview')} className="transition hover:text-violet-400">Overview</button>
                            <button type="button" onClick={() => scrollToSection('wayfinding')} className="transition hover:text-violet-400">Wayfinding</button>
                            <button type="button" onClick={() => navigate('/login')} className="transition hover:text-violet-400">Get Started</button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

