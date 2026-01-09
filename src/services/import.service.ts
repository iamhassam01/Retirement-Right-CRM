import api from '../api/axios';
import { ImportPreview, ImportResult, ImportJob, ColumnMapping, DuplicateStrategy } from '../types';

export const importService = {
    /**
     * Upload a file and get a preview of the data
     */
    uploadPreview: async (file: File): Promise<ImportPreview> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<ImportPreview>('/import/upload-preview', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    /**
     * Execute the import with column mappings and duplicate strategy
     */
    executeImport: async (
        jobId: string,
        mappings: ColumnMapping[],
        duplicateStrategy: DuplicateStrategy
    ): Promise<ImportResult> => {
        const response = await api.post<ImportResult>(`/import/execute/${jobId}`, {
            mappings,
            duplicateStrategy
        });
        return response.data;
    },

    /**
     * Get the status of an import job
     */
    getImportJob: async (jobId: string): Promise<ImportJob> => {
        const response = await api.get<ImportJob>(`/import/job/${jobId}`);
        return response.data;
    },

    /**
     * Get import history
     */
    getImportHistory: async (): Promise<ImportJob[]> => {
        const response = await api.get<ImportJob[]>('/import/history');
        return response.data;
    },

    /**
     * Download import template
     */
    downloadTemplate: async (format: 'csv' | 'xlsx'): Promise<void> => {
        const response = await api.get(`/import/template/${format}`, {
            responseType: 'blob'
        });

        // Create download link
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `import_template.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
};
