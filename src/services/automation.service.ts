import api from '../api/axios';

export interface Template {
    id: string;
    name: string;
    type: string;
    subject: string;
    body: string;
    variables: string[];
    usageCount: number;
    lastUsedAt: string | null;
    createdAt: string;
    updatedAt: string;
    _count?: { automationLogs: number };
}

export interface AutomationLog {
    id: string;
    templateId: string;
    template?: { name: string; subject: string };
    recipientCount: number;
    sentCount: number;
    failedCount: number;
    status: 'pending' | 'sending' | 'completed' | 'partial' | 'failed';
    errorDetails?: any;
    createdAt: string;
    completedAt?: string;
}

export interface Recipient {
    clientId: string;
    email: string;
    client_name: string;
    first_name: string;
    advisor_name?: string;
}

export const automationService = {
    // Templates
    getTemplates: async (): Promise<Template[]> => {
        const response = await api.get('/automation/templates');
        return response.data;
    },

    getTemplate: async (id: string): Promise<Template> => {
        const response = await api.get(`/automation/templates/${id}`);
        return response.data;
    },

    createTemplate: async (data: Partial<Template>): Promise<Template> => {
        const response = await api.post('/automation/templates', data);
        return response.data;
    },

    updateTemplate: async (id: string, data: Partial<Template>): Promise<Template> => {
        const response = await api.put(`/automation/templates/${id}`, data);
        return response.data;
    },

    deleteTemplate: async (id: string): Promise<void> => {
        await api.delete(`/automation/templates/${id}`);
    },

    // Automation Logs
    getLogs: async (): Promise<AutomationLog[]> => {
        const response = await api.get('/automation/logs');
        return response.data;
    },

    // Send Emails
    sendEmails: async (templateId: string, recipients: Recipient[]): Promise<{
        success: boolean;
        logId: string;
        sent: number;
        failed: number;
    }> => {
        const response = await api.post('/automation/send', { templateId, recipients });
        return response.data;
    }
};
