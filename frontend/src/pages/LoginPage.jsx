import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LogIn, GraduationCap, ArrowRight, Lock, Mail,
    UserPlus, Wrench, CheckCircle2, ShieldCheck, RefreshCw, KeyRound
} from 'lucide-react';
import loginBg from '../assets/login-bg.png';

const OTP_EXPIRY_SECONDS = 600; // 10 minutes — must match backend OtpStore

// ─── OTP Digit Input ─────────────────────────────────────────────────────────
function OtpDigitInput({ value, onChange, onKeyDown, inputRef, index }) {
    return (
        <input
            ref={inputRef}
            id={`otp-digit-${index}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            className="w-11 h-14 text-center text-xl font-black rounded-xl border-2 outline-none transition-all
                       bg-gray-50 text-gray-900
                       border-gray-200 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-200
                       caret-transparent select-none"
            style={{ caretColor: 'transparent' }}
        />
    );
}

// ─── Countdown Timer ─────────────────────────────────────────────────────────
function Countdown({ seconds, onExpire }) {
    const [remaining, setRemaining] = useState(seconds);

    useEffect(() => {
        setRemaining(seconds);
    }, [seconds]);

    useEffect(() => {
        if (remaining <= 0) { onExpire(); return; }
        const t = setTimeout(() => setRemaining(r => r - 1), 1000);
        return () => clearTimeout(t);
    }, [remaining, onExpire]);

    const m = String(Math.floor(remaining / 60)).padStart(2, '0');
    const s = String(remaining % 60).padStart(2, '0');
    const pct = (remaining / seconds) * 100;
    const urgent = remaining <= 60;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: urgent ? '#ef4444' : '#6b7280' }}>
                <span>{m}:{s}</span>
                <span className="text-xs font-medium text-gray-400">remaining</span>
            </div>
            <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                        width: `${pct}%`,
                        background: urgent
                            ? 'linear-gradient(90deg,#f87171,#ef4444)'
                            : 'linear-gradient(90deg,#a78bfa,#7c3aed)',
                    }}
                />
            </div>
        </div>
    );
}

// ─── Main LoginPage ───────────────────────────────────────────────────────────
export const LoginPage = () => {
    const { requestOtp, verifyOtp, resendOtp } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Form state
    const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('USER');

    // UI state
    const [step, setStep] = useState('form'); // 'form' | 'otp'
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [otpRequestInFlight, setOtpRequestInFlight] = useState(false);

    // OTP state
    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const [otpExpired, setOtpExpired] = useState(false);
    const [timerKey, setTimerKey] = useState(0); // increment to reset timer
    const [pendingEmail, setPendingEmail] = useState('');
    const digitRefs = useRef([]);

    useEffect(() => {
        if (searchParams.get('signup') === 'success') {
            setSuccessMessage('Registration successful. Please sign in to continue.');
            setMode('signin');
        }
    }, [searchParams]);

    const isSignup = mode === 'signup';

    const roleOptions = useMemo(() => ([
        { value: 'USER', label: 'User', icon: UserPlus, description: 'Book facilities and raise tickets' },
        { value: 'TECHNICIAN', label: 'Technician', icon: Wrench, description: 'Manage maintenance tickets' }
    ]), []);

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:8082/oauth2/authorization/google';
    };

    // ── Step 1: submit credentials ───────────────────────────────────────────
    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccessMessage('');

        const normalizedEmail = email.trim().toLowerCase();
        const shouldOpenOtpStepImmediately = mode === 'signup' || normalizedEmail !== 'admin@gmail.com';

        if (shouldOpenOtpStepImmediately) {
            setPendingEmail(normalizedEmail);
            setDigits(['', '', '', '', '', '']);
            setOtpExpired(false);
            setTimerKey(k => k + 1);
            setStep('otp');
            setOtpRequestInFlight(true);
            setSuccessMessage(`Sending OTP to ${normalizedEmail}...`);
        }

        try {
            const response = await requestOtp({ name, email, password, role, mode });
            if (response?.token && response?.user) {
                setOtpRequestInFlight(false);
                setSuccessMessage('Login successful! Redirecting…');
                setTimeout(() => navigate(response.user.role === 'ADMIN' ? '/dashboard' : '/resources'), 500);
                return;
            }

            const otpEmail = response?.email || email.trim();
            setPendingEmail(otpEmail);
            setDigits(['', '', '', '', '', '']);
            setOtpExpired(false);
            setTimerKey(k => k + 1);
            setStep('otp');
            setOtpRequestInFlight(false);
            setSuccessMessage(`OTP sent to ${otpEmail}. Check your inbox.`);
        } catch (err) {
            setOtpRequestInFlight(false);
            if (shouldOpenOtpStepImmediately) {
                setStep('form');
            }
            setError(err.message || 'Authentication failed');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Step 2: verify OTP ───────────────────────────────────────────────────
    const handleVerifyOtp = async (event) => {
        event.preventDefault();
        const otp = digits.join('');
        if (otp.length < 6) {
            setError('Please enter all 6 digits.');
            return;
        }
        setSubmitting(true);
        setError('');
        setSuccessMessage('');

        try {
            await verifyOtp({ email: pendingEmail, otp, mode });
            setSuccessMessage('Verified! Redirecting…');
            setTimeout(() => navigate('/resources'), 800);
        } catch (err) {
            setError(err.message || 'OTP verification failed');
            // Shake the boxes
            setDigits(['', '', '', '', '', '']);
            digitRefs.current[0]?.focus();
        } finally {
            setSubmitting(false);
        }
    };

    // ── Resend OTP ───────────────────────────────────────────────────────────
    const handleResend = async () => {
        setError('');
        setSuccessMessage('');
        setSubmitting(true);
        setOtpRequestInFlight(true);
        try {
            const response = await resendOtp({ email: pendingEmail, mode });
            const otpEmail = response?.email || pendingEmail;
            setPendingEmail(otpEmail);
            setDigits(['', '', '', '', '', '']);
            setOtpExpired(false);
            setTimerKey(k => k + 1);
            setOtpRequestInFlight(false);
            setSuccessMessage(`New OTP sent to ${otpEmail}.`);
            digitRefs.current[0]?.focus();
        } catch (err) {
            setOtpRequestInFlight(false);
            setError(err.message || 'Failed to resend OTP');
        } finally {
            setSubmitting(false);
        }
    };

    // ── OTP digit input handlers ─────────────────────────────────────────────
    const handleDigitChange = (index, e) => {
        const val = e.target.value.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[index] = val;
        setDigits(next);
        if (val && index < 5) digitRefs.current[index + 1]?.focus();
    };

    const handleDigitKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            digitRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) digitRefs.current[index - 1]?.focus();
        if (e.key === 'ArrowRight' && index < 5) digitRefs.current[index + 1]?.focus();
    };

    // Handle paste (e.g. paste "123456" all at once)
    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        const next = Array(6).fill('');
        pasted.split('').forEach((ch, i) => { next[i] = ch; });
        setDigits(next);
        const focusIdx = Math.min(pasted.length, 5);
        digitRefs.current[focusIdx]?.focus();
    };

    const handleOtpExpire = useCallback(() => setOtpExpired(true), []);

    const switchMode = (newMode) => {
        setMode(newMode);
        setStep('form');
        setError('');
        setSuccessMessage('');
        setOtpRequestInFlight(false);
        setDigits(['', '', '', '', '', '']);
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 sm:p-8 font-sans">
            <div className="max-w-5xl w-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-gray-100">

                {/* ── Left: Branding panel ── */}
                <div className="w-full md:w-1/2 relative bg-[#fdfbf7] flex flex-col items-center justify-center overflow-hidden">
                    <img
                        src={loginBg}
                        alt="Minimalist college girl with books"
                        className="absolute inset-0 w-full h-full object-cover scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />
                    <div className="relative z-10 text-center mt-auto mb-10 w-full px-8">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mx-auto max-w-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)]"
                        >
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4 shadow-sm transform -rotate-3">
                                <GraduationCap className="w-7 h-7 text-white" />
                            </div>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">SmartCampus</h1>
                            <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-widest">Operations Hub</p>
                        </button>
                    </div>
                </div>

                {/* ── Right: Form panel ── */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white overflow-y-auto max-h-[90vh]">
                    <div className="w-full max-w-sm mx-auto">

                        {/* Mode tabs — hidden on OTP step */}
                        {step === 'form' && (
                            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                                <button
                                    onClick={() => switchMode('signin')}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${!isSignup ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Sign in
                                </button>
                                <button
                                    onClick={() => switchMode('signup')}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${isSignup ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Sign up
                                </button>
                            </div>
                        )}

                        {/* ── FORM STEP ── */}
                        {step === 'form' && (
                            <>
                                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                                    {isSignup ? 'Create Account' : 'Welcome Back'}
                                </h2>
                                <p className="text-gray-500 mb-6 font-medium text-sm">
                                    {isSignup
                                        ? 'Join the SmartCampus platform today.'
                                        : 'Enter your details — we\'ll email you a verification code.'}
                                </p>

                                {/* Role selector (signup only) */}
                                {isSignup && (
                                    <div className="mb-6">
                                        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Join as</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {roleOptions.map((option) => {
                                                const Icon = option.icon;
                                                const selected = role === option.value;
                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => setRole(option.value)}
                                                        className={`text-left border rounded-xl p-3 transition-all ${selected ? 'border-purple-500 bg-purple-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-white'}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Icon className={`w-4 h-4 ${selected ? 'text-purple-700' : 'text-gray-500'}`} />
                                                            <span className="font-bold text-gray-800 text-xs">{option.label}</span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {isSignup && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Full Name</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-transparent transition-all outline-none text-gray-900 text-sm font-medium"
                                                placeholder="John Doe"
                                                required={isSignup}
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Email</label>
                                        <div className="relative">
                                            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-transparent transition-all outline-none text-gray-900 text-sm font-medium"
                                                placeholder="your@campus.edu"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Password</label>
                                        <div className="relative">
                                            <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-transparent transition-all outline-none text-gray-900 text-sm font-medium"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {successMessage && (
                                        <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm font-bold border border-emerald-100 flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            {successMessage}
                                        </div>
                                    )}
                                    {error && (
                                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 mt-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                    >
                                        {submitting ? (
                                            <><RefreshCw className="w-4 h-4 animate-spin" /> Sending OTP…</>
                                        ) : isSignup ? (
                                            <>Continue <ArrowRight className="w-4 h-4" /></>
                                        ) : (
                                            <><LogIn className="w-4 h-4" /> Continue</>
                                        )}
                                    </button>
                                </form>

                                <div className="my-6 flex items-center gap-3 text-gray-400">
                                    <div className="h-px bg-gray-200 flex-1" />
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">or continue with</span>
                                    <div className="h-px bg-gray-200 flex-1" />
                                </div>

                                <button
                                    onClick={handleGoogleLogin}
                                    className="w-full flex items-center justify-center gap-3 px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold rounded-xl transition-all shadow-sm text-sm"
                                >
                                    <img src="https://img.icons8.com/color/48/000000/google-logo.png" alt="Google" className="w-5 h-5" />
                                    Google
                                </button>
                            </>
                        )}

                        {/* ── OTP STEP ── */}
                        {step === 'otp' && (
                            <div className="flex flex-col items-center text-center">
                                {/* Icon */}
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-5 shadow-lg shadow-purple-200">
                                    <KeyRound className="w-8 h-8 text-white" />
                                </div>

                                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Check your email</h2>
                                <p className="text-sm text-gray-500 font-medium mb-1">
                                    We sent a 6-digit code to
                                </p>
                                <p className="text-sm font-extrabold text-purple-700 mb-6 break-all">{pendingEmail}</p>

                                {/* Countdown */}
                                {!otpExpired && (
                                    <div className="mb-6">
                                        <Countdown key={timerKey} seconds={OTP_EXPIRY_SECONDS} onExpire={handleOtpExpire} />
                                    </div>
                                )}

                                {otpRequestInFlight && (
                                    <div className="w-full bg-blue-50 text-blue-700 px-4 py-3 rounded-xl text-sm font-bold border border-blue-100 flex items-center justify-center gap-2 mb-5">
                                        <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                                        Sending OTP. Please wait...
                                    </div>
                                )}

                                {/* Expired banner */}
                                {otpExpired && (
                                    <div className="w-full bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2 mb-5">
                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                        OTP expired. Please request a new one.
                                    </div>
                                )}

                                {/* OTP digit boxes */}
                                <form onSubmit={handleVerifyOtp} className="w-full">
                                    <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                                        {digits.map((d, i) => (
                                            <OtpDigitInput
                                                key={i}
                                                index={i}
                                                value={d}
                                                inputRef={el => digitRefs.current[i] = el}
                                                onChange={e => handleDigitChange(i, e)}
                                                onKeyDown={e => handleDigitKeyDown(i, e)}
                                            />
                                        ))}
                                    </div>

                                    {successMessage && (
                                        <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm font-bold border border-emerald-100 flex items-center gap-2 mb-4">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            {successMessage}
                                        </div>
                                    )}
                                    {error && (
                                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2 mb-4">
                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={submitting || otpExpired || otpRequestInFlight || digits.join('').length < 6}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-purple-200 hover:shadow-lg hover:-translate-y-0.5"
                                    >
                                        {submitting ? (
                                            <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying…</>
                                        ) : (
                                            <><ShieldCheck className="w-4 h-4" /> Verify &amp; Sign In</>
                                        )}
                                    </button>
                                </form>

                                {/* Resend + back */}
                                <div className="mt-5 flex flex-col items-center gap-2">
                                    <button
                                        onClick={handleResend}
                                        disabled={submitting || otpRequestInFlight}
                                        className="flex items-center gap-1.5 text-sm font-bold text-purple-600 hover:text-purple-800 disabled:text-gray-400 transition-colors"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Resend OTP
                                    </button>
                                    <button
                                        onClick={() => { setStep('form'); setError(''); setSuccessMessage(''); }}
                                        className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
                                    >
                                        ← Back to {isSignup ? 'sign up' : 'sign in'}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
};
