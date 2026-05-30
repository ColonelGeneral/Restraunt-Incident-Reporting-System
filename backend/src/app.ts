import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { authRouter } from './routes/auth.route';
import { healthRouter } from './routes/health.route';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);

  app.use((_, response) => {
    response.status(404).json({ message: 'Route not found' });
  });

  return app;
};
