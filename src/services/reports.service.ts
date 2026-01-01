import api from '../api/axios';

export interface ReportsSummary {
    totalAum: string;
    totalAumRaw: number;
    activeClients: number;
    leads: number;
    prospects: number;
    newClientsInPeriod: number;
    newLeadsInPeriod: number;
    tasksCompleted: number;
    tasksPending: number;
    eventsInPeriod: number;
    activitiesInPeriod: number;
}

export interface PipelineStage {
    stage: string;
    count: number;
}

export interface AumTrendPoint {
    month: string;
    aum: number;
}

export interface ReportsOverview {
    summary: ReportsSummary;
    pipelineDistribution: PipelineStage[];
    aumTrend: AumTrendPoint[];
    period: string;
}

export interface AcquisitionSource {
    name: string;
    count: number;
    percentage: number;
}

export interface AcquisitionStats {
    total: number;
    sources: AcquisitionSource[];
}

export const reportsService = {
    // Get reports overview with optional date range
    getOverview: async (days: number = 30): Promise<ReportsOverview> => {
        const response = await api.get<ReportsOverview>(`/reports/overview?range=${days}`);
        return response.data;
    },

    // Get client acquisition stats
    getAcquisitionStats: async (): Promise<AcquisitionStats> => {
        const response = await api.get<AcquisitionStats>('/reports/acquisition');
        return response.data;
    }
};
