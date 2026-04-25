import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../api/axios';
import { QrCode, CheckCircle2, XCircle, Scan, AlertTriangle, Lock, Users, ShieldCheck, ArrowRight, RotateCcw } from 'lucide-react';

/* ─────────────── Floating Label Input ─────────────── */
const FloatingInput = ({ id, label, type = 'text', value, onChange, placeholder, required, disabled, className = '', mono = false }) => (
    <div className="relative w-full group">
        <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder=" "
            required={required}
            disabled={disabled}
            className={`peer w-full px-5 pt-7 pb-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-transparent
                focus:outline-none focus:border-indigo-400/70 focus:bg-white/8 focus:ring-0
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-300 text-[15px] leading-tight
                ${mono ? 'font-mono tracking-wider' : 'font-medium'}
                ${className}`}
        />
        <label
            htmlFor={id}
            className="absolute left-5 top-3 text-[10px] font-bold tracking-[0.15em] uppercase text-indigo-300/80
                peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-white/30 peer-placeholder-shown:uppercase-none
                peer-focus:top-3 peer-focus:text-[10px] peer-focus:font-bold peer-focus:tracking-[0.15em] peer-focus:text-indigo-300
                transition-all duration-300 pointer-events-none"
        >
            {label}
        </label>
        {/* Glow on focus */}
        <div className="absolute inset-0 rounded-2xl bg-indigo-500/0 peer-focus:bg-indigo-500/5 transition-all duration-500 pointer-events-none" />
    </div>
);

/* ─────────────── Floating Label Textarea ─────────────── */
const FloatingTextarea = ({ id, label, value, onChange, required, disabled, rows = 3 }) => (
    <div className="relative w-full group">
        <textarea
            id={id}
            value={value}
            onChange={onChange}
            placeholder=" "
            rows={rows}
            required={required}
            disabled={disabled}
            className="peer w-full px-5 pt-7 pb-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl text-white/90 placeholder-transparent
                focus:outline-none focus:border-indigo-400/70 focus:bg-white/8 focus:ring-0
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-300 text-[13px] font-mono tracking-wide resize-none leading-relaxed"
        />
        <label
            htmlFor={id}
            className="absolute left-5 top-3 text-[10px] font-bold tracking-[0.15em] uppercase text-indigo-300/80
                peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-white/30
                peer-focus:top-3 peer-focus:text-[10px] peer-focus:font-bold peer-focus:tracking-[0.15em] peer-focus:text-indigo-300
                transition-all duration-300 pointer-events-none"
        >
            {label}
        </label>
        {value && (
            <span className="absolute right-4 bottom-3 text-[10px] font-bold text-white/20 font-mono">
                {value.length}
            </span>
        )}
    </div>
);

