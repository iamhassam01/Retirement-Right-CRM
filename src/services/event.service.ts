import api from '../api/axios';
import { CalendarEvent } from '../types';

// API may send start/end or startTime/endTime depending on endpoint
interface EventResponse {
    id: string;
    title: string;
    start?: string;
    end?: string;
    startTime?: string;
    endTime?: string;
    type: string;
    clientId?: string;
    clientName?: string;
    advisorName?: string;
}

// Helper to map API type to CalendarEvent type
const mapEventType = (type?: string): 'Meeting' | 'Call' | 'Workshop' | 'Personal' => {
    if (type === 'Meeting' || type === 'Call' || type === 'Workshop' || type === 'Personal') {
        return type;
    }
    return 'Meeting';
};

// Helper to safely parse date, returns null if invalid
const safeParseDate = (dateStr?: string): Date | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
};

export const eventService = {
    getAll: async (): Promise<CalendarEvent[]> => {
        const response = await api.get<EventResponse[]>('/events');
        // Convert API response to CalendarEvent format
        // Handle both start/end and startTime/endTime property names
        return response.data.map(event => {
            const startDate = safeParseDate(event.start || event.startTime);
            const endDate = safeParseDate(event.end || event.endTime);

            return {
                id: event.id,
                title: event.title,
                type: mapEventType(event.type),
                start: startDate || new Date(),
                end: endDate || new Date(),
                clientName: event.clientName,
                advisorName: event.advisorName
            };
        });
    },

    create: async (data: { title: string; start: Date; end: Date; type?: string; clientId?: string }): Promise<CalendarEvent> => {
        const payload = {
            title: data.title,
            start: data.start.toISOString(),
            end: data.end.toISOString(),
            type: data.type || 'Meeting',
            clientId: data.clientId
        };
        const response = await api.post<EventResponse>('/events', payload);
        const startDate = safeParseDate(response.data.start || response.data.startTime);
        const endDate = safeParseDate(response.data.end || response.data.endTime);

        return {
            id: response.data.id,
            title: response.data.title,
            type: mapEventType(response.data.type),
            start: startDate || new Date(),
            end: endDate || new Date(),
        };
    },
};
