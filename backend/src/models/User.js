import mongoose from 'mongoose';

export const ROLES = ['admin', 'employee'];

const verificationSchema = new mongoose.Schema({
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  sentAt: { type: Date, required: true },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, select: false },
  role: { type: String, enum: ROLES, default: 'employee' },
  team: { type: String, trim: true, maxlength: 60, default: '' },
  status: { type: String, enum: ['invited', 'pending', 'active'], default: 'pending' },
  emailVerifiedAt: { type: Date, default: null },
  verification: { type: verificationSchema, default: null, select: false },
  // Incremented to revoke every session of the user (e.g. after a role change).
  tokenVersion: { type: Number, default: 0 },
  lastLoginAt: { type: Date, default: null },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
