import { Request, Response } from 'express';
import { AuthenticatedRequest, LoginRequest, RegisterRequest, AuthResponse } from '@/types';
import { prisma } from '@/utils/database';
import { hashPassword, verifyPassword, validatePassword } from '@/utils/password';
import { generateTokenPair, verifyRefreshToken } from '@/utils/jwt';
import { UserRole, TeamPlan } from '@prisma/client';
import crypto from 'crypto';

// Register new user
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, firstName, lastName, role, teamName }: RegisterRequest = req.body;

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        error: 'WEAK_PASSWORD',
        details: passwordValidation.errors
      });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists',
        error: 'USER_EXISTS'
      });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user and team in a transaction
    const result = await prisma.$transaction(async (tx) => {
      let teamId: string | null = null;

      // Create team if user is team owner
      if (role === UserRole.TEAM_OWNER && teamName) {
        const team = await tx.team.create({
          data: {
            name: teamName,
            plan: TeamPlan.FREE,
            isActive: true
          }
        });
        teamId = team.id;
      }

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role,
          teamId,
          isActive: true,
          emailVerified: false,
          emailVerificationToken,
          emailVerificationExpires
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
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

      return user;
    });

    // Generate tokens
    const tokens = generateTokenPair(result as any);

    // TODO: Send verification email
    console.log(`Email verification token for ${email}: ${emailVerificationToken}`);

    const response: AuthResponse = {
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      user: result,
      tokens
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Login user
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, rememberMe }: LoginRequest = req.body;

    // Find user with password
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
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
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
        error: 'ACCOUNT_DEACTIVATED'
      });
      return;
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    // Generate tokens
    const tokens = generateTokenPair(userWithoutPassword as any);

    const response: AuthResponse = {
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      tokens
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Refresh access token
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        error: 'MISSING_REFRESH_TOKEN'
      });
      return;
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        error: 'INVALID_REFRESH_TOKEN'
      });
      return;
    }

    // Get user from database
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

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User not found or account deactivated',
        error: 'USER_NOT_FOUND'
      });
      return;
    }

    // Generate new tokens
    const tokens = generateTokenPair(user as any);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      tokens
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during token refresh',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Logout user (client-side token removal)
export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    // In a JWT-based system, logout is typically handled client-side
    // by removing the tokens from storage. However, we can log the logout event.
    
    if (req.user) {
      console.log(`User ${req.user.email} logged out at ${new Date().toISOString()}`);
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Get current user profile
export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      user: req.user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving profile',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Verify email
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Verification token is required',
        error: 'MISSING_TOKEN'
      });
      return;
    }

    // Find user with verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
        error: 'INVALID_TOKEN'
      });
      return;
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during email verification',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Resend verification email
export async function resendVerification(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not
      res.status(200).json({
        success: true,
        message: 'If the email exists, a verification email has been sent'
      });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({
        success: false,
        message: 'Email is already verified',
        error: 'ALREADY_VERIFIED'
      });
      return;
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationExpires
      }
    });

    // TODO: Send verification email
    console.log(`New email verification token for ${email}: ${emailVerificationToken}`);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while sending verification email',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Change password
export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, password: true }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
        error: 'INVALID_CURRENT_PASSWORD'
      });
      return;
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message: 'New password does not meet security requirements',
        error: 'WEAK_PASSWORD',
        details: passwordValidation.errors
      });
      return;
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while changing password',
      error: 'INTERNAL_ERROR'
    });
  }
}