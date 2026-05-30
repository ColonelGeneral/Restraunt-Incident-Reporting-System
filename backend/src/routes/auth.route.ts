import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/user.model';
import { authenticateUser, type AuthenticatedRequest } from '../middleware/auth.middleware';
import { signAuthToken } from '../utils/jwt';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  storeLocation: z.string().min(1)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

authRouter.post('/register', async (request, response) => {
  const parsed = registerSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ message: 'Invalid registration payload' });
  }

  const existingUser = await User.findOne({ email: parsed.data.email.toLowerCase() });

  if (existingUser) {
    return response.status(409).json({ message: 'Email already exists' });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await User.create({
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    password: passwordHash,
    role: 'employee',
    storeLocation: parsed.data.storeLocation
  });

  const token = signAuthToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });

  return response.status(201).json({
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

authRouter.post('/login', async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ message: 'Invalid login payload' });
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
