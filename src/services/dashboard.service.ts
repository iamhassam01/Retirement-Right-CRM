import api from '../api/axios';
import { KPIData } from '../types';

export const dashboardService = {
    getStats: async (): Promise<KPIData[]> => {
        const response = await api.get<KPIData[]>('/dashboard/stats');
        return response.data;
    },
};
