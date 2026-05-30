import 'dotenv/config';
import { connectDatabase } from './config/db';
import { env } from './config/env';
import { createApp } from './app';

const port = env.PORT;
const app = createApp();

async function startServer() {
  await connectDatabase();

  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

void startServer();
