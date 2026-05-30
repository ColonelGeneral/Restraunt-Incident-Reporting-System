import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env.js';

// Ensure SRV lookups use a reliable resolver in environments with flaky DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // ignore if environment doesn't allow changing DNS
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectDatabase() {
  const primary = env.MONGODB_URI;
  const fallback = env.MONGODB_DIRECT_URI ?? process.env.MONGODB_DIRECT_URI;
  const maxAttempts = 4;
  let lastError: unknown = null;

  console.log('MONGODB_URI =', JSON.stringify(primary));

  if (!primary) {
    throw new Error('MONGODB_URI is not configured');
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Attempting MongoDB connection (attempt ${attempt}/${maxAttempts}) using primary URI`);
      await mongoose.connect(primary, { serverSelectionTimeoutMS: 5000 });
      console.log('Connected to MongoDB (primary)');
      console.log('Mongo Ready State:', mongoose.connection.readyState);
      return;
    } catch (err) {
      lastError = err;
      console.warn(`Primary MongoDB connect attempt ${attempt} failed:`, (err as Error).message || err);
      if (attempt < maxAttempts) {
        await sleep(1000 * attempt);
      }
    }
  }

  if (fallback) {
    try {
      console.log('Attempting MongoDB connection using fallback DIRECT URI');
      await mongoose.connect(fallback, { serverSelectionTimeoutMS: 5000 });
      console.log('Connected to MongoDB (fallback direct)');
      console.log('Mongo Ready State:', mongoose.connection.readyState);
      return;
    } catch (err) {
      lastError = err;
      console.warn('Fallback MongoDB direct connect failed:', (err as Error).message || err);
    }
  }

  // No successful connection
  throw lastError;
}