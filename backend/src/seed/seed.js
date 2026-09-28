// Imports the demo dataset into MongoDB.
//   npm run seed            → only when the database is empty
//   npm run seed -- --reset → wipes users, materials and requests first
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { assertEnv, env } from '../config/env.js';
import { connectDatabase } from '../config/database.js';
import { LoginThrottle } from '../models/LoginThrottle.js';
import { Material } from '../models/Material.js';
import { Request, ensureRequestCounter } from '../models/Request.js';
import { User } from '../models/User.js';

const load = async (name) => JSON.parse(await readFile(new URL(`./${name}.json`, import.meta.url), 'utf8'));

async function main() {
  assertEnv();
  await connectDatabase(env.mongodbUri);

  const reset = process.argv.includes('--reset');
  const existing = await User.estimatedDocumentCount() + await Material.estimatedDocumentCount();
  if (existing && !reset) {
    console.info('The database already contains data. Run "npm run seed -- --reset" to replace it.');
    return;
  }
  if (reset) await Promise.all([User.deleteMany({}), Material.deleteMany({}), Request.deleteMany({}), LoginThrottle.deleteMany({}), mongoose.connection.collection('counters').deleteMany({})]);

  const [users, materials, requests] = await Promise.all([load('users'), load('materials'), load('requests')]);
  const password = process.env.SEED_DEMO_PASSWORD || `Demo-${randomBytes(4).toString('hex')}1`;
  const passwordHash = await bcrypt.hash(password, 12);

  // Spread the demo timeline over the last two weeks (newest request an hour ago),
  // keeping each request's internal offsets (history, updates, needed date).
  const ordered = [...requests].sort((a, b) => Number(b.id.split('-')[1]) - Number(a.id.split('-')[1]));
  const startOf = Object.fromEntries(ordered.map((request, index) => [request.id, Date.now() - 3600000 - index * 20 * 3600000]));

  const MONTHS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
  const joinedAt = (label) => {
    const [month, year] = label.toLowerCase().split(/\s+/);
    const index = MONTHS.findIndex((prefix) => month.startsWith(prefix));
    return index >= 0 && Number(year) ? new Date(Number(year), index, 1) : new Date();
  };

  const userIds = {};
  for (const user of users) {
    const created = await User.create({
      name: user.name,
      email: user.email,
      passwordHash,
      role: /admin/i.test(user.role) ? 'admin' : 'employee',
      team: user.team,
      status: 'active',
      emailVerifiedAt: new Date(),
      createdAt: joinedAt(user.joined),
    });
    userIds[user.id] = created._id;
  }

  const materialIds = {};
  for (const material of materials) {
    const created = await Material.create({
      name: material.name,
      category: material.category,
      description: material.description,
      quantity: material.quantity,
      total: material.total,
      image: material.image,
    });
    materialIds[material.id] = created._id;
  }

  for (const request of requests) {
    const at = (timestamp) => new Date(startOf[request.id] + (timestamp - request.createdAt));
    await Request.create({
      code: request.id,
      user: userIds[request.userId],
      material: materialIds[request.materialId],
      quantity: request.quantity,
      dateNeeded: at(request.dateNeeded),
      status: request.status,
      justification: request.justification,
      note: request.note,
      rejectionReason: request.rejectionReason,
      history: request.history.map((entry) => ({ ...entry, at: at(entry.at) })),
      createdAt: at(request.createdAt),
      updatedAt: at(request.updatedAt),
    });
  }
  await ensureRequestCounter(Math.max(...requests.map((request) => Number(request.id.split('-')[1]))));

  console.info(`Seeded ${users.length} users, ${materials.length} materials and ${requests.length} requests.`);
  console.info(`Demo accounts (e.g. ${users[0].email}) use the password: ${password}`);
}

try {
  await main();
} catch (error) {
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
