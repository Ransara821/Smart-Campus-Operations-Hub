import axios from 'axios';

// Create axios instance with base configuration
const axiosInstance = axios.create({
    baseURL: 'http://localhost:8081',
    withCredentials: true, // Required for session/cookies
    timeout: 10000, // 10 second timeout
});

// Dynamically update baseURL based on current hostname
axiosInstance.interceptors.request.use(
    (config) => {
        // Dynamically set baseURL based on frontend URL
        const hostname = window.location.hostname;
        if (hostname === '172.28.15.11') {
            config.baseURL = 'http://172.28.15.11:8081';
        } else {
            config.baseURL = 'http://localhost:8081';
        }
        
        // Set Content-Type to application/json for non-FormData requests
        // FormData requests should not have Content-Type set (axios handles it automatically with boundary)
        if (!(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
        }
        
        // Add Authentication Header if JWT token exists
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
        console.log('📦 Request Data:', config.data);
        console.log('🌐 Base URL:', config.baseURL);
        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
    (response) => {
        console.log('✅ API Response:', response.status, response.config.url);
        console.log('📥 Response Data:', response.data);
        return response;
    },
    (error) => {
        // Silently handle 401 errors for auth check endpoint
        if (error.response?.status === 401 && error.config?.url === '/api/auth/me') {
            console.log('👤 Not authenticated (expected during initial load)');
            return Promise.reject(error);
        }
        
        console.error('❌ API Error:', error.message);
        if (error.response) {
            console.error('📛 Error Response:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('📛 No Response Received - Check if backend is running on http://localhost:8081');
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
