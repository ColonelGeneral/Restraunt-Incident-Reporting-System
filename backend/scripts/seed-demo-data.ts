import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDatabase } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { Incident } from '../src/models/incident.model.js';
import { User } from '../src/models/user.model.js';

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

const demoIncidents = [
  {
    title: 'Spilled oil near fryer line',
    description: 'Employee reported a slick oil spill near the fryer line during the lunch rush. The area was temporarily blocked off and cleaned immediately.',
    category: 'Safety',
    severity: 'High' as const,
    status: 'Open' as const,
    storeLocation: 'Downtown Branch',
    createdByEmail: 'employee.demo@restaurant.local',
    aiSummary: 'Wet floor and oil spill near fryer line requiring immediate cleanup and signage.',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
  },
  {
    title: 'Inventory mismatch at closing',
    description: 'Closing manager noticed a variance between counted stock and POS records for the beverage cabinet. Investigation is pending.',
    category: 'Inventory',
    severity: 'Medium' as const,
    status: 'In Progress' as const,
    storeLocation: 'Downtown Branch',
    createdByEmail: 'manager.demo@restaurant.local',
    aiSummary: 'Closing inventory variance detected between counted stock and sales records.',
    imageUrl: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80'
  },
  {
    title: 'POS terminal downtime',
    description: 'Admin logged a brief POS outage affecting two tills at head office support. Terminal reboot and payment verification were completed.',
    category: 'Systems',
    severity: 'Critical' as const,
    status: 'Resolved' as const,
    storeLocation: 'Head Office',
    createdByEmail: 'admin.demo@restaurant.local',
    aiSummary: 'Point of sale terminals experienced a short outage and were rebooted successfully.',
    imageUrl: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80'
  },
  {
    title: 'Cold storage temperature alert',
    description: 'A temperature check in the cold room exceeded the safe range. The unit was reset and food was moved to backup storage.',
    category: 'Food Safety',
    severity: 'High' as const,
    status: 'Open' as const,
    storeLocation: 'Airport Branch',
    createdByEmail: 'employee.demo@restaurant.local',
    aiSummary: 'Cold storage temperature exceeded safe threshold and backup storage was used.',
    imageUrl: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=900&q=80'
  },
  {
    title: 'Guest complaint about delayed service',
    description: 'Manager escalated a guest complaint about delayed table service during peak hours. Staffing review scheduled for the shift lead.',
    category: 'Customer Experience',
    severity: 'Medium' as const,
    status: 'Resolved' as const,
    storeLocation: 'Riverside Branch',
    createdByEmail: 'manager.demo@restaurant.local',
    aiSummary: 'Service delay complaint during a busy period with follow-up staffing review.',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80'
  },
  {
    title: 'Delivery dock access issue',
    description: 'Admin noted a temporary access issue at the delivery dock caused by a blocked loading path. The obstacle was removed and operations resumed.',
    category: 'Operations',
    severity: 'Low' as const,
    status: 'In Progress' as const,
    storeLocation: 'Head Office',
    createdByEmail: 'admin.demo@restaurant.local',
    aiSummary: 'Delivery dock access was blocked briefly and resolved by clearing the loading path.',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80'
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

  const usersByEmail = new Map(
    (await User.find({ email: { $in: demoUsers.map((demoUser) => demoUser.email) } })).map((user) => [user.email, user])
  );

  for (const incident of demoIncidents) {
    const creator = usersByEmail.get(incident.createdByEmail);
    if (!creator) {
      continue;
    }

    await Incident.updateOne(
      { title: incident.title, storeLocation: incident.storeLocation },
      {
        $setOnInsert: {
          title: incident.title,
          description: incident.description,
          category: incident.category,
          severity: incident.severity,
          status: incident.status,
          storeLocation: incident.storeLocation,
          imageUrl: incident.imageUrl,
          aiSummary: incident.aiSummary,
          createdBy: creator._id,
          assignedTo: null,
          deletedAt: null,
          deleteLockedAt: null
        }
      },
      { upsert: true }
    );
  }

  console.log('Demo accounts seeded:');
  console.log('employee.demo@restaurant.local / Demo@1234!');
  console.log('manager.demo@restaurant.local / Demo@1234!');
  console.log('admin.demo@restaurant.local / Demo@1234!');
  console.log('Sample incidents seeded:');
  for (const incident of demoIncidents) {
    console.log(`- ${incident.title} (${incident.storeLocation})`);
  }
}

void seedDemoUsers();
