import api from '../api/axios';
import { Task } from '../types';

export const taskService = {
    getAll: async (): Promise<Task[]> => {
        const response = await api.get<Task[]>('/tasks');
        return response.data;
    },

    create: async (data: Partial<Task>): Promise<Task> => {
        const response = await api.post<Task>('/tasks', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Task>): Promise<Task> => {
        const response = await api.put<Task>(`/tasks/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/tasks/${id}`);
    },

    snooze: async (id: string, newDueDate: Date): Promise<Task> => {
        const response = await api.put<Task>(`/tasks/${id}`, { dueDate: newDueDate.toISOString() });
        return response.data;
    },

    getById: async (id: string): Promise<Task> => {
        const response = await api.get<Task>(`/tasks/${id}`);
        return response.data;
    },
};
