import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
      statusCode: 429,
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests from this IP, please try again later.',
        statusCode: 429,
      },
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later.',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many authentication attempts, please try again later.',
        statusCode: 429,
      },
    });
  },
});

/**
 * Rate limiter for file upload endpoints
 * 10 requests per hour
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    success: false,
    error: {
      message: 'Too many upload requests, please try again later.',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many upload requests, please try again later.',
        statusCode: 429,
      },
    });
  },
});

export default {
  apiLimiter,
  authLimiter,
  uploadLimiter,
};

