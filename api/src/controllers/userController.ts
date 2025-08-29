import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/types';
import { prisma } from '@/utils/database';
import { hashPassword, validatePassword } from '@/utils/password';
import { UserRole } from '@prisma/client';

// Get all users (Admin only)
export async function getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search, role, isActive } = req.query;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          team: {
            select: {
              id: true,
              name: true,
              plan: true,
              isActive: true
            }
          },
          _count: {
            select: {
              products: true,
              imageGenerations: true
            }
          }
        },
        orderBy: {
          [sortBy as string]: sortOrder
        },
        skip,
        take
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      pagination: {
        page: Number(page),
        limit: take,
        total,
        totalPages,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving users',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Get user by ID
export async function getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        team: {
          select: {
            id: true,
            name: true,
            plan: true,
            isActive: true,
            createdAt: true
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            category: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        },
        imageGenerations: {
          select: {
            id: true,
            prompt: true,
            style: true,
            status: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        },
        _count: {
          select: {
            products: true,
            imageGenerations: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving user',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Update user profile (self or admin)
export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { id } = req.params;
    const { firstName, lastName, email } = req.body;

    // Check if user can update this profile
    const canUpdate = req.user.id === id || req.user.role === UserRole.ADMIN;
    if (!canUpdate) {
      res.status(403).json({
        success: false,
        message: 'You can only update your own profile',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
      return;
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: id }
        }
      });

      if (emailExists) {
        res.status(409).json({
          success: false,
          message: 'Email is already taken',
          error: 'EMAIL_EXISTS'
        });
        return;
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email, emailVerified: email !== existingUser.email ? false : existingUser.emailVerified })
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

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating profile',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Update user role (Admin only)
export async function updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
      return;
    }

    // Prevent self-role change for admins
    if (req.user?.id === id && req.user.role === UserRole.ADMIN) {
      res.status(400).json({
        success: false,
        message: 'Admins cannot change their own role',
        error: 'SELF_ROLE_CHANGE_FORBIDDEN'
      });
      return;
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating user role',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Deactivate/Activate user (Admin only)
export async function toggleUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
      return;
    }

    // Prevent self-deactivation for admins
    if (req.user?.id === id && req.user.role === UserRole.ADMIN && !isActive) {
      res.status(400).json({
        success: false,
        message: 'Admins cannot deactivate their own account',
        error: 'SELF_DEACTIVATION_FORBIDDEN'
      });
      return;
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedUser
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating user status',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Delete user (Admin only)
export async function deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        products: true,
        imageGenerations: true
      }
    });

    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
      return;
    }

    // Prevent self-deletion for admins
    if (req.user?.id === id) {
      res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
        error: 'SELF_DELETION_FORBIDDEN'
      });
      return;
    }

    // Delete user and related data in transaction
    await prisma.$transaction(async (tx) => {
      // Delete related image generations
      await tx.imageGeneration.deleteMany({
        where: { userId: id }
      });

      // Delete related product images
      await tx.productImage.deleteMany({
        where: {
          product: {
            userId: id
          }
        }
      });

      // Delete related products
      await tx.product.deleteMany({
        where: { userId: id }
      });

      // Delete user
      await tx.user.delete({
        where: { id }
      });
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting user',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Get user statistics (Admin only)
export async function getUserStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const [totalUsers, activeUsers, verifiedUsers, usersByRole, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          id: true
        }
      }),
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })
    ]);

    const roleStats = usersByRole.reduce((acc, item) => {
      acc[item.role] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    res.status(200).json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        totalUsers,
        activeUsers,
        verifiedUsers,
        inactiveUsers: totalUsers - activeUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
        roleDistribution: roleStats,
        recentUsers
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving user statistics',
      error: 'INTERNAL_ERROR'
    });
  }
}