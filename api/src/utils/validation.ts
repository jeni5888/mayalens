import Joi from 'joi';
import { UserRole } from '@prisma/client';

// Common validation patterns
const emailPattern = Joi.string()
  .email({ tlds: { allow: false } })
  .lowercase()
  .trim()
  .max(255)
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required',
    'string.max': 'Email must not exceed 255 characters'
  });

const passwordPattern = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])\S*$/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 128 characters',
    'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, one special character, and no whitespace',
    'string.empty': 'Password is required'
  });

const namePattern = Joi.string()
  .trim()
  .min(1)
  .max(50)
  .pattern(/^[a-zA-Z\s'-]+$/)
  .required()
  .messages({
    'string.min': 'Name must be at least 1 character long',
    'string.max': 'Name must not exceed 50 characters',
    'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes',
    'string.empty': 'Name is required'
  });

// Authentication validation schemas
export const registerSchema = Joi.object({
  email: emailPattern,
  password: passwordPattern,
  firstName: namePattern,
  lastName: namePattern,
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .default(UserRole.TEAM_MEMBER)
    .messages({
      'any.only': `Role must be one of: ${Object.values(UserRole).join(', ')}`
    }),
  teamName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s'-]+$/)
    .when('role', {
      is: UserRole.TEAM_OWNER,
      then: Joi.required(),
      otherwise: Joi.forbidden()
    })
    .messages({
      'string.min': 'Team name must be at least 2 characters long',
      'string.max': 'Team name must not exceed 100 characters',
      'string.pattern.base': 'Team name can only contain letters, numbers, spaces, hyphens, and apostrophes',
      'any.required': 'Team name is required for team owners',
      'any.unknown': 'Team name is only allowed for team owners'
    })
});

export const loginSchema = Joi.object({
  email: emailPattern,
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  }),
  rememberMe: Joi.boolean().default(false)
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'Refresh token is required'
  })
});

export const forgotPasswordSchema = Joi.object({
  email: emailPattern
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Reset token is required'
  }),
  password: passwordPattern
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required'
  }),
  newPassword: passwordPattern
});

export const verifyEmailSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Verification token is required'
  })
});

// User management validation schemas
export const updateProfileSchema = Joi.object({
  firstName: namePattern.optional(),
  lastName: namePattern.optional(),
  email: emailPattern.optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

export const updateUserRoleSchema = Joi.object({
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .required()
    .messages({
      'any.only': `Role must be one of: ${Object.values(UserRole).join(', ')}`,
      'string.empty': 'Role is required'
    })
});

// Team validation schemas
export const createTeamSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s'-]+$/)
    .required()
    .messages({
      'string.min': 'Team name must be at least 2 characters long',
      'string.max': 'Team name must not exceed 100 characters',
      'string.pattern.base': 'Team name can only contain letters, numbers, spaces, hyphens, and apostrophes',
      'string.empty': 'Team name is required'
    })
});

export const updateTeamSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s'-]+$/)
    .optional()
    .messages({
      'string.min': 'Team name must be at least 2 characters long',
      'string.max': 'Team name must not exceed 100 characters',
      'string.pattern.base': 'Team name can only contain letters, numbers, spaces, hyphens, and apostrophes'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Product validation schemas
export const createProductSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.min': 'Product name must be at least 1 character long',
      'string.max': 'Product name must not exceed 200 characters',
      'string.empty': 'Product name is required'
    }),
  description: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Description must not exceed 1000 characters'
    }),
  category: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Category must not exceed 100 characters'
    }),
  tags: Joi.array()
    .items(Joi.string().trim().max(50))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 tags allowed',
      'string.max': 'Each tag must not exceed 50 characters'
    })
});

export const updateProductSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Product name must be at least 1 character long',
      'string.max': 'Product name must not exceed 200 characters'
    }),
  description: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description must not exceed 1000 characters'
    }),
  category: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Category must not exceed 100 characters'
    }),
  tags: Joi.array()
    .items(Joi.string().trim().max(50))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 tags allowed',
      'string.max': 'Each tag must not exceed 50 characters'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Image generation validation schemas
export const generateImageSchema = Joi.object({
  prompt: Joi.string()
    .trim()
    .min(5)
    .max(500)
    .required()
    .messages({
      'string.min': 'Prompt must be at least 5 characters long',
      'string.max': 'Prompt must not exceed 500 characters',
      'string.empty': 'Prompt is required'
    }),
  style: Joi.string()
    .valid('REALISTIC', 'ARTISTIC', 'CARTOON', 'ABSTRACT', 'MINIMALIST')
    .default('REALISTIC')
    .messages({
      'any.only': 'Style must be one of: REALISTIC, ARTISTIC, CARTOON, ABSTRACT, MINIMALIST'
    }),
  format: Joi.string()
    .valid('SQUARE', 'PORTRAIT', 'LANDSCAPE')
    .default('SQUARE')
    .messages({
      'any.only': 'Format must be one of: SQUARE, PORTRAIT, LANDSCAPE'
    }),
  productId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Product ID must be a valid UUID'
    })
});

// Pagination validation schema
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.min': 'Page must be at least 1',
    'number.integer': 'Page must be an integer'
  }),
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must not exceed 100',
    'number.integer': 'Limit must be an integer'
  }),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages({
    'any.only': 'Sort order must be either "asc" or "desc"'
  })
});

// UUID validation schema
export const uuidSchema = Joi.string().uuid().required().messages({
  'string.uuid': 'Must be a valid UUID',
  'string.empty': 'ID is required'
});

// Validation middleware factory
export function validateRequest(schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: errors
      });
    }

    // Replace the original data with validated and sanitized data
    req[property] = value;
    next();
  };
}