import axios from 'axios';
import {
    EventTemplate,
    EventOccurrence,
    CreateEventTemplateInput,
    CreateOccurrenceInput,
    SyncResult,
    WPStatus
} from '../types';

const API_URL = '/api';

// ========== EVENT TEMPLATES ==========

export const getEventTemplates = async (includeInactive = false): Promise<EventTemplate[]> => {
    const response = await axios.get(`${API_URL}/event-templates`, {
        params: { includeInactive }
    });
    return response.data;
};

export const getEventTemplate = async (id: string): Promise<EventTemplate> => {
    const response = await axios.get(`${API_URL}/event-templates/${id}`);
    return response.data;
};

export const createEventTemplate = async (data: CreateEventTemplateInput): Promise<EventTemplate> => {
    const response = await axios.post(`${API_URL}/event-templates`, data);
    return response.data;
};

export const updateEventTemplate = async (
    id: string,
    data: Partial<CreateEventTemplateInput & { isActive: boolean }>
): Promise<EventTemplate> => {
    const response = await axios.put(`${API_URL}/event-templates/${id}`, data);
    return response.data;
};

export const deleteEventTemplate = async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/event-templates/${id}`);
};

export const syncTemplateToWordPress = async (
    id: string,
    status: WPStatus = 'draft'
): Promise<SyncResult> => {
    const response = await axios.post(`${API_URL}/event-templates/${id}/sync`, { status });
    return response.data;
};

// ========== EVENT OCCURRENCES ==========

export const getOccurrences = async (
    templateId: string,
    options?: { status?: string; upcoming?: boolean }
): Promise<EventOccurrence[]> => {
    const response = await axios.get(`${API_URL}/event-occurrences/template/${templateId}`, {
        params: options
    });
    return response.data;
};

export const getUpcomingOccurrences = async (limit = 20): Promise<EventOccurrence[]> => {
    const response = await axios.get(`${API_URL}/event-occurrences/upcoming`, {
        params: { limit }
    });
    return response.data;
};

export const getOccurrence = async (id: string): Promise<EventOccurrence> => {
    const response = await axios.get(`${API_URL}/event-occurrences/${id}`);
    return response.data;
};

export const createOccurrence = async (
    templateId: string,
    data: CreateOccurrenceInput
): Promise<EventOccurrence> => {
    const response = await axios.post(`${API_URL}/event-occurrences/template/${templateId}`, data);
    return response.data;
};

export const updateOccurrence = async (
    id: string,
    data: Partial<CreateOccurrenceInput & { status: string }>
): Promise<EventOccurrence> => {
    const response = await axios.put(`${API_URL}/event-occurrences/${id}`, data);
    return response.data;
};

export const deleteOccurrence = async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/event-occurrences/${id}`);
};

export const syncOccurrence = async (
    id: string,
    status: WPStatus = 'draft'
): Promise<{ success: boolean; occurrence?: EventOccurrence; error?: string }> => {
    const response = await axios.post(`${API_URL}/event-occurrences/${id}/sync`, { status });
    return response.data;
};

export const bulkCreateOccurrences = async (
    templateId: string,
    occurrences: CreateOccurrenceInput[],
    wpStatus: WPStatus = 'draft'
): Promise<{ created: number; synced: number; failed: number; errors: string[] }> => {
    const response = await axios.post(`${API_URL}/event-occurrences/template/${templateId}/bulk`, {
        occurrences,
        wpStatus
    });
    return response.data;
};

// ========== HELPERS ==========

export const formatEventDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

export const formatEventTime = (time?: string): string => {
    if (!time) return '';
    return time;
};

export const getSyncStatusColor = (status?: string): string => {
    switch (status) {
        case 'synced': return 'text-green-600 bg-green-50';
        case 'pending': return 'text-yellow-600 bg-yellow-50';
        case 'failed': return 'text-red-600 bg-red-50';
        case 'deleted': return 'text-gray-600 bg-gray-50';
        default: return 'text-gray-400 bg-gray-50';
    }
};

export const getSyncStatusLabel = (status?: string): string => {
    switch (status) {
        case 'synced': return 'Synced';
        case 'pending': return 'Pending';
        case 'failed': return 'Failed';
        case 'deleted': return 'Deleted';
        default: return 'Not synced';
    }
};
