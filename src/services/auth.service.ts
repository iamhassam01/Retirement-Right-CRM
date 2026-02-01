import api from '../api/axios';

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export const authService = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    register: async (name: string, email: string, password: string, phone?: string): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/register', { name, email, password, phone });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser: (): User | null => {
        const userStr = localStorage.getItem('user');
        if (userStr) return JSON.parse(userStr);
        return null;
    },

    forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (email: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.post('/auth/reset-password', { email, newPassword });
        return response.data;
    },
};
