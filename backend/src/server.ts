import dns from 'dns';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { createApp } from './app.js';

const port = env.PORT;
const app = createApp();

async function startServer() {
  try {
    // Ensure frontend build exists; if missing, try to build it at startup.
    const frontendIndex = resolve(process.cwd(), 'frontend', 'dist', 'index.html');
    if (!existsSync(frontendIndex)) {
      console.warn('frontend/dist not found — attempting runtime build of frontend');
      try {
        // Avoid using workspace flags at runtime since some environments have older npm.
        // Build frontend by running install + build inside the frontend folder.
        execSync('cd frontend && npm ci && npm run build', { stdio: 'inherit', cwd: process.cwd(), env: process.env });
        console.log('Runtime frontend build completed');
      } catch (err) {
        console.error('Runtime frontend build failed:', err);
      }
    }

    await connectDatabase();
    console.log('Mongo Ready State:', mongoose.connection.readyState);

    app.listen(port, () => {
      console.log(`Backend listening on port ${port}`);
    });
  } catch (error) {
    if (env.ALLOW_OFFLINE_START) {
      console.warn('MongoDB connection failed but ALLOW_OFFLINE_START=true — starting API without DB. Error:', error);
      app.listen(port, () => {
        console.log(`Backend listening on port ${port} (DB offline)`);
      });
    } else {
      console.error('Failed to connect to MongoDB — aborting startup.', error);
      process.exit(1);
    }
  }
}

void startServer();
