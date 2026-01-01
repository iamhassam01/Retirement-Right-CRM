import api from '../api/axios';

export interface Template {
    id: string;
    name: string;
    type: 'Email' | 'SMS';
    subject: string | null;
    body: string;
    variables: string[];
    usageCount: number;
    lastUsedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CommunicationLog {
    id: string;
    recipientId: string | null;
    recipient?: {
        id: string;
        name: string;
        email?: string;
    } | null;
    templateId: string | null;
    template?: {
        id: string;
        name: string;
        type: string;
    } | null;
    channel: string;
    status: string;
    sentAt: string;
    metadata: any;
}

export interface CreateTemplatePayload {
    name: string;
    type: 'Email' | 'SMS';
    subject?: string;
    body: string;
    variables?: string[];
}

export const templateService = {
    // Get all templates
    getAll: async (): Promise<Template[]> => {
        const response = await api.get<Template[]>('/templates');
        return response.data;
    },

    // Get single template
    getById: async (id: string): Promise<Template> => {
        const response = await api.get<Template>(`/templates/${id}`);
        return response.data;
    },

    // Create template
    create: async (data: CreateTemplatePayload): Promise<Template> => {
        const response = await api.post<Template>('/templates', data);
        return response.data;
    },

    // Update template
    update: async (id: string, data: Partial<CreateTemplatePayload>): Promise<Template> => {
        const response = await api.put<Template>(`/templates/${id}`, data);
        return response.data;
    },

    // Delete template
    delete: async (id: string): Promise<void> => {
        await api.delete(`/templates/${id}`);
    },

    // Get communication logs
    getLogs: async (limit: number = 50): Promise<CommunicationLog[]> => {
        const response = await api.get<CommunicationLog[]>(`/templates/logs/all?limit=${limit}`);
        return response.data;
    },

    // Log a communication
    log: async (data: {
        recipientId?: string;
        templateId?: string;
        channel: string;
        status?: string;
        metadata?: any;
    }): Promise<CommunicationLog> => {
        const response = await api.post<CommunicationLog>('/templates/logs', data);
        return response.data;
    }
};
