import { Router } from 'express';
import { login, logout, me, resendCode, signup, verifyEmail } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter, loginLimiter } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, resendCodeSchema, signupSchema, verifyEmailSchema } from '../validation/schemas.js';

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/verify-email', authLimiter, validate(verifyEmailSchema), verifyEmail);
router.post('/resend-code', authLimiter, validate(resendCodeSchema), resendCode);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
