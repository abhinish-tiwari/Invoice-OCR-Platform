import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { logger } from './utils/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimit.middleware';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', apiLimiter);

// Request logging middleware
app.use((req, _res, next) => { 
	logger.info(`${req.method} ${req.path}`, { ip: req.ip, userAgent: req.get('user-agent') });
	next(); 
});

// API routes
app.use('/api/v1', routes);

// Error handlers
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;