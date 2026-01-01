import { fetchApi } from '../lib/api';
import { Client, Activity, CalendarEvent } from '../types';

// --- CLIENT SERVICES ---

export const getClients = async (): Promise<Client[]> => {
  const clients = await fetchApi<Client[]>('/clients');
  return clients || [];
};

export const getClientById = async (id: string): Promise<Client | null> => {
  try {
    const client = await fetchApi<Client>(`/clients/${id}`);
    return client;
  } catch (error) {
    console.error('Failed to fetch client:', error);
    return null;
  }
};

// --- CALENDAR SERVICES ---

export const getCalendarEvents = async (startDate: Date, endDate: Date): Promise<CalendarEvent[]> => {
  try {
    const query = `?start=${startDate.toISOString()}&end=${endDate.toISOString()}`;
    const events = await fetchApi<any[]>(`/events${query}`);

    // Convert string dates from JSON back to Date objects
    const parsedEvents = events.map(e => ({
      ...e,
      start: new Date(e.startTime || e.start),
      end: new Date(e.endTime || e.end)
    }));

    return parsedEvents;
  } catch (error) {
    console.warn('Failed to fetch calendar events:', error);
    return [];
  }
};

export const createEvent = async (event: Partial<CalendarEvent>, clientId?: string) => {
  return await fetchApi('/events', {
    method: 'POST',
    body: JSON.stringify({ ...event, clientId }),
  });
};

// --- ACTIVITY SERVICES ---

// Polling fallback since we removed Supabase Realtime
// In a full production build, we would use Socket.io, but polling is 
// easier to deploy on a basic VPS setup.
export const subscribeToClientActivities = (clientId: string, callback: (payload: any) => void) => {
  const interval = setInterval(async () => {
    try {
      const activities = await fetchApi<Activity[]>(`/clients/${clientId}/activities/latest`);
      if (activities && activities.length > 0) {
        // In a real polling scenario, you'd track the last ID seen.
        // For this demo, we just fetch latest.
        activities.forEach(a => callback(a));
      }
    } catch (e) {
      // ignore errors during polling
    }
  }, 5000); // Check every 5 seconds

  return {
    unsubscribe: () => clearInterval(interval)
  };
};