import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  verifyEmail,
  resendVerification,
  changePassword
} from '@/controllers/authController';
import { authenticate } from '@/middleware/auth';
import { validateRequest } from '@/utils/validation';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  changePasswordSchema
} from '@/utils/validation';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { email, password, firstName, lastName, role?, teamName? }
 */
router.post(
  '/register',
  authLimiter,
  validateRequest(registerSchema, 'body'),
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @body    { email, password, rememberMe? }
 */
router.post(
  '/login',
  authLimiter,
  validateRequest(loginSchema, 'body'),
  login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 * @body    { refreshToken }
 */
router.post(
  '/refresh',
  generalLimiter,
  validateRequest(refreshTokenSchema, 'body'),
  refreshToken
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user email
 * @access  Public
 * @body    { token }
 */
router.post(
  '/verify-email',
  generalLimiter,
  validateRequest(verifyEmailSchema, 'body'),
  verifyEmail
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 * @body    { email }
 */
router.post(
  '/resend-verification',
  authLimiter,
  validateRequest(forgotPasswordSchema, 'body'), // Reuse email schema
  resendVerification
);

// Protected routes (require authentication)

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  logout
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/profile',
  authenticate,
  getProfile
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 * @body    { currentPassword, newPassword }
 */
router.post(
  '/change-password',
  authenticate,
  validateRequest(changePasswordSchema, 'body'),
  changePassword
);

// Health check for auth service
/**
 * @route   GET /api/auth/health
 * @desc    Auth service health check
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString(),
    service: 'authentication'
  });
});

export default router;