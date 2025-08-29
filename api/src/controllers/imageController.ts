import { Request, Response } from 'express';
import { AuthenticatedRequest, UploadedFile } from '@/types';
import { prisma } from '@/utils/database';
import { UserRole, GenerationStatus, GenerationStyle, ImageFormat } from '@prisma/client';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary (should be done in environment setup)
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Helper function to upload buffer to Cloudinary
async function uploadToCloudinary(buffer: Buffer, filename: string, folder: string = 'mayalens'): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        resource_type: 'image',
        format: 'webp',
        quality: 'auto:good'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result?.secure_url || '');
        }
      }
    );

    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });
}

// Upload product image
export async function uploadProductImage(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { productId } = req.params;
    const { altText, isPrimary = false } = req.body;
    const file = req.file as UploadedFile;

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'No image file provided',
        error: 'NO_FILE_PROVIDED'
      });
      return;
    }

    // Check if product exists and user owns it
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        userId: true,
        name: true
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

    // Check if user can upload images for this product
    const canUpload = req.user.role === UserRole.ADMIN || req.user.id === product.userId;
    if (!canUpload) {
      res.status(403).json({
        success: false,
        message: 'You can only upload images for your own products',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    // Process image with Sharp
    const processedBuffer = await sharp(file.buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Generate unique filename
    const filename = `product-${productId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(processedBuffer, filename, 'mayalens/products');

    // If this is set as primary, unset other primary images
    if (isPrimary) {
      await prisma.productImage.updateMany({
        where: {
          productId,
          isPrimary: true
        },
        data: {
          isPrimary: false
        }
      });
    }

    // Save image record to database
    const productImage = await prisma.productImage.create({
      data: {
        productId,
        imageUrl,
        altText: altText || `${product.name} product image`,
        isPrimary: Boolean(isPrimary)
      },
      select: {
        id: true,
        imageUrl: true,
        altText: true,
        isPrimary: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Product image uploaded successfully',
      data: productImage
    });
  } catch (error) {
    console.error('Upload product image error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while uploading image',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Get product images
export async function getProductImages(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { productId } = req.params;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        userId: true,
        name: true
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

    // Check if user can access this product's images
    const canAccess = req.user?.role === UserRole.ADMIN || req.user?.id === product.userId;
    if (!canAccess) {
      res.status(403).json({
        success: false,
        message: 'You can only access images for your own products',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    // Get product images
    const images = await prisma.productImage.findMany({
      where: { productId },
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
    });

    res.status(200).json({
      success: true,
      message: 'Product images retrieved successfully',
      data: images
    });
  } catch (error) {
    console.error('Get product images error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving images',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Delete product image
export async function deleteProductImage(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { productId, imageId } = req.params;

    // Check if image exists and get product info
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
      include: {
        product: {
          select: {
            id: true,
            userId: true,
            name: true
          }
        }
      }
    });

    if (!image || image.productId !== productId) {
      res.status(404).json({
        success: false,
        message: 'Product image not found',
        error: 'IMAGE_NOT_FOUND'
      });
      return;
    }

    // Check if user can delete this image
    const canDelete = req.user.role === UserRole.ADMIN || req.user.id === image.product.userId;
    if (!canDelete) {
      res.status(403).json({
        success: false,
        message: 'You can only delete images for your own products',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    // Extract public_id from Cloudinary URL for deletion
    const urlParts = image.imageUrl.split('/');
    const publicIdWithExtension = urlParts.slice(-2).join('/'); // folder/filename.ext
    const publicId = publicIdWithExtension.split('.')[0]; // Remove extension

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (cloudinaryError) {
      console.warn('Failed to delete image from Cloudinary:', cloudinaryError);
      // Continue with database deletion even if Cloudinary deletion fails
    }

    // Delete from database
    await prisma.productImage.delete({
      where: { id: imageId }
    });

    res.status(200).json({
      success: true,
      message: 'Product image deleted successfully'
    });
  } catch (error) {
    console.error('Delete product image error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting image',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Generate AI image
export async function generateImage(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { prompt, style, format = ImageFormat.PNG, productId } = req.body;

    // Validate product if provided
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          userId: true
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

      // Check if user can generate images for this product
      const canGenerate = req.user.role === UserRole.ADMIN || req.user.id === product.userId;
      if (!canGenerate) {
        res.status(403).json({
          success: false,
          message: 'You can only generate images for your own products',
          error: 'INSUFFICIENT_PERMISSIONS'
        });
        return;
      }
    }

    // Create image generation record
    const imageGeneration = await prisma.imageGeneration.create({
      data: {
        prompt,
        style,
        format,
        status: GenerationStatus.PENDING,
        userId: req.user.id,
        ...(productId && { productId })
      },
      select: {
        id: true,
        prompt: true,
        style: true,
        format: true,
        status: true,
        createdAt: true,
        product: productId ? {
          select: {
            id: true,
            name: true
          }
        } : undefined
      }
    });

    // TODO: Implement actual AI image generation with Gemini API
    // For now, we'll simulate the process
    
    // In a real implementation, you would:
    // 1. Call Gemini 2.5 Flash API with the prompt and style
    // 2. Process the generated image
    // 3. Upload to Cloudinary
    // 4. Update the database record with the result

    // Simulate async processing
    setTimeout(async () => {
      try {
        // This would be replaced with actual AI generation
        const mockImageUrl = `https://via.placeholder.com/512x512/4F46E5/FFFFFF?text=${encodeURIComponent(style)}`;
        
        await prisma.imageGeneration.update({
          where: { id: imageGeneration.id },
          data: {
            status: GenerationStatus.COMPLETED,
            imageUrl: mockImageUrl,
            completedAt: new Date()
          }
        });
      } catch (error) {
        console.error('Image generation simulation error:', error);
        await prisma.imageGeneration.update({
          where: { id: imageGeneration.id },
          data: {
            status: GenerationStatus.FAILED,
            errorMessage: 'Image generation failed'
          }
        });
      }
    }, 2000);

    res.status(202).json({
      success: true,
      message: 'Image generation started successfully',
      data: imageGeneration
    });
  } catch (error) {
    console.error('Generate image error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while starting image generation',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Get image generation status
export async function getImageGeneration(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const imageGeneration = await prisma.imageGeneration.findUnique({
      where: { id },
      select: {
        id: true,
        prompt: true,
        style: true,
        format: true,
        status: true,
        imageUrl: true,
        errorMessage: true,
        createdAt: true,
        completedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        product: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!imageGeneration) {
      res.status(404).json({
        success: false,
        message: 'Image generation not found',
        error: 'GENERATION_NOT_FOUND'
      });
      return;
    }

    // Check if user can access this generation
    const canAccess = req.user?.role === UserRole.ADMIN || req.user?.id === imageGeneration.user.id;
    if (!canAccess) {
      res.status(403).json({
        success: false,
        message: 'You can only access your own image generations',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Image generation retrieved successfully',
      data: imageGeneration
    });
  } catch (error) {
    console.error('Get image generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving image generation',
      error: 'INTERNAL_ERROR'
    });
  }
}

// Get user's image generations
export async function getUserImageGenerations(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { page = 1, limit = 20, status, productId } = req.query;

    // Build where clause
    const where: any = {
      userId: req.user?.role === UserRole.ADMIN ? undefined : req.user?.id
    };

    if (status) {
      where.status = status;
    }

    if (productId) {
      where.productId = productId as string;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Get image generations with pagination
    const [generations, total] = await Promise.all([
      prisma.imageGeneration.findMany({
        where,
        select: {
          id: true,
          prompt: true,
          style: true,
          format: true,
          status: true,
          imageUrl: true,
          createdAt: true,
          completedAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          product: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take
      }),
      prisma.imageGeneration.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.status(200).json({
      success: true,
      message: 'Image generations retrieved successfully',
      data: generations,
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
    console.error('Get user image generations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving image generations',
      error: 'INTERNAL_ERROR'
    });
  }
}