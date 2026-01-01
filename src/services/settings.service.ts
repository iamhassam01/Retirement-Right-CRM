import api from '../api/axios';

export interface AppSettings {
    pipeline_stages?: string[];
    deal_rotting_days?: number;
    notifications?: {
        new_lead: boolean;
        portfolio_drop: boolean;
        workshop_registration: boolean;
        daily_digest: boolean;
    };
    branding?: {
        company_name: string;
        primary_color: string;
    };
    [key: string]: any;
}

export const settingsService = {
    // Get all settings
    getAll: async (): Promise<AppSettings> => {
        const response = await api.get<AppSettings>('/settings');
        return response.data;
    },

    // Get single setting
    get: async (key: string): Promise<any> => {
        const response = await api.get(`/settings/${key}`);
        return response.data;
    },

    // Update single setting
    update: async (key: string, value: any): Promise<void> => {
        await api.put(`/settings/${key}`, { value });
    },

    // Bulk update settings
    updateBulk: async (settings: AppSettings): Promise<void> => {
        await api.post('/settings/bulk', settings);
    },

    // Initialize default settings
    initDefaults: async (): Promise<void> => {
        await api.post('/settings/init');
    }
};
