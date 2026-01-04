import api from '../api/axios';

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

export const notificationService = {
    // Get all notifications
    async getAll(unreadOnly = false): Promise<{ notifications: Notification[]; unreadCount: number }> {
        const response = await api.get('/notifications', {
            params: { unreadOnly }
        });
        return response.data;
    },

    // Mark single notification as read
    async markAsRead(id: string): Promise<{ success: boolean }> {
        const response = await api.put(`/notifications/${id}/read`);
        return response.data;
    },

    // Mark all notifications as read
    async markAllAsRead(): Promise<{ success: boolean }> {
        const response = await api.put('/notifications/read-all');
        return response.data;
    },

    // Delete notification
    async delete(id: string): Promise<{ success: boolean }> {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    }
};
