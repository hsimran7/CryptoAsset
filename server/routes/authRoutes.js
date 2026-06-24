import express from 'express';
import passport from 'passport';
import {
  registerUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  resetPassword,
  googleOAuthCallback,
  getUserProfile
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../utils/validators.js';

const router = express.Router();

// Public routes (standard email auth + verification)
router.post('/register', authLimiter, validate(registerSchema), registerUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', authLimiter, validate(loginSchema), loginUser);

// Password recovery routes
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.put('/reset-password/:token', authLimiter, validate(resetPasswordSchema), resetPassword);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=GoogleAuthFailed`
  }),
  googleOAuthCallback
);

// Protected profile endpoint
router.get('/me', protect, getUserProfile);

export default router;
