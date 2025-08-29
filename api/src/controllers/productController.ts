import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/types';
import { prisma } from '@/utils/database';
import { UserRole } from '@prisma/client';

// Get all products with filtering and pagination
export async function getAllProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      sortOrder = 'desc', 
      search, 
      category,
      userId 
    } = req.query;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { category: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = { contains: category as string, mode: 'insensitive' };
    }

    if (userId) {
      where.userId = userId as string;
    }

    // For non-admin users, only show their own products
    if (req.user?.role !== UserRole.ADMIN) {
      where.userId = req.user?.id;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Get products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          targetAudience: true,
          keyFeatures: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          images: {
            select: {
              id: true,
              imageUrl: true,
              altText: true,
              isPrimary: true
            },
            orderBy: {
              isPrimary: 'desc'
            },
            take: 3
          },
          _count: {
            select: {
              images: true
            }
          }
        },
        orderBy: {
          [sortBy as string]: sortOrder
        },
        skip,
        take
      }),
      prisma.product.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: products,
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
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving products',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Get product by ID
export async function getProductById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        targetAudience: true,
        keyFeatures: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        images: {
          select: {
            id: true,
            imageUrl: true,
            altText: true,
            isPrimary: true,
            createdAt: true
          },
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND'
      });
      return;
    }

    // Check if user can access this product
    const canAccess = req.user?.role === UserRole.ADMIN || req.user?.id === product.user.id;
    if (!canAccess) {
      res.status(403).json({
        success: false,
        message: 'You can only access your own products',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: product
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving product',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Create new product
export async function createProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { name, description, category, targetAudience, keyFeatures } = req.body;

    // Check if product name already exists for this user
    const existingProduct = await prisma.product.findFirst({
      where: {
        name,
        userId: req.user.id
      }
    });

    if (existingProduct) {
      res.status(409).json({
        success: false,
        message: 'Product with this name already exists',
        error: 'PRODUCT_NAME_EXISTS'
      });
      return;
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        category,
        targetAudience,
        keyFeatures,
        userId: req.user.id
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        targetAudience: true,
        keyFeatures: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating product',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Update product
export async function updateProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
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
    const { name, description, category, targetAudience, keyFeatures } = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND'
      });
      return;
    }

    // Check if user can update this product
    const canUpdate = req.user.role === UserRole.ADMIN || req.user.id === existingProduct.userId;
    if (!canUpdate) {
      res.status(403).json({
        success: false,
        message: 'You can only update your own products',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    // Check if new name conflicts with existing products (excluding current product)
    if (name && name !== existingProduct.name) {
      const nameConflict = await prisma.product.findFirst({
        where: {
          name,
          userId: existingProduct.userId,
          id: { not: id }
        }
      });

      if (nameConflict) {
        res.status(409).json({
          success: false,
          message: 'Product with this name already exists',
          error: 'PRODUCT_NAME_EXISTS'
        });
        return;
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(category && { category }),
        ...(targetAudience && { targetAudience }),
        ...(keyFeatures && { keyFeatures })
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        targetAudience: true,
        keyFeatures: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        images: {
          select: {
            id: true,
            imageUrl: true,
            altText: true,
            isPrimary: true
          },
          orderBy: {
            isPrimary: 'desc'
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating product',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Delete product
export async function deleteProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
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

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true
      }
    });

    if (!existingProduct) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND'
      });
      return;
    }

    // Check if user can delete this product
    const canDelete = req.user.role === UserRole.ADMIN || req.user.id === existingProduct.userId;
    if (!canDelete) {
      res.status(403).json({
        success: false,
        message: 'You can only delete your own products',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    // Delete product and related images in transaction
    await prisma.$transaction(async (tx) => {
      // Delete related product images
      await tx.productImage.deleteMany({
        where: { productId: id }
      });

      // Delete product
      await tx.product.delete({
        where: { id }
      });
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting product',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Get product statistics
export async function getProductStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.role === UserRole.ADMIN ? undefined : req.user?.id;
    const where = userId ? { userId } : {};

    const [totalProducts, productsByCategory, recentProducts] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.groupBy({
        by: ['category'],
        where,
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      }),
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          category: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              images: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })
    ]);

    const categoryStats = productsByCategory.reduce((acc, item) => {
      acc[item.category] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    res.status(200).json({
      success: true,
      message: 'Product statistics retrieved successfully',
      data: {
        totalProducts,
        categoryDistribution: categoryStats,
        recentProducts
      }
    });
  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving product statistics',
      error: 'INTERNAL_ERROR'
    });
  }
}