import { Request, Response, NextFunction } from 'express';

// Request logging middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log request details in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📥 ${timestamp} - ${req.method} ${req.originalUrl}`);
    
    if (req.body && Object.keys(req.body).length > 0) {
      // Don't log sensitive information
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
      if (sanitizedBody.passwordHash) sanitizedBody.passwordHash = '[REDACTED]';
      if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
      
      console.log('📋 Request Body:', JSON.stringify(sanitizedBody, null, 2));
    }
    
    if (req.query && Object.keys(req.query).length > 0) {
      console.log('🔍 Query Params:', req.query);
    }
  }

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - startTime;
    
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 ${res.statusCode} - ${req.method} ${req.originalUrl} - ${duration}ms`);
      
      // Log response body for errors or in verbose mode
      if (res.statusCode >= 400 || process.env.VERBOSE_LOGGING === 'true') {
        const sanitizedResponse = typeof body === 'object' ? { ...body } : body;
        if (sanitizedResponse && typeof sanitizedResponse === 'object') {
          if (sanitizedResponse.tokens) sanitizedResponse.tokens = '[REDACTED]';
          if (sanitizedResponse.token) sanitizedResponse.token = '[REDACTED]';
        }
        console.log('📋 Response Body:', JSON.stringify(sanitizedResponse, null, 2));
      }
    }
    
    // Log performance metrics for slow requests
    if (duration > 1000) {
      console.warn(`⚠️  Slow request detected: ${req.method} ${req.originalUrl} - ${duration}ms`);
    }
    
    // Log errors in production
    if (process.env.NODE_ENV === 'production' && res.statusCode >= 500) {
      console.error(`🚨 Server Error: ${res.statusCode} - ${req.method} ${req.originalUrl} - ${duration}ms`);
    }
    
    return originalJson.call(this, body);
  };

  next();
};

// Request ID middleware for tracing
export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

// API version middleware
export const apiVersionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.setHeader('X-API-Version', '1.0.0');
  next();
};

// Security headers middleware
export const securityHeadersMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};