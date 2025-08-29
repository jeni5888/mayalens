import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  uploadProductImage,
  getProductImages,
  deleteProductImage,
  generateImage,
  getImageGeneration,
  getUserImageGenerations
} from '@/controllers/imageController';
import {
  requireAuthenticatedUser
} from '@/middleware/auth';
import { uploadSingle, handleMulterError } from '@/middleware/upload';
import { validateRequest } from '@/utils/validation';
import {
  generateImageSchema,
  paginationSchema,
  uuidSchema
} from '@/utils/validation';

const router = Router();

// Rate limiting for image operations
const imageOperationsLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    success: false,
    message: 'Too many image requests, please try again later',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const imageUploadLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per hour
  message: {
    success: false,
    message: 'Too many image upload requests, please try again later',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const imageGenerationLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 generations per hour
  message: {
    success: false,
    message: 'Too many image generation requests, please try again later',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Product image routes

// Upload product image
router.post(
  '/products/:productId/upload',
  imageUploadLimit,
  requireAuthenticatedUser,
  validateRequest(uuidSchema, 'params'),
  uploadSingle('image'),
  handleMulterError,
  uploadProductImage
);

// Get product images
router.get(
  '/products/:productId',
  imageOperationsLimit,
  requireAuthenticatedUser,
  validateRequest(uuidSchema, 'params'),
  getProductImages
);

// Delete product image
router.delete(
  '/products/:productId/:imageId',
  imageOperationsLimit,
  requireAuthenticatedUser,
  validateRequest(uuidSchema, 'params'),
  deleteProductImage
);

// AI Image generation routes

// Generate AI image
router.post(
  '/generate',
  imageGenerationLimit,
  requireAuthenticatedUser,
  validateRequest(generateImageSchema),
  generateImage
);

// Get image generation status
router.get(
  '/generations/:id',
  imageOperationsLimit,
  requireAuthenticatedUser,
  validateRequest(uuidSchema, 'params'),
  getImageGeneration
);

// Get user's image generations with pagination
router.get(
  '/generations',
  imageOperationsLimit,
  requireAuthenticatedUser,
  validateRequest(paginationSchema, 'query'),
  getUserImageGenerations
);

export default router;