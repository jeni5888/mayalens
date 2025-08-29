import multer from 'multer';
import { Request } from 'express';
import { UploadedFile } from '@/types';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    // Allowed image types
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'));
    }
  } else {
    cb(new Error('Only image files are allowed.'));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Single file upload
  }
});

// Multiple files upload configuration
const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5 // Maximum 5 files
  }
});

// Error handler for multer errors
export const handleMulterError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 10MB.',
          error: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum is 5 files.',
          error: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field.',
          error: 'UNEXPECTED_FILE'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error.',
          error: 'UPLOAD_ERROR'
        });
    }
  }

  if (error.message) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'INVALID_FILE'
    });
  }

  next(error);
};

// Single file upload middleware
export const uploadSingle = (fieldName: string = 'image') => {
  return upload.single(fieldName);
};

// Multiple files upload middleware
export const uploadMultipleFiles = (fieldName: string = 'images', maxCount: number = 5) => {
  return uploadMultiple.array(fieldName, maxCount);
};

// Fields upload middleware for different field names
export const uploadFields = (fields: { name: string; maxCount: number }[]) => {
  return uploadMultiple.fields(fields);
};

export default upload;