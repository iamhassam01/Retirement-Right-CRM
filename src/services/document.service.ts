import api from '../api/axios';

export interface Document {
    id: string;
    name: string;
    type: string;
    size: string | null;
    url: string;
    category: string | null;
    clientId: string | null;
    createdAt: string;
    updatedAt: string;
    client?: {
        id: string;
        name: string;
    } | null;
}

export const documentService = {
    // Get all documents with optional filtering
    getAll: async (category?: string, clientId?: string): Promise<Document[]> => {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (clientId) params.append('clientId', clientId);

        const response = await api.get<Document[]>(`/documents${params.toString() ? '?' + params.toString() : ''}`);
        return response.data;
    },

    // Get single document
    getById: async (id: string): Promise<Document> => {
        const response = await api.get<Document>(`/documents/${id}`);
        return response.data;
    },

    // Upload document
    upload: async (file: File, category: string, clientId?: string): Promise<Document> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        if (clientId) formData.append('clientId', clientId);

        const response = await api.post<Document>('/documents', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    // Download document
    download: async (id: string): Promise<void> => {
        const response = await api.get(`/documents/${id}/download`, {
            responseType: 'blob'
        });

        // Get filename from content-disposition header or fallback
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'download';
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?(.+)"?/);
            if (match) filename = match[1];
        }

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    // Delete document
    delete: async (id: string): Promise<void> => {
        await api.delete(`/documents/${id}`);
    }
};
