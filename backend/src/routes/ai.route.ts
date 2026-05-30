import { Router } from 'express';
import { z } from 'zod';
import { authenticateUser, authorizeRoles } from '../middleware/auth.middleware.js';
import { analyzeIncidentDescription } from '../services/gemini.service.js';

export const aiRouter = Router();

const analysisSchema = z.object({
  description: z.string().min(5)
});

aiRouter.post('/analyze', authenticateUser, authorizeRoles('employee', 'manager', 'admin'), async (request, response) => {
  const parsed = analysisSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ message: 'Description is required for AI analysis' });
  }

  const analysis = await analyzeIncidentDescription(parsed.data.description);

  return response.json(analysis);
});