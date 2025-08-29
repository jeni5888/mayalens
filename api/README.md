# MayaLens Backend API

A robust Node.js/Express backend API for the MayaLens AI-powered product image generation platform.

## Features

- 🔐 **JWT Authentication** - Secure user authentication with refresh tokens
- 👥 **Multi-tenant Architecture** - Team-based access control
- 🖼️ **Image Processing** - Upload and process product images with Sharp
- 🤖 **AI Image Generation** - Generate product images using AI models
- 📊 **Database Management** - PostgreSQL with Prisma ORM
- 🛡️ **Security** - Rate limiting, CORS, Helmet, input validation
- 📝 **Logging** - Comprehensive request/response logging
- 🏥 **Health Checks** - System monitoring endpoints
- 🚀 **Production Ready** - Optimized for Railway deployment

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Image Processing**: Sharp
- **File Upload**: Multer
- **Validation**: Joi
- **Logging**: Winston

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- (Optional) Cloudinary account for image storage

### Installation

1. **Clone and navigate to the API directory**:
   ```bash
   cd api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/mayalens_db"
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_REFRESH_SECRET="your-super-secret-refresh-key"
   CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
   CLOUDINARY_API_KEY="your-cloudinary-key"
   CLOUDINARY_API_SECRET="your-cloudinary-secret"
   ```

4. **Set up the database**:
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed with initial data
   npm run db:seed
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/change-password` - Change password

### User Management
- `GET /api/users` - Get all users (admin)
- `GET /api/users/stats` - Get user statistics (admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id/profile` - Update user profile
- `PUT /api/users/:id/role` - Update user role (admin)
- `PUT /api/users/:id/status` - Toggle user status (admin)
- `DELETE /api/users/:id` - Delete user (admin)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/stats` - Get product statistics
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Images
- `POST /api/images/products/:productId/upload` - Upload product image
- `GET /api/images/products/:productId` - Get product images
- `DELETE /api/images/products/:productId/:imageId` - Delete product image
- `POST /api/images/generate` - Generate AI image
- `GET /api/images/generations/:id` - Get generation status
- `GET /api/images/generations` - Get user's generations

### Health
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system status
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

## Database Schema

### User Roles
- `SYSTEM_ADMIN` - Full system access
- `TEAM_OWNER` - Team management and all team resources
- `TEAM_MEMBER` - Limited access to team resources

### Core Models
- **User** - User accounts with role-based access
- **Team** - Multi-tenant organization structure
- **Product** - Product catalog with team isolation
- **ProductImage** - Uploaded product images
- **ImageGeneration** - AI-generated image tracking

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start with hot reload
npm run start:dev    # Start without hot reload

# Building
npm run build        # Compile TypeScript
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Create migration
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript check

# Testing
npm test             # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

### Default Accounts

After running `npm run db:seed`, these accounts will be available:

- **Admin**: `admin@mayalens.com` / `Admin123!@#`
- **Team Owner**: `owner@example.com` / `Owner123!@#`
- **Team Member**: `member@example.com` / `Member123!@#`

## Deployment

### Railway Deployment

1. **Connect your repository to Railway**
2. **Set environment variables** in Railway dashboard
3. **Deploy** - Railway will automatically build and deploy

### Environment Variables for Production

```env
DATABASE_URL=postgresql://...
JWT_SECRET=production-secret
JWT_REFRESH_SECRET=production-refresh-secret
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## Security Features

- **Rate Limiting** - Prevents abuse with configurable limits
- **CORS Protection** - Configurable cross-origin policies
- **Helmet Security** - Security headers and CSP
- **Input Validation** - Joi schema validation
- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **File Upload Security** - Type and size validation

## Monitoring

- **Health Checks** - Multiple endpoint types for monitoring
- **Request Logging** - Comprehensive request/response logs
- **Error Tracking** - Structured error logging
- **Performance Metrics** - Response time tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and type checks
6. Submit a pull request

## License

MIT License - see LICENSE file for details