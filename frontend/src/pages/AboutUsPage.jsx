import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ArrowRight,
    Building2,
    CalendarDays,
    CheckCircle2,
    GraduationCap,
    LayoutGrid,
    ScanLine,
    ShieldCheck,
    Ticket,
    Users,
    Wrench
} from 'lucide-react';

const roleHighlights = [
    {
        title: 'For Admins',
        description: 'Monitor bookings, manage users, verify access, and maintain full operational oversight from one dashboard.',
        icon: ShieldCheck,
        accent: '#8b5cf6',
        points: ['Centralized visibility', 'Role-based access control', 'Better decision support']
    },
    {
        title: 'For Users',
        description: 'Help students and staff quickly find spaces, reserve resources, and access services with less friction.',
        icon: Users,
        accent: '#c084fc',
        points: ['Simple reservations', 'Fast campus access', 'Clear service experience']
    },
    {
        title: 'For Technicians',
        description: 'Streamline maintenance workflows with faster issue tracking, clearer priorities, and real-time status updates.',
        icon: Wrench,
        accent: '#d946ef',
        points: ['Quicker response handling', 'Transparent ticket flow', 'Improved service coordination']
    }
];

const capabilities = [
    {
        title: 'Smart Reservations',
        description: 'Coordinate rooms, labs, and shared assets with live availability and conflict-aware booking flows.',
        icon: CalendarDays,
        accent: '#a78bfa'
    },
    {
        title: 'Maintenance Management',
        description: 'Track requests from report to resolution while helping support teams stay aligned and responsive.',
        icon: Ticket,
        accent: '#c084fc'
    },
    {
        title: 'Secure QR Verification',
        description: 'Protect campus spaces with fast, role-aware QR validation for entry, pickup, and controlled access.',
        icon: ScanLine,
        accent: '#8b5cf6'
    },
    {
        title: 'Unified Operations Hub',
        description: 'Bring campus services together into one connected platform built for clarity, speed, and reliability.',
        icon: LayoutGrid,
        accent: '#d946ef'
    }
];

