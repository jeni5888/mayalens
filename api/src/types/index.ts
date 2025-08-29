import { Request } from 'express';
import { User } from '@prisma/client';

// Extended Express Request with authenticated user
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication types
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
  teamName?: string;
}

export interface AuthResponse {
  success: boolean;
  user: Omit<User, 'password'>;
  tokens: TokenPair;
}

// Product types
export interface CreateProductRequest {
  name: string;
  description?: string;
  category: string;
  tags?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

// Image Generation types
export interface GenerateImageRequest {
  productId: string;
  style: 'PROFESSIONAL_STUDIO' | 'LIFESTYLE_SCENE' | 'MINIMALIST_CLEAN' | 'LUXURY_PREMIUM' | 'OUTDOOR_NATURAL' | 'CUSTOM';
  format: 'SQUARE_1_1' | 'STORY_9_16' | 'LANDSCAPE_16_9' | 'PORTRAIT_4_5' | 'ORIGINAL';
  prompt?: string;
}

export interface GenerateImageResponse {
  generation: {
    id: string;
    status: string;
    estimatedTime?: number;
  };
}

// File upload types
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

// Error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error type
export interface ValidationError {
  field: string;
  message: string;
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Database connection status
export interface DatabaseStatus {
  connected: boolean;
  latency?: number;
  error?: string;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  database: DatabaseStatus;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}