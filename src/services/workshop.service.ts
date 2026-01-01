import api from '../api/axios';

export interface Workshop {
    id: string;
    title: string;
    type: string;
    startTime: string;
    endTime: string;
    status: string;
    capacity: number | null;
    registered: number | null;
    location: string | null;
    clientId: string | null;
    advisorId: string | null;
    createdAt: string;
    updatedAt: string;
    advisor?: {
        id: string;
        name: string;
    } | null;
}

export interface CreateWorkshopPayload {
    title: string;
    startTime: string;
    endTime?: string;
    location?: string;
    capacity?: number;
    status?: string;
}

export const workshopService = {
    // Get all workshops
    getAll: async (status?: string): Promise<Workshop[]> => {
        const params = status ? `?status=${status}` : '';
        const response = await api.get<Workshop[]>(`/workshops${params}`);
        return response.data;
    },

    // Get single workshop
    getById: async (id: string): Promise<Workshop> => {
        const response = await api.get<Workshop>(`/workshops/${id}`);
        return response.data;
    },

    // Create workshop
    create: async (data: CreateWorkshopPayload): Promise<Workshop> => {
        const response = await api.post<Workshop>('/workshops', data);
        return response.data;
    },

    // Update workshop
    update: async (id: string, data: Partial<CreateWorkshopPayload>): Promise<Workshop> => {
        const response = await api.put<Workshop>(`/workshops/${id}`, data);
        return response.data;
    },

    // Delete workshop
    delete: async (id: string): Promise<void> => {
        await api.delete(`/workshops/${id}`);
    },

    // Register for workshop
    register: async (id: string): Promise<Workshop> => {
        const response = await api.post<Workshop>(`/workshops/${id}/register`);
        return response.data;
    }
};
