# MayaLens

AI-powered image generation and management platform built with React, Node.js, and PostgreSQL.

## 🚀 Features

- **AI Image Generation**: Create stunning images using advanced AI models
- **User Management**: Secure authentication and user profiles
- **Product Catalog**: Manage and showcase generated images
- **Team Collaboration**: Work together on image projects
- **Real-time Processing**: Fast image generation and processing

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Zustand for state management
- React Router for navigation

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- PostgreSQL database
- JWT authentication
- Multer for file uploads
- Sharp for image processing

## 📦 Project Structure

```
MayaLens/
├── src/                 # Frontend React application
│   ├── components/      # Reusable UI components
│   ├── pages/          # Application pages
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript type definitions
├── api/                # Backend Node.js application
│   ├── src/
│   │   ├── controllers/ # Route controllers
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/     # API routes
│   │   ├── utils/      # Backend utilities
│   │   └── types/      # Backend type definitions
│   └── prisma/         # Database schema and migrations
└── shared/             # Shared types between frontend and backend
```

## 🚀 Deployment

### Railway Deployment

1. **Connect to Railway**:
   - Go to [Railway](https://railway.app)
   - Connect your GitHub account
   - Import this repository

2. **Environment Variables**:
   Set the following environment variables in Railway:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   JWT_SECRET=your-jwt-secret-key
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=30d
   NODE_ENV=production
   PORT=3000
   ```

3. **Database Setup**:
   - Railway will automatically provision a PostgreSQL database
   - The database migrations will run automatically on deployment

4. **Build Configuration**:
   Railway will automatically detect the Node.js application and:
   - Install dependencies with `npm install`
   - Run database migrations with `npx prisma migrate deploy`
   - Start the server with `npm start`

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/jeni5888/mayalens.git
   cd mayalens
   ```

2. **Install dependencies**:
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd api
   npm install
   ```

3. **Set up environment variables**:
   Create `.env` files in both root and `api` directories with the required variables.

4. **Set up database**:
   ```bash
   cd api
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Start development servers**:
   ```bash
   # Backend (from api directory)
   npm run dev
   
   # Frontend (from root directory)
   npm run dev
   ```

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/profile` - Delete user account

### Image Operations
- `POST /api/images/generate` - Generate new image
- `GET /api/images` - Get user's images
- `POST /api/images/upload` - Upload image
- `DELETE /api/images/:id` - Delete image

### Health Check
- `GET /health` - Server health status

## 🔧 Configuration

The application uses Prisma for database management with the following models:
- **User**: User accounts and authentication
- **Product**: Generated images and products
- **ProductImage**: Image metadata and storage
- **ImageGeneration**: AI generation history
- **Team**: Team collaboration features

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support and questions, please open an issue on GitHub.