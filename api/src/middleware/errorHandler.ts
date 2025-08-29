import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/types';

// Global error handler middleware
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;

  // Handle operational errors (AppError)
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = error.isOperational;
  }
  // Handle Prisma errors
  else if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        message = 'A record with this information already exists';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Invalid reference to related record';
        break;
      default:
        statusCode = 400;
        message = 'Database operation failed';
    }
    isOperational = true;
  }
  // Handle Prisma validation errors
  else if (error.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided';
    isOperational = true;
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    isOperational = true;
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    isOperational = true;
  }
  // Handle validation errors (Joi)
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
    isOperational = true;
  }
  // Handle multer errors
  else if (error.name === 'MulterError') {
    const multerError = error as any;
    switch (multerError.code) {
      case 'LIMIT_FILE_SIZE':
        statusCode = 413;
        message = 'File too large';
        break;
      case 'LIMIT_FILE_COUNT':
        statusCode = 400;
        message = 'Too many files';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        statusCode = 400;
        message = 'Unexpected file field';
        break;
      default:
        statusCode = 400;
        message = 'File upload error';
    }
    isOperational = true;
  }

  // Log error details
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Error Details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode,
      isOperational,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  } else {
    // In production, log only essential information
    console.error('🚨 Production Error:', {
      message: error.message,
      statusCode,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: {
        name: error.name,
        isOperational,
      },
    }),
  });
};

// 404 Not Found handler
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    404
  );
  next(error);
};

// Async error wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation error formatter
export const formatValidationError = (error: any): string => {
  if (error.details && Array.isArray(error.details)) {
    return error.details.map((detail: any) => detail.message).join(', ');
  }
  return error.message || 'Validation failed';
};