import api from '../api/axios';

export interface TimeBlock {
    id: string;
    userId: string;
    title?: string;
    type: 'busy' | 'personal' | 'out_of_office';
    startTime: string;
    endTime: string;
    isRecurring: boolean;
    recurrenceRule?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTimeBlockData {
    title?: string;
    type?: 'busy' | 'personal' | 'out_of_office';
    startTime: string;
    endTime: string;
    isRecurring?: boolean;
    recurrenceRule?: string;
}

export interface UpdateTimeBlockData {
    title?: string;
    type?: 'busy' | 'personal' | 'out_of_office';
    startTime?: string;
    endTime?: string;
    isRecurring?: boolean;
    recurrenceRule?: string;
}

export const timeBlockService = {
    // Get current user's time blocks
    async getAll(startDate?: Date, endDate?: Date): Promise<TimeBlock[]> {
        const params: any = {};
        if (startDate) params.startDate = startDate.toISOString();
        if (endDate) params.endDate = endDate.toISOString();

        const response = await api.get('/timeblocks', { params });
        return response.data;
    },

    // Get another user's time blocks (masked for privacy)
    async getForUser(userId: string, startDate?: Date, endDate?: Date): Promise<TimeBlock[]> {
        const params: any = {};
        if (startDate) params.startDate = startDate.toISOString();
        if (endDate) params.endDate = endDate.toISOString();

        const response = await api.get(`/timeblocks/user/${userId}`, { params });
        return response.data;
    },

    // Create a new time block
    async create(data: CreateTimeBlockData): Promise<TimeBlock> {
        const response = await api.post('/timeblocks', data);
        return response.data;
    },

    // Update a time block
    async update(id: string, data: UpdateTimeBlockData): Promise<TimeBlock> {
        const response = await api.put(`/timeblocks/${id}`, data);
        return response.data;
    },

    // Delete a time block
    async delete(id: string): Promise<void> {
        await api.delete(`/timeblocks/${id}`);
    }
};
