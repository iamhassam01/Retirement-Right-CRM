import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Proxy is set up in Vite or Nginx
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 (Unauthorized) and 403 (Forbidden) - session expired
        if (error.response && (error.response.status === 401 || error.response.status === 403) && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const response = await axios.post('/api/auth/refresh-token', { token });
                    if (response.data.token) {
                        localStorage.setItem('token', response.data.token);
                        originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
                        return api(originalRequest);
                    }
                }
            } catch (refreshError) {
                // Token refresh failed - clear storage and redirect to login
                console.warn('Session expired - redirecting to login');
            }

            // Clear storage and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Show brief toast message before redirecting
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                // Create toast notification
                const toast = document.createElement('div');
                toast.className = 'fixed top-4 right-4 bg-amber-500 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] animate-in slide-in-from-top';
                toast.innerHTML = 'Session expired. Redirecting to login...';
                document.body.appendChild(toast);

                // Redirect after brief delay
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            }

            return Promise.reject(new Error('Session expired'));
        }

        return Promise.reject(error);
    }
);

export default api;

