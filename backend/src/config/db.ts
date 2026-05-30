import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  console.log("MONGODB_URI =", JSON.stringify(env.MONGODB_URI));

  await mongoose.connect(env.MONGODB_URI);

  console.log('Connected to MongoDB');
}