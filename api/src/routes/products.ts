import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats
} from '@/controllers/productController';
import {
  requireAuthenticatedUser
} from '@/middleware/auth';
import { validateRequest } from '@/utils/validation';
import {
  createProductSchema,
  updateProductSchema,
  paginationSchema,
  uuidSchema
} from '@/utils/validation';

const router = Router();

// Rate limiting for product operations
const productOperationsLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many product requests, please try again later',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const productCreationLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 product creations per hour
  message: {
    success: false,
    message: 'Too many product creation requests, please try again later',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Get all products with filtering and pagination
router.get(
  '/',
  productOperationsLimit,
  requireAuthenticatedUser,
  validateRequest(paginationSchema, 'query'),
  getAllProducts
);

// Get product statistics
router.get(
  '/stats',
  productOperationsLimit,
  requireAuthenticatedUser,
  getProductStats
);

// Get product by ID
router.get(
  '/:id',
  productOperationsLimit,
  requireAuthenticatedUser,
  validateRequest(uuidSchema, 'params'),
  getProductById
);

// Create new product
router.post(
  '/',
  productCreationLimit,
  requireAuthenticatedUser,
  validateRequest(createProductSchema),
  createProduct
);

// Update product
router.put(
  '/:id',
  productOperationsLimit,
  requireAuthenticatedUser,
  validateRequest(uuidSchema, 'params'),
  validateRequest(updateProductSchema),
  updateProduct
);

// Delete product
router.delete(
  '/:id',
  productOperationsLimit,
  requireAuthenticatedUser,
  validateRequest(uuidSchema, 'params'),
  deleteProduct
);

export default router;