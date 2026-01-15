import api from '../api/axios';

export interface Note {
    id: string;
    clientId: string;
    authorId: string;
    author: {
        id: string;
        name: string;
        avatar?: string;
    };
    title?: string;
    content: string;
    category?: string;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateNoteData {
    clientId: string;
    title?: string;
    content: string;
    category?: string;
}

export interface UpdateNoteData {
    title?: string;
    content: string;
    category?: string;
}

export const noteService = {
    // Get all notes for a client
    async getByClient(clientId: string): Promise<Note[]> {
        const response = await api.get(`/notes/client/${clientId}`);
        return response.data;
    },

    // Create a new note
    async create(data: CreateNoteData): Promise<Note> {
        const response = await api.post('/notes', data);
        return response.data;
    },

    // Update a note
    async update(id: string, data: UpdateNoteData): Promise<Note> {
        const response = await api.put(`/notes/${id}`, data);
        return response.data;
    },

    // Delete a note
    async delete(id: string): Promise<{ success: boolean }> {
        const response = await api.delete(`/notes/${id}`);
        return response.data;
    },

    // Toggle pin status
    async togglePin(id: string): Promise<Note> {
        const response = await api.put(`/notes/${id}/pin`);
        return response.data;
    }
};