/* ─────────────── Detail Row ─────────────── */
const DetailRow = ({ label, value, highlight, mono }) => (
    <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/30">{label}</span>
        <span className={`text-sm font-semibold leading-snug ${highlight ? highlight : 'text-white/90'} ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
);

export const QRVerificationPage = () => {
    const [searchParams] = useSearchParams();
    const [qrData, setQrData] = useState('');
    const [verificationResult, setVerificationResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [studentId, setStudentId] = useState('');
    const [showUserForm, setShowUserForm] = useState(false);

    useEffect(() => {
        let qrParam = searchParams.get('qrData');
        if (qrParam && !verificationResult) {
            if (qrParam.includes('http')) {
                const match = qrParam.match(/qrData=([^&]+)/);
                if (match && match[1]) qrParam = decodeURIComponent(match[1]);
            }
            qrParam = qrParam.trim();
            setQrData(qrParam);
            setShowUserForm(true);
        }
    }, [searchParams, verificationResult]);

    const verifyQRCode = async (dataToVerify, withUserInfo = false) => {
        let qrValue = dataToVerify || qrData;
        if (!qrValue.trim()) return;
        qrValue = qrValue.trim();
        if (qrValue.includes('http') || qrValue.includes('verify-qr')) {
            const match = qrValue.match(/qrData=([^&]+)/);
            if (match && match[1]) qrValue = decodeURIComponent(match[1]);
        }
        qrValue = qrValue.trim();
        setLoading(true);
        try {
            let url = `/api/bookings/verify-qr?qrData=${encodeURIComponent(qrValue)}`;
            if (withUserInfo && userName.trim()) {
                if (!studentId.trim() && !userEmail.trim()) {
                    alert('⚠️ Student ID or Email is required to prevent duplicate check-ins');
                    setLoading(false);
                    return;
                }
                let userId;
                if (studentId.trim()) userId = studentId.trim().toUpperCase();
                else if (userEmail.trim()) userId = userEmail.trim().toLowerCase();
                else userId = userName.trim().toLowerCase().replace(/\s+/g, '-');
                url += `&userId=${encodeURIComponent(userId)}`;
                url += `&userName=${encodeURIComponent(userName.trim())}`;
                if (userEmail.trim()) url += `&userEmail=${encodeURIComponent(userEmail.trim())}`;
                if (studentId.trim()) url += `&studentId=${encodeURIComponent(studentId.trim().toUpperCase())}`;
            }
            const res = await axios.get(url);
            setVerificationResult({ type: 'SUCCESS', data: res.data });
            setShowUserForm(false);
        } catch (error) {
            const errorData = error.response?.data;
            const errorType = errorData?.error;
            if (errorType === 'ACCESS_DENIED') {
                setVerificationResult({ type: 'ACCESS_DENIED', message: errorData.message });
            } else if (errorType === 'ALREADY_CHECKED_IN') {
                setVerificationResult({ type: 'ALREADY_CHECKED_IN', message: errorData.message, checkedInAt: errorData.checkedInAt, booking: errorData.booking, totalAttendees: errorData.totalAttendees, expectedAttendees: errorData.expectedAttendees });
            } else if (errorType === 'NOT_ALLOWED') {
                setVerificationResult({ type: 'NOT_ALLOWED', message: errorData.message, status: errorData.status });
            } else if (errorType === 'TOO_EARLY' || errorType === 'EXPIRED') {
                setVerificationResult({ type: 'TIME_ERROR', message: errorData.message, errorType: errorType });
            } else if (errorType === 'INVALID_QR') {
                setVerificationResult({ type: 'INVALID_QR', message: errorData.message });
            } else {
                setVerificationResult({ type: 'INVALID_QR', message: error.response?.data?.message || 'This QR code is not recognized.' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!userName.trim() && !verificationResult) { setShowUserForm(true); return; }
        verifyQRCode(null, true);
    };

    const handleQuickVerify = (e) => {
        e.preventDefault();
        verifyQRCode(null, false);
    };

    const resetForm = () => {
        setQrData(''); setVerificationResult(null); setUserName('');
        setUserEmail(''); setStudentId(''); setShowUserForm(false);
    };

    const renderResult = () => {
        if (!verificationResult) return null;
        switch (verificationResult.type) {
            case 'SUCCESS': {
                const booking = verificationResult.data.booking;
                const checkedInAt = verificationResult.data.checkedInAt;
                const attendanceMode = verificationResult.data.attendanceMode;
                const totalAttendees = verificationResult.data.totalAttendees;
                const expectedAttendees = verificationResult.data.expectedAttendees;
                return (
                    <div className="flex flex-col items-center gap-6">
                        {/* Icon */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-2xl scale-150"></div>
                            <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[1.75rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 animate-in zoom-in-75 duration-500">
                                <CheckCircle2 className="w-12 h-12 text-white drop-shadow" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-emerald-400/80 mb-1">Verified</p>
                            <h2 className="text-3xl font-black text-white mb-1">Check-In Successful</h2>
                            <p className="text-white/40 text-sm font-medium">Access has been granted for this booking</p>
                        </div>
                        {attendanceMode === 'MULTI_STUDENT' && (
                            <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full">
                                <Users className="w-4 h-4 text-indigo-300" />
                                <span className="text-sm font-bold text-white">{totalAttendees} / {expectedAttendees}</span>
                                <span className="text-sm text-white/40">students checked in</span>
                            </div>
                        )}
                        {/* Details Card */}
                        <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                            {userName && <DetailRow label="Checked in as" value={userName} highlight="text-emerald-300 font-bold" />}
                            <div className="grid grid-cols-2 gap-4">
                                <DetailRow label="Booking ID" value={`BK-${booking.id.substring(0, 8).toUpperCase()}`} mono />
                                <DetailRow label="Checked in at" value={new Date(checkedInAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} highlight="text-emerald-300" />
                            </div>
                            <div className="w-full h-px bg-white/5"></div>
                            <DetailRow label="Resource" value={booking.resourceName} highlight="text-white font-bold text-lg" />
                            <div className="grid grid-cols-2 gap-4">
                                <DetailRow label="Booked by" value={booking.userName} />
                                <DetailRow label="Purpose" value={booking.purpose} />
                            </div>
                            <DetailRow label="Date & Time" value={`${new Date(booking.startTime).toLocaleDateString('en-CA')} · ${new Date(booking.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}–${new Date(booking.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`} />
                            <div className="flex items-center gap-2 pt-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-xs text-white/30 font-medium">Notification dispatched to the booking owner</span>
                            </div>
                        </div>
                        {attendanceMode === 'MULTI_STUDENT' && totalAttendees < expectedAttendees && (
                            <button onClick={() => { setUserName(''); setUserEmail(''); setStudentId(''); setVerificationResult(null); setShowUserForm(true); }}
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 rounded-2xl font-semibold transition-all">
                                <Users className="w-4 h-4" /> Check In Another Student
                            </button>
                        )}
                    </div>
                );
            }
            case 'ALREADY_CHECKED_IN': {
                const alreadyTotal = verificationResult.totalAttendees;
                const alreadyExpected = verificationResult.expectedAttendees;
                const existingStudentId = verificationResult.studentId;
                const existingName = verificationResult.existingName;
                return (
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-amber-400/25 rounded-full blur-2xl scale-150"></div>
                            <div className="relative w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[1.75rem] flex items-center justify-center shadow-2xl shadow-amber-500/30 animate-in zoom-in-75 duration-500">
                                <AlertTriangle className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-amber-400/80 mb-1">Blocked</p>
                            <h2 className="text-3xl font-black text-white mb-1">Duplicate Check-In</h2>
                            <p className="text-white/40 text-sm">{verificationResult.message}</p>
                        </div>
                        {(existingStudentId || existingName) && (
                            <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 space-y-3">
                                <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/30">Already Registered</p>
                                {existingName && <p className="text-lg font-bold text-white">👤 {existingName}</p>}
                                {existingStudentId && <p className="text-sm font-mono text-indigo-300">🆔 {existingStudentId}</p>}
                                <p className="text-xs text-white/30">{new Date(verificationResult.checkedInAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                            </div>
                        )}
                        {alreadyTotal !== undefined && (
                            <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full">
                                <Users className="w-4 h-4 text-amber-300" />
                                <span className="text-sm font-bold text-white">{alreadyTotal} / {alreadyExpected}</span>
                                <span className="text-sm text-white/40">students checked in</span>
                            </div>
                        )}
                        <div className="w-full bg-indigo-500/10 border border-indigo-400/20 rounded-2xl p-4 text-sm text-indigo-200/70 leading-relaxed">
                            ℹ️ Each Student ID can only be used once per session to ensure accurate attendance tracking.
                        </div>
                        {alreadyTotal !== undefined && alreadyTotal < alreadyExpected && (
                            <button onClick={() => { setUserName(''); setUserEmail(''); setStudentId(''); setVerificationResult(null); setShowUserForm(true); }}
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 rounded-2xl font-semibold transition-all">
                                <Users className="w-4 h-4" /> Check In Different Student
                            </button>
                        )}
                    </div>
                );
            }
            case 'INVALID_QR':
                return (
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-rose-400/25 rounded-full blur-2xl scale-150"></div>
                            <div className="relative w-24 h-24 bg-gradient-to-br from-rose-500 to-red-600 rounded-[1.75rem] flex items-center justify-center shadow-2xl shadow-rose-500/30 animate-in zoom-in-75 duration-500">
                                <XCircle className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-rose-400/80 mb-1">Invalid</p>
                            <h2 className="text-3xl font-black text-white mb-1">QR Code Invalid</h2>
                        </div>
                        <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 text-center text-white/50 text-sm leading-relaxed">{verificationResult.message}</div>
                    </div>
                );
            case 'NOT_ALLOWED':
            case 'TIME_ERROR':
                return (
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-rose-400/25 rounded-full blur-2xl scale-150"></div>
                            <div className="relative w-24 h-24 bg-gradient-to-br from-rose-500 to-red-600 rounded-[1.75rem] flex items-center justify-center shadow-2xl shadow-rose-500/30 animate-in zoom-in-75 duration-500">
                                <XCircle className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-rose-400/80 mb-1">Not Allowed</p>
                            <h2 className="text-3xl font-black text-white mb-1">Access Denied</h2>
                        </div>
                        <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 space-y-2 text-center">
                            <p className="text-white/60 text-sm leading-relaxed">{verificationResult.message}</p>
                            {verificationResult.status && <p className="text-xs text-white/30 font-mono">Status: {verificationResult.status}</p>}
                        </div>
                    </div>
                );
            case 'ACCESS_DENIED':
                return (
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-violet-400/25 rounded-full blur-2xl scale-150"></div>
                            <div className="relative w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-[1.75rem] flex items-center justify-center shadow-2xl shadow-violet-500/30 animate-in zoom-in-75 duration-500">
                                <Lock className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-violet-400/80 mb-1">Restricted</p>
                            <h2 className="text-3xl font-black text-white mb-1">Access Restricted</h2>
                        </div>
                        <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 text-center space-y-2">
                            <p className="text-white/60 text-sm">{verificationResult.message}</p>
                            <p className="text-xs text-white/30">Please login with the appropriate permissions.</p>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="w-full min-h-screen flex items-start justify-center py-12 px-4 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #1a1040 40%, #24243e 100%)' }}>

            {/* Ambient orbs */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[20%] w-[40vw] h-[40vw] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div className="absolute bottom-[-5%] right-[10%] w-[35vw] h-[35vw] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div className="absolute top-[40%] left-[-5%] w-[25vw] h-[25vw] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }} />
                {/* Subtle grid */}
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }} />
            </div>

            <div className="relative z-10 w-full max-w-lg mx-auto">

                {/* ─── Header ─── */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
                        style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-indigo-300">Secure Access Portal</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3"
                        style={{ textShadow: '0 0 60px rgba(99,102,241,0.4)' }}>
                        QR Verification
                    </h1>
                    <p className="text-white/35 font-medium max-w-xs mx-auto leading-relaxed text-sm">
                        Authenticate campus resource bookings with secure token validation
                    </p>
                </div>

                {/* ─── Main Card ─── */}
                <div className="rounded-[2.5rem] overflow-hidden"
                    style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(40px)',
                        boxShadow: '0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)'
                    }}>

                    {!verificationResult ? (
                        <div className="p-8 md:p-10">
                            {/* Card header */}
                            <div className="flex flex-col items-center mb-10">
                                <div className="relative mb-6 group cursor-default">
                                    {/* Pulsing rings */}
                                    <div className="absolute inset-0 rounded-[1.5rem] animate-ping opacity-10"
                                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', animationDuration: '2.5s' }} />
                                    <div className="absolute -inset-2 rounded-[1.8rem] opacity-20 group-hover:opacity-40 transition-opacity duration-700"
                                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', filter: 'blur(16px)' }} />
                                    <div className="relative w-20 h-20 flex items-center justify-center rounded-[1.5rem] group-hover:scale-105 transition-transform duration-500"
                                        style={{
                                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                            boxShadow: '0 8px 32px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.15)'
                                        }}>
                                        <QrCode className="w-10 h-10 text-white drop-shadow-lg" />
                                    </div>
                                </div>
                                <h2 className="text-xl font-black text-white mb-1.5 tracking-tight">
                                    {showUserForm ? 'Student Identity' : 'Token Verification'}
                                </h2>
                                <p className="text-white/30 text-[13px] text-center max-w-xs leading-relaxed">
                                    {showUserForm
                                        ? 'Complete your identity details to finalize the check-in process.'
                                        : 'Paste the secure QR payload below to authenticate this booking.'}
                                </p>
                            </div>

                            <form onSubmit={handleVerify} className="space-y-5">
                                {/* QR Textarea */}
                                <FloatingTextarea
                                    id="qrPayload"
                                    label="QR Code Token"
                                    value={qrData}
                                    onChange={e => setQrData(e.target.value)}
                                    required
                                    disabled={showUserForm}
                                    rows={3}
                                />

                                {/* Step indicator */}
                                {qrData && !showUserForm && (
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                                        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/20">
                                            Step 1 of 2
                                        </span>
                                        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                                    </div>
                                )}

                                {/* User fields */}
                                {showUserForm && (
                                    <div className="space-y-5 animate-in slide-in-from-bottom-6 fade-in duration-500">
                                        {/* Identity Required banner */}
                                        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl"
                                            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                            <Lock className="w-4 h-4 text-indigo-300 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-indigo-300 mb-0.5">
                                                    Identity Required
                                                </p>
                                                <p className="text-[12px] text-white/35 leading-relaxed">
                                                    Provide your Student ID or Email to prevent duplicate check-ins.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                                            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/20">Step 2 of 2</span>
                                            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                                        </div>

                                        <FloatingInput
                                            id="fullName"
                                            label="Full Name *"
                                            value={userName}
                                            onChange={e => setUserName(e.target.value)}
                                            required
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FloatingInput
                                                id="studentId"
                                                label="Student ID"
                                                value={studentId}
                                                onChange={e => setStudentId(e.target.value)}
                                                required={!userEmail.trim()}
                                                mono
                                            />
                                            <FloatingInput
                                                id="email"
                                                label="Email (Alt.)"
                                                type="email"
                                                value={userEmail}
                                                onChange={e => setUserEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading || !qrData.trim() || (showUserForm && !userName.trim())}
                                        className="group relative flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-white text-[15px] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden hover:scale-[1.02] active:scale-[0.98] hover:shadow-2xl"
                                        style={{
                                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                            boxShadow: '0 8px 24px rgba(99,102,241,0.35)'
                                        }}
                                    >
                                        {/* Shimmer */}
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />
                                        {loading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
                                                <span className="relative z-10">Validating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Scan className="w-4 h-4 relative z-10" />
                                                <span className="relative z-10">{showUserForm ? 'Confirm Check-In' : 'Authenticate Token'}</span>
                                                <ArrowRight className="w-4 h-4 relative z-10 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                                            </>
                                        )}
                                    </button>

                                    {!showUserForm && qrData.trim() && (
                                        <button
                                            type="button"
                                            onClick={handleQuickVerify}
                                            disabled={loading}
                                            title="Express verify for equipment bookings"
                                            className="px-5 py-4 rounded-2xl font-bold text-white/50 text-sm transition-all hover:text-white/80 active:scale-95 disabled:opacity-30"
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                                        >
                                            Express
                                        </button>
                                    )}
                                </div>

                                {/* Footer hint */}
                                {!showUserForm && (
                                    <p className="text-center text-[11px] text-white/20 font-medium pt-1">
                                        "Authenticate" for student check-in · "Express" for equipment
                                    </p>
                                )}
                            </form>
                        </div>
                    ) : (
                        <div className="p-8 md:p-10">
                            {renderResult()}
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={resetForm}
                                    className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white/60 hover:text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    {verificationResult.type === 'SUCCESS' ? 'New Scan' : verificationResult.type === 'ALREADY_CHECKED_IN' ? 'Go Back' : 'Retry'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center gap-2 mt-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                    <p className="text-[11px] text-white/20 font-semibold tracking-wider uppercase">System Online</p>
                </div>
            </div>
        </div>
    );
};
