import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDatabase } from '../src/config/db';
import { env } from '../src/config/env';
import { User } from '../src/models/user.model';

const demoUsers = [
  {
    name: 'Demo Employee',
    email: 'employee.demo@restaurant.local',
    role: 'employee' as const,
    storeLocation: 'Downtown Branch'
  },
  {
    name: 'Demo Manager',
    email: 'manager.demo@restaurant.local',
    role: 'manager' as const,
    storeLocation: 'Downtown Branch'
  },
  {
    name: 'Demo Admin',
    email: 'admin.demo@restaurant.local',
    role: 'admin' as const,
    storeLocation: 'Head Office'
  }
];

async function seedDemoUsers() {
  await connectDatabase(env.MONGODB_URI);

  const passwordHash = await bcrypt.hash('Demo@1234!', 12);

  for (const demoUser of demoUsers) {
    await User.updateOne(
      { email: demoUser.email },
      {
        $setOnInsert: {
          ...demoUser,
          password: passwordHash
        }
      },
      { upsert: true }
    );
  }

  console.log('Demo accounts seeded:');
  console.log('employee.demo@restaurant.local / Demo@1234!');
  console.log('manager.demo@restaurant.local / Demo@1234!');
  console.log('admin.demo@restaurant.local / Demo@1234!');
}

void seedDemoUsers();
