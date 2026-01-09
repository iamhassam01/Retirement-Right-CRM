import api from '../api/axios';
import { Client, ClientPhone, ClientEmail } from '../types';

export const clientService = {
    // --- Client CRUD ---
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

    // --- Client ID ---
    getNextClientId: async (): Promise<string> => {
        const response = await api.get<{ clientId: string }>('/clients/next-id');
        return response.data.clientId;
    },

    validateClientId: async (clientId: string, excludeId?: string): Promise<{ valid: boolean; message?: string }> => {
        const url = excludeId
            ? `/clients/validate-id/${clientId}?excludeId=${excludeId}`
            : `/clients/validate-id/${clientId}`;
        const response = await api.get<{ valid: boolean; message?: string }>(url);
        return response.data;
    },

    // --- Phone Management ---
    addPhone: async (clientId: string, data: Partial<ClientPhone>): Promise<ClientPhone> => {
        const response = await api.post<ClientPhone>(`/clients/${clientId}/phones`, data);
        return response.data;
    },

    updatePhone: async (phoneId: string, data: Partial<ClientPhone>): Promise<ClientPhone> => {
        const response = await api.put<ClientPhone>(`/clients/phones/${phoneId}`, data);
        return response.data;
    },

    deletePhone: async (phoneId: string): Promise<void> => {
        await api.delete(`/clients/phones/${phoneId}`);
    },

    setPrimaryPhone: async (clientId: string, phoneId: string): Promise<void> => {
        await api.put(`/clients/${clientId}/phones/${phoneId}/primary`);
    },

    // --- Email Management ---
    addEmail: async (clientId: string, data: Partial<ClientEmail>): Promise<ClientEmail> => {
        const response = await api.post<ClientEmail>(`/clients/${clientId}/emails`, data);
        return response.data;
    },

    updateEmail: async (emailId: string, data: Partial<ClientEmail>): Promise<ClientEmail> => {
        const response = await api.put<ClientEmail>(`/clients/emails/${emailId}`, data);
        return response.data;
    },

    deleteEmail: async (emailId: string): Promise<void> => {
        await api.delete(`/clients/emails/${emailId}`);
    },

    setPrimaryEmail: async (clientId: string, emailId: string): Promise<void> => {
        await api.put(`/clients/${clientId}/emails/${emailId}/primary`);
    },
};
