# Railway.com Deployment Guide

This guide explains how to deploy the MayaLens project to Railway.com via GitHub.

## Prerequisites

1. GitHub account with your project repository
2. Railway.com account
3. Cloudinary account (for image storage)
4. Gmail account with App Password (for email functionality)
5. Gemini API key (for AI features)
6. Stripe account (if using payments)

## Step 1: Prepare Your GitHub Repository

1. Push all your code to GitHub
2. Ensure the following files are in your repository:
   - `Dockerfile`
   - `railway.toml`
   - `.env.production` (as reference)
   - All source code

## Step 2: Create Railway Project

1. Go to [Railway.com](https://railway.com)
2. Sign in with your GitHub account
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your MayaLens repository

## Step 3: Add PostgreSQL Database

1. In your Railway project dashboard
2. Click "+ New Service"
3. Select "Database" → "PostgreSQL"
4. Railway will automatically provide the `DATABASE_URL` environment variable

## Step 4: Configure Environment Variables

In your Railway project settings, add these environment variables:

### Required Variables
```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL (update with your actual frontend domain)
FRONTEND_URL=https://your-frontend-domain.vercel.app
CORS_ORIGIN=https://your-frontend-domain.vercel.app

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
FROM_EMAIL=noreply@mayalens.com
FROM_NAME=MayaLens

# AI Configuration
GEMINI_API_KEY=your-gemini-api-key

# Security
SESSION_SECRET=your-session-secret-make-it-long-and-random

# Production Settings
NODE_ENV=production
RAILWAY_ENVIRONMENT=production
LOG_LEVEL=info
```

### Optional Variables
```bash
# Stripe (if using payments)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
MAX_FILES_COUNT=5

# Image Processing
IMAGE_QUALITY=80
MAX_IMAGE_WIDTH=2048
MAX_IMAGE_HEIGHT=2048
```

## Step 5: Deploy

1. Railway will automatically deploy when you push to your main branch
2. Monitor the deployment logs in Railway dashboard
3. Once deployed, Railway will provide a public URL

## Step 6: Update Frontend Configuration

1. Update your frontend environment variables:
   ```bash
   VITE_API_URL=https://your-railway-domain.railway.app
   ```
2. Deploy your frontend to Vercel/Netlify
3. Update the `FRONTEND_URL` and `CORS_ORIGIN` in Railway with your frontend domain

## Step 7: Database Migration

1. Railway will automatically run Prisma migrations during deployment
2. If you need to run manual migrations:
   ```bash
   railway run npx prisma migrate deploy
   ```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL service is added to your Railway project
   - Check that `DATABASE_URL` is automatically set by Railway

2. **CORS Errors**
   - Update `CORS_ORIGIN` with your actual frontend domain
   - Ensure `FRONTEND_URL` matches your deployed frontend

3. **Environment Variables**
   - Double-check all required environment variables are set
   - Ensure no trailing spaces in variable values

4. **Build Failures**
   - Check Railway build logs for specific errors
   - Ensure all dependencies are in `package.json`

### Health Check

Once deployed, test your API:
- Health endpoint: `https://your-railway-domain.railway.app/api/health`
- API info: `https://your-railway-domain.railway.app/api`

## Security Notes

1. Never commit real environment variables to Git
2. Use strong, unique secrets for JWT and session keys
3. Enable Railway's built-in security features
4. Regularly rotate API keys and secrets
5. Monitor Railway logs for suspicious activity

## Scaling

Railway automatically scales based on usage. For high-traffic applications:
1. Consider upgrading to Railway Pro
2. Add Redis for session storage and caching
3. Implement database connection pooling
4. Use CDN for static assets

## Support

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Issues: Create issues in your GitHub repository