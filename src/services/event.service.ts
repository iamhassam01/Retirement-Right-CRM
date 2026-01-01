import api from '../api/axios';
import { CalendarEvent } from '../types';

// API sends startTime/endTime, frontend uses start/end Date objects
interface EventPayload {
    title: string;
    startTime: string;
    endTime: string;
    type?: string;
    clientId?: string;
}

interface EventResponse {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    type: string;
    clientId?: string;
}

// Helper to map API type to CalendarEvent type
const mapEventType = (type?: string): 'Meeting' | 'Call' | 'Workshop' | 'Personal' => {
    if (type === 'Meeting' || type === 'Call' || type === 'Workshop' || type === 'Personal') {
        return type;
    }
    return 'Meeting';
};

export const eventService = {
    getAll: async (): Promise<CalendarEvent[]> => {
        const response = await api.get<EventResponse[]>('/events');
        // Convert API response to CalendarEvent format
        return response.data.map(event => ({
            id: event.id,
            title: event.title,
            type: mapEventType(event.type),
            start: new Date(event.startTime),
            end: new Date(event.endTime),
        }));
    },

    create: async (data: EventPayload): Promise<CalendarEvent> => {
        const response = await api.post<EventResponse>('/events', data);
        return {
            id: response.data.id,
            title: response.data.title,
            type: mapEventType(response.data.type),
            start: new Date(response.data.startTime),
            end: new Date(response.data.endTime),
        };
    },
};
