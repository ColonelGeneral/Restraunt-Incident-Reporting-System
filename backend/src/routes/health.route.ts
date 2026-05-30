import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_, response) => {
  response.json({ status: 'ok', service: 'restaurant-incident-backend' });
});
