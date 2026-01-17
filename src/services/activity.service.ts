import api from '../api/axios';
import { Activity } from '../types';

export const activityService = {
    getByClient: async (clientId: string): Promise<Activity[]> => {
        const response = await api.get<Activity[]>(`/activities/client/${clientId}`);
        return response.data;
    },

    getAll: async (): Promise<Activity[]> => {
        const response = await api.get<Activity[]>('/activities');
        return response.data;
    },

    create: async (data: {
        clientId: string;
        type: string;
        content?: string;
        notes?: string;
        metadata?: Record<string, any>;
    }): Promise<Activity> => {
        const response = await api.post<Activity>('/activities', data);
        return response.data;
    },
};
