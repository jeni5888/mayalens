import app from './app';
import { logger } from './utils/logger';
import { connectDatabase } from './utils/database';

const PORT = process.env['PORT'] || 3001;

// Start server function
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, {
        port: PORT,
        environment: process.env['NODE_ENV'] || 'development',
        timestamp: new Date().toISOString()
      });
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server
startServer();