import api from '../api/axios';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    title?: string;
    role: string;
    isAvailable: boolean;
    createdAt: string;
}

export interface UpdateProfileData {
    name?: string;
    phone?: string;
    avatar?: string;
    title?: string;
}

export const profileService = {
    // Get current user's profile
    async getProfile(): Promise<UserProfile> {
        const response = await api.get('/profile');
        return response.data;
    },

    // Update profile
    async updateProfile(data: UpdateProfileData): Promise<{ success: boolean; user: UserProfile }> {
        const response = await api.put('/profile', data);
        return response.data;
    },

    // Change password
    async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
        const response = await api.put('/profile/password', { currentPassword, newPassword });
        return response.data;
    },

    // Update avatar
    async updateAvatar(avatarUrl: string): Promise<{ success: boolean; avatar: string }> {
        const response = await api.put('/profile/avatar', { avatarUrl });
        return response.data;
    }
};
