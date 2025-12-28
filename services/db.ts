import { fetchApi } from '../lib/api';
import { Client, Activity, CalendarEvent } from '../types';
import { MOCK_CLIENTS, MOCK_EVENTS } from '../constants';

// --- CLIENT SERVICES ---

export const getClients = async (): Promise<Client[]> => {
  try {
    // Attempt to fetch from your VPS Backend
    const clients = await fetchApi<Client[]>('/clients');
    
    // If backend returns empty list (fresh install), fallback to mocks for demo purposes
    if (!clients || clients.length === 0) {
      return MOCK_CLIENTS;
    }
    return clients;
  } catch (error) {
    console.warn('Backend unavailable, using mocks:', error);
    return MOCK_CLIENTS;
  }
};

export const getClientById = async (id: string): Promise<Client | null> => {
  try {
    const client = await fetchApi<Client>(`/clients/${id}`);
    
    // Merge backend data with mock structure if necessary to ensure UI stability
    // during the transition phase.
    return client;
  } catch (error) {
    // Fallback to finding it in MOCK_CLIENTS
    return MOCK_CLIENTS.find(c => c.id === id) || null;
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
      start: new Date(e.start),
      end: new Date(e.end)
    }));

    return parsedEvents;
  } catch (error) {
    console.warn('Backend unavailable, using mock events');
    // Filter MOCK_EVENTS by date locally as fallback
    return MOCK_EVENTS.filter(e => 
      e.start >= startDate && e.end <= endDate
    );
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