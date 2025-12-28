import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../dist')));

// --- API ROUTES ---

// Get All Clients
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: { activities: true },
      orderBy: { name: 'asc' }
    });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get Single Client
app.get('/api/clients/:id', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: { 
        activities: {
          orderBy: { date: 'desc' }
        }
      }
    });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Get Latest Activities (Polling)
app.get('/api/clients/:id/activities/latest', async (req, res) => {
  try {
    // In a real app, you would pass a timestamp to get only new items
    // Here we just return the top 1 for simplicity of the "Polling" demo
    const activities = await prisma.activity.findMany({
      where: { clientId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get Events
app.get('/api/events', async (req, res) => {
  try {
    const { start, end } = req.query;
    
    const events = await prisma.event.findMany({
      where: {
        startTime: {
          gte: start ? new Date(String(start)) : undefined,
        },
        endTime: {
          lte: end ? new Date(String(end)) : undefined,
        }
      },
      include: {
        client: { select: { name: true } }
      }
    });

    // Transform for frontend
    const formatted = events.map(e => ({
      id: e.id,
      title: e.title,
      start: e.startTime,
      end: e.endTime,
      type: e.type,
      status: e.status,
      clientName: e.client?.name
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Create Event
app.post('/api/events', async (req, res) => {
  try {
    const { title, start, end, type, clientId } = req.body;
    const event = await prisma.event.create({
      data: {
        title,
        startTime: new Date(start),
        endTime: new Date(end),
        type,
        status: 'Scheduled',
        clientId: clientId || null
      }
    });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// The "Catch All" route to serve React for non-API requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});