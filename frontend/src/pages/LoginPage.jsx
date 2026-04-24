import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, GraduationCap, ArrowRight, Lock, Mail, ShieldCheck, UserPlus, Wrench } from 'lucide-react';
import loginBg from '../assets/login-bg.png';

export const LoginPage = () => {
    const { signin, signup } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState('signin');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('USER');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const isSignup = mode === 'signup';
    const roleOptions = useMemo(() => ([
        { value: 'USER', label: 'User', icon: UserPlus, description: 'Book facilities and raise tickets' },
        { value: 'TECHNICIAN', label: 'Technician', icon: Wrench, description: 'Manage maintenance tickets' }
    ]), []);

    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:8082/oauth2/authorization/google";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            if (isSignup) {
                const data = await signup({ name, email, password, role });
                // If it's a new signup, always go to role selection to confirm
                navigate('/select-role?new=true');
            } else {
                const data = await signin(email, password);
                // For returning users:
                // If they are admin, they might go to resources or an admin dashboard
                // For now, /resources is the main dashboard for all roles
                navigate('/resources');
            }
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setSubmitting(false);
        }
    };

    const loginAsDev = async (devRole) => {
        try {
            setSubmitting(true);
            if (devRole === 'ADMIN') await signin('dev-admin@smartcampus.local', 'password');
            else if (devRole === 'USER') await signin('dev-user@smartcampus.local', 'password');
            else if (devRole === 'TECHNICIAN') await signin('dev-technician@smartcampus.local', 'password');
            
            navigate('/resources');
        } catch (err) {
            setError(err.message || 'Dev login failed');
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 sm:p-8 font-sans">
            <div className="max-w-5xl w-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-gray-100">
                
                {/* Left Side: Image & Branding */}
                <div className="w-full md:w-1/2 relative bg-[#fdfbf7] flex flex-col items-center justify-center overflow-hidden">
                    <img 
                        src={loginBg} 
                        alt="Minimalist college girl with books" 
                        className="absolute inset-0 w-full h-full object-cover scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent"></div>
                    <div className="relative z-10 text-center mt-auto mb-10 w-full px-8">
                        <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mx-auto max-w-sm">
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4 shadow-sm transform -rotate-3">
                                <GraduationCap className="w-7 h-7 text-white" />
                            </div>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">SmartCampus</h1>
                            <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-widest">Operations Hub</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white overflow-y-auto max-h-[90vh]">
                    <div className="w-full max-w-sm mx-auto">
                        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                            <button
                                onClick={() => setMode('signin')}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${!isSignup ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Sign in
                            </button>
                            <button
                                onClick={() => setMode('signup')}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${isSignup ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Sign up
                            </button>
                        </div>

                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
                        <p className="text-gray-500 mb-6 font-medium text-sm">
                            {isSignup ? 'Join the SmartCampus platform today.' : 'Please enter your details to sign in.'}
                        </p>

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

                            {isSignup && (
                                <div className="pt-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Join as</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {roleOptions.map((option) => {
                                            const Icon = option.icon;
                                            const selected = role === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setRole(option.value)}
                                                    className={`text-left border rounded-xl p-3 transition-all ${selected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-white'}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Icon className={`w-4 h-4 ${selected ? 'text-purple-700' : 'text-gray-500'}`} />
                                                        <span className="font-bold text-gray-800 text-sm">{option.label}</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 mt-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                            >
                                {isSignup ? (
                                    <>Create Account <ArrowRight className="w-4 h-4" /></>
                                ) : (
                                    <><LogIn className="w-4 h-4" /> {submitting ? 'Signing in...' : 'Sign In'}</>
                                )}
                            </button>
                        </form>

                        <div className="my-6 flex items-center gap-3 text-gray-400">
                            <div className="h-px bg-gray-200 flex-1"></div>
                            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">or continue with</span>
                            <div className="h-px bg-gray-200 flex-1"></div>
                        </div>

                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold rounded-xl transition-all shadow-sm text-sm"
                        >
                            <img src="https://img.icons8.com/color/48/000000/google-logo.png" alt="Google" className="w-5 h-5" />
                            Google
                        </button>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <div className="relative mb-4">
                                <div className="relative flex justify-center text-[10px]">
                                    <span className="px-3 bg-white text-gray-400 font-bold uppercase tracking-widest">Quick Login (Demo)</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => loginAsDev('ADMIN')}
                                    className="px-2 py-2 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center"
                                >
                                    Admin
                                </button>
                                <button
                                    type="button"
                                    onClick={() => loginAsDev('USER')}
                                    className="px-2 py-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors text-center"
                                >
                                    User
                                </button>
                                <button
                                    type="button"
                                    onClick={() => loginAsDev('TECHNICIAN')}
                                    className="px-2 py-2 text-[11px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-center"
                                >
                                    Tech
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
