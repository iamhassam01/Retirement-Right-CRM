import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

// Import Routes
import webhookRoutes from './routes/webhooks.routes';
import clientRoutes from './routes/clients.routes';
import eventRoutes from './routes/events.routes';
import dashboardRoutes from './routes/dashboard.routes';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/tasks.routes';
import activityRoutes from './routes/activities.routes';
import documentRoutes from './routes/documents.routes';
import reportsRoutes from './routes/reports.routes';
import templatesRoutes from './routes/templates.routes';
import workshopsRoutes from './routes/workshops.routes';
import teamRoutes from './routes/team.routes';
import settingsRoutes from './routes/settings.routes';

// Import Middleware
import { authenticateToken } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Security & Logging - CSP configured for HTTP (no upgrade-insecure-requests)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://esm.sh", "https://*.esm.sh"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "https:", "http:", "https://esm.sh", "https://*.esm.sh"],
      workerSrc: ["'self'", "blob:"],
      // DO NOT include upgrade-insecure-requests since we're running HTTP
      upgradeInsecureRequests: null,
    },
  },
  // Disable HSTS for HTTP
  hsts: false,
  // Disable cross-origin policies that cause issues
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  originAgentCluster: false,
}));
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../dist')));

// --- API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/clients', authenticateToken, clientRoutes);
app.use('/api/events', authenticateToken, eventRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/activities', authenticateToken, activityRoutes);
app.use('/api/documents', authenticateToken, documentRoutes);
app.use('/api/reports', authenticateToken, reportsRoutes);
app.use('/api/templates', authenticateToken, templatesRoutes);
app.use('/api/workshops', authenticateToken, workshopsRoutes);
app.use('/api/team', authenticateToken, teamRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// The "Catch All" route to serve React for non-API requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error Handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});