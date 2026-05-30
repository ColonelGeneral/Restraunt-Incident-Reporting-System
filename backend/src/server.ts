import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { createApp } from './app.js';

const port = env.PORT;
const app = createApp();

async function startServer() {
  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });

  try {
    await connectDatabase();
  } catch (error) {
    console.warn('MongoDB connection failed. The API is still running for health checks.', error);
  }
}

void startServer();
