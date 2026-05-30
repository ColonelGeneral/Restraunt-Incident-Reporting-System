import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { authRouter } from './routes/auth.route.js';
import { aiRouter } from './routes/ai.route.js';
import { analyticsRouter } from './routes/analytics.route.js';
import { incidentRouter } from './routes/incident.route.js';
import { healthRouter } from './routes/health.route.js';
import { uploadRouter } from './routes/upload.route.js';

export const createApp = () => {
  const app = express();
  const frontendIndexPath = resolve(process.cwd(), 'frontend', 'dist', 'index.html');

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/uploads', uploadRouter);
  app.use('/api/incidents', incidentRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/analytics', analyticsRouter);

  app.use((request, response, next) => {
    if (request.method !== 'GET' || request.path.startsWith('/api')) {
      next();
      return;
    }

    if (existsSync(frontendIndexPath)) {
      response.sendFile(frontendIndexPath);
      return;
    }

    response.json({
      message: 'Restaurant Incident Reporting API is running',
      health: '/api/health',
      api: '/api',
    });
  });

  app.use((_, response) => {
    response.status(404).json({ message: 'Route not found' });
  });

  return app;
};
