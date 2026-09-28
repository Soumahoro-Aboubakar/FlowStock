import { createHash } from 'node:crypto';
import { env } from '../config/env.js';
import { LoginThrottle } from '../models/LoginThrottle.js';

const keyFor = (email) => createHash('sha256').update(`login:${email}`).digest('hex');
const lockMs = () => env.login.lockHours * 3600000;

export function lockInfo(lockedUntil) {
  const retryInMs = Math.max(0, lockedUntil.getTime() - Date.now());
  return { retryAt: lockedUntil.getTime(), retryInHours: Math.max(1, Math.ceil(retryInMs / 3600000)), retryInMinutes: Math.ceil(retryInMs / 60000) };
}

// Returns the active lock for this email, clearing an expired one.
export async function activeLock(email) {
  const key = keyFor(email);
  const entry = await LoginThrottle.findOne({ key });
  if (!entry || !entry.lockedUntil) return null;
  if (entry.lockedUntil > new Date()) return entry.lockedUntil;
  await LoginThrottle.deleteOne({ _id: entry._id });
  return null;
}

export async function recordFailure(email) {
  const now = Date.now();
  const entry = await LoginThrottle.findOneAndUpdate(
    { key: keyFor(email) },
    { $inc: { failures: 1 }, $set: { expiresAt: new Date(now + lockMs()) } },
    { upsert: true, new: true },
  );
  const remaining = Math.max(0, env.login.maxAttempts - entry.failures);
  if (remaining > 0) return { remaining, lockedUntil: null };
  const lockedUntil = new Date(now + lockMs());
  await LoginThrottle.updateOne({ _id: entry._id }, { $set: { lockedUntil, expiresAt: lockedUntil } });
  return { remaining: 0, lockedUntil };
}

export async function clearFailures(email) {
  await LoginThrottle.deleteOne({ key: keyFor(email) });
}
