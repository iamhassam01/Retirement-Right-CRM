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

    // Download document securely via authenticated Direct URL
    // This allows the browser to handle the file stream and respect Content-Disposition header
    download: async (id: string, filename: string): Promise<void> => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No auth token found');
            return;
        }

        const url = `/api/documents/${id}/download?token=${token}`;

        const link = document.createElement('a');
        link.href = url;
        // Setting download attribute acts as a fallback, but server header takes precedence
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // Delete document
    delete: async (id: string): Promise<void> => {
        await api.delete(`/documents/${id}`);
    }
};
