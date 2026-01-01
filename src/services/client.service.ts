import api from '../api/axios';
import { Client } from '../types';

export const clientService = {
    getAll: async (): Promise<Client[]> => {
        const response = await api.get<Client[]>('/clients');
        return response.data;
    },

    getById: async (id: string): Promise<Client> => {
        const response = await api.get<Client>(`/clients/${id}`);
        return response.data;
    },

    create: async (data: Partial<Client>): Promise<Client> => {
        const response = await api.post<Client>('/clients', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Client>): Promise<Client> => {
        const response = await api.put<Client>(`/clients/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/clients/${id}`);
    },
};
