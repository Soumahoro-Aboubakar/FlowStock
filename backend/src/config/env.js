import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });

const list = (value) => (value || '').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
const int = (value, fallback) => (Number.isFinite(Number.parseInt(value, 10)) ? Number.parseInt(value, 10) : fallback);

const isProduction = process.env.NODE_ENV === 'production';

export const env = {
  isProduction,
  port: int(process.env.PORT, 5000),
  mongodbUri: process.env.MONGODB_URI,
  // Compared verbatim with the Origin header, so a trailing slash from the dashboard would reject every request.
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').trim().replace(/\/+$/, ''),
  jwtSecret: process.env.JWT_SECRET,
  sessionTtlDays: int(process.env.SESSION_TTL_DAYS, 7),
  adminEmails: list(process.env.ADMIN_EMAILS),
  login: {
    maxAttempts: int(process.env.LOGIN_MAX_ATTEMPTS, 5),
    lockHours: int(process.env.LOGIN_LOCK_HOURS, 2),
  },
  verification: {
    codeTtlMinutes: 15,
    maxAttempts: 5,
    resendCooldownSeconds: 60,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: int(process.env.SMTP_PORT, 465),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET,
    publicUrl: (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, ''),
    // Lets the S3 client target a local S3-compatible server (e.g. MinIO) during tests.
    endpoint: process.env.R2_ENDPOINT,
  },
};

export const smtpConfigured = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
export const r2Configured = Boolean(env.r2.accessKeyId && env.r2.secretAccessKey && env.r2.bucket && (env.r2.accountId || env.r2.endpoint));

// "<account>.r2.cloudflarestorage.com" is the private S3 API endpoint: it rejects unsigned requests,
// so browsers cannot load images from it. Only an r2.dev URL or a custom domain is a usable public base.
function publicBase(url) {
  if (!url) return null;
  try {
    const { protocol, hostname } = new URL(url);
    if (!/^https?:$/.test(protocol) || hostname.endsWith('.r2.cloudflarestorage.com')) return null;
    return url;
  } catch {
    return null;
  }
}

export const r2PublicBase = r2Configured ? publicBase(env.r2.publicUrl) : null;
export const r2PublicUrlRejected = Boolean(r2Configured && env.r2.publicUrl && !r2PublicBase);

export function assertEnv() {
  if (!env.mongodbUri) throw new Error('MONGODB_URI is required.');
  if (!env.jwtSecret || env.jwtSecret.length < 32) throw new Error('JWT_SECRET must be set to a random string of at least 32 characters.');
  if (isProduction && !smtpConfigured) throw new Error('SMTP settings are required in production.');
  if (isProduction && !r2Configured) throw new Error('Cloudflare R2 settings are required in production.');
}
