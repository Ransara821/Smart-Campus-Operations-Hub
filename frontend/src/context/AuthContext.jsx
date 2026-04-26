import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const tokenFromUrl = urlParams.get('token');
            
            if (tokenFromUrl) {
                localStorage.setItem('auth_token', tokenFromUrl);
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            const token = localStorage.getItem('auth_token');
            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }

            const res = await axios.get('/api/auth/me');
            
            if (res.status === 204 || !res.data) {
                setUser(null);
                localStorage.removeItem('auth_token');
            } else {
                setUser(res.data);
            }
        } catch (err) {
            console.log('No active auth token or token expired');
            localStorage.removeItem('auth_token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            localStorage.removeItem('auth_token');
            await axios.post('/api/auth/logout');
        } catch (err) {
            console.log('Logout completed');
        } finally {
            setUser(null);
            window.location.href = '/login?logout=true';
        }
    };

    const getAuthErrorMessage = (err, fallbackMessage) => {
        if (err.response?.data?.message) {
            return err.response.data.message;
        }

        if (err.code === 'ECONNABORTED') {
            return 'The server took too long to respond. Please try again.';
        }

        if (err.request) {
            return 'Cannot connect to the backend server at http://localhost:8082. Please start the backend and try again.';
        }

        return fallbackMessage;
    };

    const otpRequestConfig = {
        timeout: 30000,
    };

    /**
     * Step 1 — Submit credentials. Backend validates them and sends OTP to the user's email.
     * Returns the response data ({ message, email, step }) on success.
     */
    const requestOtp = async ({ name, email, password, role, mode }) => {
        try {
            const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/signin';
            const payload = mode === 'signup'
                ? { name, email, password, role }
                : { email, password };
            const res = await axios.post(endpoint, payload, otpRequestConfig);
            if (res.data?.token && res.data?.user) {
                localStorage.setItem('auth_token', res.data.token);
                setUser(res.data.user);
            }
            return res.data; // { message, email, step: 'otp_required' }
        } catch (err) {
            throw new Error(getAuthErrorMessage(err, 'Authentication failed'));
        }
    };

    /**
     * Step 2 — Verify OTP. Backend checks the code and returns JWT + user on success.
     * Stores the token and sets the user in context.
     */
    const verifyOtp = async ({ email, otp, mode }) => {
        try {
            const endpoint = mode === 'signup'
                ? '/api/auth/signup/verify-otp'
                : '/api/auth/signin/verify-otp';
            const res = await axios.post(endpoint, { email, otp });
            localStorage.setItem('auth_token', res.data.token);
            setUser(res.data.user);
            return res.data;
        } catch (err) {
            throw new Error(getAuthErrorMessage(err, 'OTP verification failed'));
        }
    };

    /**
     * Resend OTP — generates a fresh code and emails it again.
     */
    const resendOtp = async ({ email, mode }) => {
        try {
            const res = await axios.post('/api/auth/resend-otp', { email, mode }, otpRequestConfig);
            return res.data;
        } catch (err) {
            throw new Error(getAuthErrorMessage(err, 'Failed to resend OTP'));
        }
    };

    // Legacy helpers kept for any other callers
    const signin = async (email, password) => {
        return requestOtp({ email, password, mode: 'signin' });
    };

    const signup = async ({ name, email, password, role }) => {
        return requestOtp({ name, email, password, role, mode: 'signup' });
    };

    return (
        <AuthContext.Provider value={{
            user, setUser, loading, checkAuth, logout,
            signin, signup,
            requestOtp, verifyOtp, resendOtp,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