export const AboutUsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const primaryRoute = user ? (user.role === 'ADMIN' ? '/dashboard' : '/resources') : '/login';

    return (
        <div className="min-h-screen bg-[#fcf8ff] text-slate-900">
            <div className="relative overflow-hidden bg-[linear-gradient(180deg,#fdfaff_0%,#f6efff_36%,#f9f5ff_100%)]">
                <div className="absolute inset-0 opacity-100" style={{ background: 'radial-gradient(circle at top left, rgba(216,180,254,0.35), transparent 28%), radial-gradient(circle at top right, rgba(196,181,253,0.3), transparent 34%), radial-gradient(circle at 50% 70%, rgba(244,208,255,0.4), transparent 30%)' }} />
                <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.14) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

                <nav className="sticky top-0 z-30 border-b border-violet-100 bg-white/75 backdrop-blur-xl">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
                        <Link to="/" className="flex items-center gap-3 text-left">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-300 via-fuchsia-300 to-purple-400 shadow-[0_12px_30px_rgba(168,85,247,0.22)]">
                                <GraduationCap className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <div className="text-sm font-black uppercase tracking-[0.25em] text-slate-900">SmartCampus</div>
                                <div className="text-xs font-medium text-violet-500">Operations Hub</div>
                            </div>
                        </Link>

                        <div className="flex items-center gap-3">
                            <Link to="/" className="inline-flex items-center justify-center rounded-full border border-violet-200 bg-white/80 px-5 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50">
                                Back to Home
                            </Link>
                            <button
                                type="button"
                                onClick={() => navigate(primaryRoute)}
                                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_35px_rgba(168,85,247,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(168,85,247,0.3)]"
                            >
                                {user ? 'Open Platform' : 'Get Started'}
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </nav>

                <section className="relative mx-auto max-w-7xl px-6 pb-16 pt-10 lg:px-8 lg:pb-20 lg:pt-14">
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:items-center">
                        <div className="max-w-4xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-100/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-violet-700">
                                <Building2 className="h-3.5 w-3.5" />
                                About SmartCampus
                            </div>

                            <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[1.05] tracking-[-0.04em] text-slate-900 sm:text-6xl lg:text-7xl">
                                Built to connect people, spaces, and campus operations in one smarter system.
                            </h1>

                            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
                                SmartCampus Operations Hub is designed to simplify how institutions manage facilities, bookings, maintenance, authentication, and QR-based verification. Our goal is to create a reliable digital experience for administrators, everyday users, and technician teams alike.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3">
                                {['Operational clarity', 'Faster service delivery', 'Role-aware access', 'Connected campus experience'].map((item) => (
                                    <span key={item} className="rounded-full border border-violet-100 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-[0_12px_30px_rgba(139,92,246,0.06)]">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[32px] border border-violet-100 bg-white/82 p-6 shadow-[0_30px_90px_rgba(168,85,247,0.12)] backdrop-blur-xl">
                            <div className="flex items-center justify-between border-b border-violet-100 pb-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">Why we built it</p>
                                    <h2 className="mt-2 text-2xl font-bold text-slate-900">One platform for campus coordination</h2>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-3xl border border-violet-100 bg-violet-50 p-5">
                                    <div className="text-sm font-semibold text-slate-700">Admin visibility</div>
                                    <div className="mt-3 text-3xl font-black text-slate-900">360°</div>
                                    <div className="mt-2 text-sm text-slate-500">See bookings, users, tickets, and verification from a single control point.</div>
                                </div>
                                <div className="rounded-3xl border border-fuchsia-100 bg-fuchsia-50 p-5">
                                    <div className="text-sm font-semibold text-slate-700">Service efficiency</div>
                                    <div className="mt-3 text-3xl font-black text-slate-900">24/7</div>
                                    <div className="mt-2 text-sm text-slate-500">Keep requests, approvals, and support activity moving without delays.</div>
                                </div>
                            </div>

                            <div className="mt-4 rounded-[28px] border border-violet-100 bg-[#fdfaff] p-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-800">Core outcomes</span>
                                    <span className="text-xs font-medium text-slate-500">Always connected</span>
                                </div>
                                <div className="mt-5 space-y-4">
                                    {[
                                        'Simpler resource access for users',
                                        'Stronger oversight for administrators',
                                        'Faster issue handling for technicians'
                                    ].map((item) => (
                                        <div key={item} className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-white px-4 py-3">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                                                <CheckCircle2 className="h-4 w-4" />
                                            </span>
                                            <span className="text-sm font-medium text-slate-600">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <section className="border-t border-violet-100 bg-white/70">
                <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                    <div className="max-w-3xl">
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-500">Who we support</p>
                        <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">Designed around the people who keep campus life moving.</h2>
                        <p className="mt-5 text-lg leading-8 text-slate-500">
                            Every part of the platform is shaped to support the distinct responsibilities of Admins, Users, and Technicians while keeping the full system connected.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-6 lg:grid-cols-3">
                        {roleHighlights.map((role) => {
                            const Icon = role.icon;
                            return (
                                <div
                                    key={role.title}
                                    className="rounded-[28px] border bg-white/85 p-6 shadow-[0_20px_60px_rgba(168,85,247,0.1)] backdrop-blur-xl"
                                    style={{ borderColor: `${role.accent}24`, boxShadow: `0 20px 60px ${role.accent}12` }}
                                >
                                    <div
                                        className="flex h-14 w-14 items-center justify-center rounded-2xl border"
                                        style={{ backgroundColor: `${role.accent}18`, borderColor: `${role.accent}32`, color: role.accent }}
                                    >
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="mt-6 text-2xl font-bold text-slate-900">{role.title}</h3>
                                    <p className="mt-3 text-sm leading-7 text-slate-500">{role.description}</p>
                                    <div className="mt-6 space-y-3">
                                        {role.points.map((point) => (
                                            <div key={point} className="flex items-center gap-3 text-sm text-slate-600">
                                                <CheckCircle2 className="h-4 w-4" style={{ color: role.accent }} />
                                                <span>{point}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="border-t border-violet-100 bg-[#fbf7ff]">
                <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                    <div className="max-w-3xl">
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-500">What powers the system</p>
                        <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">Purpose-built features for everyday campus operations.</h2>
                    </div>

                    <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                        {capabilities.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.title}
                                    className="group rounded-[28px] border bg-white/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white"
                                    style={{ borderColor: `${item.accent}24`, boxShadow: `0 18px 50px ${item.accent}10` }}
                                >
                                    <div
                                        className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:scale-105"
                                        style={{ backgroundColor: `${item.accent}18`, borderColor: `${item.accent}30`, color: item.accent }}
                                    >
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-7 text-slate-500">{item.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="border-t border-violet-100 bg-[linear-gradient(180deg,#fcf8ff_0%,#f4ebff_100%)]">
                <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                    <div className="overflow-hidden rounded-[34px] border border-violet-100 bg-[linear-gradient(135deg,#ffffff,#f6edff)] p-8 shadow-[0_30px_100px_rgba(168,85,247,0.12)] lg:p-10">
                        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.6fr)] lg:items-end">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-500">Ready to explore SmartCampus?</p>
                                <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">A better campus experience starts with one connected system.</h2>
                                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-500">
                                    Discover how SmartCampus helps institutions create smoother workflows, clearer visibility, and better service for everyone involved.
                                </p>
                            </div>

                            <div className="grid gap-4">
                                <button
                                    type="button"
                                    onClick={() => navigate(primaryRoute)}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-400 px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                                >
                                    {user ? 'Open Platform' : 'Get Started'}
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                                <Link
                                    to="/"
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-white/80 px-6 py-4 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
                                >
                                    Return to Landing Page
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
