import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { testConnection } from './config/db';

const PORT = env.PORT || 3000;

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Start listening
    app.listen(PORT, () => {
      logger.info('='.repeat(50));
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
      logger.info('='.repeat(50));
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();

