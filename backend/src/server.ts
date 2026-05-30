import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from 'mongoose';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { createApp } from './app.js';

const port = env.PORT;
const app = createApp();

async function startServer() {
  try {
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
