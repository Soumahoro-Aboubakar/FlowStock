import mongoose from 'mongoose';

// One document per (hashed) email, whether or not an account exists, so the lockout
// behaves identically for unknown emails and does not reveal which accounts exist.
const loginThrottleSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  failures: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  // TTL index: stale counters disappear on their own.
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export const LoginThrottle = mongoose.model('LoginThrottle', loginThrottleSchema);
