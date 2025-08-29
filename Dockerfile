# Use Node.js 20 LTS as base image
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy API package files
COPY api/package*.json ./api/
COPY api/prisma ./api/prisma/

# Install root dependencies (including devDependencies for building)
RUN npm ci && npm cache clean --force

# Install API dependencies (including devDependencies for building)
WORKDIR /app/api
RUN npm ci && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Go back to root directory
WORKDIR /app

# Copy source code
COPY . .

# Build the application
RUN npm run build:all

# Remove devDependencies to reduce image size
WORKDIR /app
RUN npm prune --production
WORKDIR /app/api
RUN npm prune --production

# Go back to root directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mayalens -u 1001

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads && chown -R mayalens:nodejs /app/uploads

# Switch to non-root user
USER mayalens

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
CMD ["npm", "start"]