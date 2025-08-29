import jwt from 'jsonwebtoken';
import { JwtPayload, TokenPair } from '@/types';
import { User } from '@prisma/client';

// JWT configuration
const JWT_SECRET = process.env['JWT_SECRET']!;
const JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET']!;
const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env['JWT_REFRESH_EXPIRES_IN'] || '7d';

// Generate access token
export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'mayalens-api',
    audience: 'mayalens-client'
  } as jwt.SignOptions);
};

// Generate refresh token
export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'mayalens-api',
    audience: 'mayalens-client'
  } as jwt.SignOptions);
};

// Generate token pair
export const generateTokenPair = (user: User): TokenPair => {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

// Verify access token
export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'mayalens-api',
      audience: 'mayalens-client',
    }) as JwtPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'mayalens-api',
      audience: 'mayalens-client',
    }) as JwtPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    } else {
      throw new Error('Refresh token verification failed');
    }
  }
}

// Decode token without verification (for debugging)
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (error) {
    return null;
  }
}

// Extract token from Authorization header
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    return null;
  }

  return parts[1] || null;
};

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}

// Get token expiration time
export function getTokenExpirationTime(token: string): Date | null {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
}

// Validate JWT configuration
export function validateJwtConfig(): void {
  if (!JWT_SECRET || JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
    console.warn('⚠️  Warning: Using default JWT_SECRET. Please set a secure JWT_SECRET in production!');
  }

  if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET === 'your-super-secret-refresh-key-change-in-production') {
    console.warn('⚠️  Warning: Using default JWT_REFRESH_SECRET. Please set a secure JWT_REFRESH_SECRET in production!');
  }

  if (JWT_SECRET === JWT_REFRESH_SECRET) {
    console.warn('⚠️  Warning: JWT_SECRET and JWT_REFRESH_SECRET should be different!');
  }
}

// Initialize JWT configuration validation
if (process.env['NODE_ENV'] === 'production') {
  validateJwtConfig();
}