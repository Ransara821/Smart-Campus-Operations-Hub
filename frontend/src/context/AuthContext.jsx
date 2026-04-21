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
            window.location.href = '/login';
        }
    };

    const signin = async (email, password) => {
        try {
            const res = await axios.post('/api/auth/signin', { email, password });
            localStorage.setItem('auth_token', res.data.token);
            setUser(res.data.user);
            return res.data; // Return the full response (user + token)
        } catch (err) {
            throw new Error(err.response?.data?.message || 'Sign in failed');
        }
    };

    const signup = async ({ name, email, password, role }) => {
        try {
            const res = await axios.post('/api/auth/signup', { name, email, password, role });
            // Registration successful. We return the data but do NOT log the user in.
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || 'Sign up failed');
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, checkAuth, logout, signin, signup }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
