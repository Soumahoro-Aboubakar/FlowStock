import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { apiLimiter } from './middleware/rate-limit.js';
import { rejectOperatorInjection, requireSameOrigin } from './middleware/security.js';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import healthRoutes from './routes/health.routes.js';
import mediaRoutes from './routes/media.routes.js';
import { UPLOAD_ROOT } from './services/image-storage.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '100kb' }));
  app.use('/api', apiLimiter, requireSameOrigin, rejectOperatorInjection);

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/employee', employeeRoutes);

  // Uploaded images (private R2 bucket or local disk), and the legacy path of older local uploads.
  // The frontend may live on another site, so its <img> tags need a cross-origin resource policy.
  const crossOriginImages = (_request, response, next) => { response.set('Cross-Origin-Resource-Policy', 'cross-origin'); next(); };
  app.use('/media', crossOriginImages, mediaRoutes);
  app.use('/uploads', crossOriginImages, express.static(UPLOAD_ROOT, {
    index: false,
    maxAge: '30d',
    immutable: true,
  }));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
