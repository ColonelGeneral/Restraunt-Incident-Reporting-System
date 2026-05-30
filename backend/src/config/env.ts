import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { z } from 'zod';

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env');

if (existsSync(envPath)) {
  const fileEnvironment = dotenv.parse(readFileSync(envPath));
  for (const [key, value] of Object.entries(fileEnvironment)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().optional(),
  MONGODB_DIRECT_URI: z.string().optional(),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  ALLOW_OFFLINE_START: z.preprocess((v) => {
    if (v === undefined) return false;
    if (typeof v === 'string') return v === 'true' || v === '1';
    return Boolean(v);
  }, z.boolean()).optional(),
  DELETE_WINDOW_MINUTES: z.coerce.number().int().positive().default(60),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_API_URL: z.string().default('https://generativelanguage.googleapis.com/v1beta'),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.coerce.number().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional()
});

const parsedEnv = envSchema.parse(process.env);

if (!parsedEnv.MONGODB_URI && parsedEnv.ALLOW_OFFLINE_START === false) {
  throw new Error('MONGODB_URI is required unless ALLOW_OFFLINE_START is enabled');
}

export const env = {
  ...parsedEnv,
  ALLOW_OFFLINE_START: parsedEnv.ALLOW_OFFLINE_START ?? !parsedEnv.MONGODB_URI
};
