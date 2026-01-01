import api from '../api/axios';

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'ADVISOR' | 'STAFF';
    createdAt: string;
    updatedAt: string;
}

export interface InviteTeamMemberPayload {
    name: string;
    email: string;
    role?: 'ADMIN' | 'ADVISOR' | 'STAFF';
}

export const teamService = {
    // Get all team members
    getAll: async (): Promise<TeamMember[]> => {
        const response = await api.get<TeamMember[]>('/team');
        return response.data;
    },

    // Get single team member
    getById: async (id: string): Promise<TeamMember> => {
        const response = await api.get<TeamMember>(`/team/${id}`);
        return response.data;
    },

    // Invite new team member
    invite: async (data: InviteTeamMemberPayload): Promise<TeamMember> => {
        const response = await api.post<TeamMember>('/team', data);
        return response.data;
    },

    // Update team member
    update: async (id: string, data: Partial<InviteTeamMemberPayload>): Promise<TeamMember> => {
        const response = await api.put<TeamMember>(`/team/${id}`, data);
        return response.data;
    },

    // Delete team member
    delete: async (id: string): Promise<void> => {
        await api.delete(`/team/${id}`);
    }
};
