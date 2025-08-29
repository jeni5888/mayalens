import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, JwtPayload } from '@/types';
import { verifyAccessToken, extractTokenFromHeader } from '@/utils/jwt';
import { prisma } from '@/utils/database';
import { UserRole } from '@prisma/client';

// Authentication middleware
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
        error: 'MISSING_TOKEN'
      });
      return;
    }

    // Verify the token
    let decoded: JwtPayload;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Invalid token',
        error: 'INVALID_TOKEN'
      });
      return;
    }

    // Fetch user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        team: {
          select: {
            id: true,
            name: true,
            plan: true,
            isActive: true
          }
        }
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User account is deactivated',
        error: 'USER_DEACTIVATED'
      });
      return;
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Optional authentication middleware (doesn't fail if no token)
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      // No token provided, continue without authentication
      next();
      return;
    }

    try {
      const decoded = verifyAccessToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          team: {
            select: {
              id: true,
              name: true,
              plan: true,
              isActive: true
            }
          }
        }
      });

      if (user && user.isActive) {
        req.user = user;
        req.userId = user.id;
      }
    } catch (error) {
      // Invalid token, but continue without authentication
      console.warn('Optional auth failed:', error);
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue even if there's an error
  }
}

// Role-based authorization middleware
export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      });
      return;
    }

    next();
  };
}

// Admin only middleware
export const requireAdmin = requireRole(UserRole.ADMIN);

// Team owner or admin middleware
export function requireTeamOwnerOrAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'NOT_AUTHENTICATED'
    });
    return;
  }

  const isAdmin = req.user.role === UserRole.ADMIN;
  const isTeamOwner = req.user.role === UserRole.TEAM_OWNER;

  if (!isAdmin && !isTeamOwner) {
    res.status(403).json({
      success: false,
      message: 'Team owner or admin access required',
      error: 'INSUFFICIENT_PERMISSIONS'
    });
    return;
  }

  next();
}

// Email verification middleware
export function requireEmailVerification(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'NOT_AUTHENTICATED'
    });
    return;
  }

  if (!req.user.emailVerified) {
    res.status(403).json({
      success: false,
      message: 'Email verification required',
      error: 'EMAIL_NOT_VERIFIED'
    });
    return;
  }

  next();
}

// Active team membership middleware
export function requireActiveTeam(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'NOT_AUTHENTICATED'
    });
    return;
  }

  if (!req.user.team || !req.user.team.isActive) {
    res.status(403).json({
      success: false,
      message: 'Active team membership required',
      error: 'NO_ACTIVE_TEAM'
    });
    return;
  }

  next();
}

// Combined middleware for common authentication patterns
export const requireAuthenticatedUser = [authenticate];
export const requireVerifiedUser = [authenticate, requireEmailVerification];
export const requireActiveTeamMember = [authenticate, requireEmailVerification, requireActiveTeam];
export const requireTeamManager = [authenticate, requireEmailVerification, requireActiveTeam, requireTeamOwnerOrAdmin];
export const requireSystemAdmin = [authenticate, requireAdmin];