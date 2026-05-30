import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/user.model.js';
import { authenticateUser, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { env } from '../config/env.js';
import { signAuthToken } from '../utils/jwt.js';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().refine((v) => v.toLowerCase().endsWith('@restaurant.local'), {
    message: 'Only emails at the restaurant.local domain are allowed'
  }),
  password: z.string().min(8),
  storeLocation: z.string().min(1)
});

const loginSchema = z.object({
  email: z.string().email().refine((v) => v.toLowerCase().endsWith('@restaurant.local'), {
    message: 'Only emails at the restaurant.local domain are allowed'
  }),
  password: z.string().min(8)
});

authRouter.post('/register', async (request, response) => {
  const parsed = registerSchema.safeParse(request.body);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid signup payload';
    return response.status(400).json({ message: firstError });
  }

  const email = parsed.data.email.toLowerCase();
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return response.status(409).json({ message: 'An account with that email already exists' });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await User.create({
    name: parsed.data.name,
    email,
    password: passwordHash,
    role: 'employee',
    storeLocation: parsed.data.storeLocation
  });

  return response.status(201).json({ message: 'Account created successfully' });
});

authRouter.post('/login', async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ message: 'Invalid login payload' });
  }

  // Development fallback: when ALLOW_OFFLINE_START is true and DB is unavailable,
  // allow demo credentials to authenticate without hitting the database.
  if (env.ALLOW_OFFLINE_START) {
    const demoAccounts: Record<string, { name: string; role: 'employee' | 'manager' | 'admin'; storeLocation: string }> = {
      'employee.demo@restaurant.local': { name: 'Demo Employee', role: 'employee', storeLocation: 'Downtown Branch' },
      'manager.demo@restaurant.local': { name: 'Demo Manager', role: 'manager', storeLocation: 'Downtown Branch' },
      'admin.demo@restaurant.local': { name: 'Demo Admin', role: 'admin', storeLocation: 'Head Office' }
    };

    const demo = demoAccounts[parsed.data.email.toLowerCase()];
    if (demo && parsed.data.password === 'Demo@1234!') {
      const token = signAuthToken({ userId: 'dev-' + demo.role, email: parsed.data.email.toLowerCase(), name: demo.name, role: demo.role });

      return response.json({
        token,
        user: { id: 'dev-' + demo.role, name: demo.name, email: parsed.data.email.toLowerCase(), role: demo.role, storeLocation: demo.storeLocation }
      });
    }
    // fallthrough to DB path if not demo credentials
  }

  const user = await User.findOne({ email: parsed.data.email.toLowerCase() });

  if (!user) {
    return response.status(401).json({ message: 'Invalid email or password' });
  }

  const passwordMatches = await bcrypt.compare(parsed.data.password, user.password);

  if (!passwordMatches) {
    return response.status(401).json({ message: 'Invalid email or password' });
  }

  const token = signAuthToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });

  return response.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      storeLocation: user.storeLocation
    }
  });
});

authRouter.get('/me', authenticateUser, async (request: AuthenticatedRequest, response) => {
  const userId = request.user?.userId;

  if (!userId) {
    return response.status(401).json({ message: 'Not authenticated' });
  }

  const user = await User.findById(userId).select('-password');

  if (!user) {
    return response.status(404).json({ message: 'User not found' });
  }

  return response.json({ user });
});
