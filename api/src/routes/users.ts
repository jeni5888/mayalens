import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getAllUsers,
  getUserById,
  updateProfile,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getUserStats
} from '@/controllers/userController';
import {
  requireAdmin,
  requireAuthenticatedUser
} from '@/middleware/auth';
import { validateRequest } from '@/utils/validation';
import {
  updateProfileSchema,
  updateUserRoleSchema,
  toggleUserStatusSchema,
  paginationSchema,
  uuidSchema
} from '@/utils/validation';

const router = Router();

// Rate limiting for user management operations
const userManagementLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many user management requests, please try again later',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const adminOperationsLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 admin requests per windowMs
  message: {
    success: false,
    message: 'Too many admin operations, please try again later',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Admin routes - Get all users with filtering and pagination
router.get(
  '/',
  userManagementLimit,
  requireAdmin,
  validateRequest(paginationSchema, 'query'),
  getAllUsers
);

// Admin routes - Get user statistics
router.get(
  '/stats',
  adminOperationsLimit,
  requireAdmin,
  getUserStats
);

// Get user by ID (Admin or self)
router.get(
  '/:id',
  userManagementLimit,
  requireAuthenticatedUser,
  validateRequest(uuidSchema, 'params'),
  getUserById
);

// Update user profile (Admin or self)
router.put(
  '/:id/profile',
  userManagementLimit,
  requireAuthenticatedUser,
  validateRequest(uuidSchema, 'params'),
  validateRequest(updateProfileSchema),
  updateProfile
);

// Admin routes - Update user role
router.patch(
  '/:id/role',
  adminOperationsLimit,
  requireAdmin,
  validateRequest(uuidSchema, 'params'),
  validateRequest(updateUserRoleSchema),
  updateUserRole
);

// Admin routes - Toggle user active status
router.patch(
  '/:id/status',
  adminOperationsLimit,
  requireAdmin,
  validateRequest(uuidSchema, 'params'),
  validateRequest(toggleUserStatusSchema),
  toggleUserStatus
);

// Admin routes - Delete user
router.delete(
  '/:id',
  adminOperationsLimit,
  requireAdmin,
  validateRequest(uuidSchema, 'params'),
  deleteUser
);

export default router;