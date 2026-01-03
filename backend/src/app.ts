import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env';
import { logger } from './utils/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimit.middleware';

const app: Application = express();

// Security middleware - configure helmet to allow images from same origin
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disable CSP for development
}));

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

// Serve uploaded files statically
// Files are accessible at /uploads/invoices/filename
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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