import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../utils/jwt.util';
import { UnauthorizedError, ForbiddenError } from '../../middleware/error.middleware';
import { AUTH_MESSAGES } from '../../constants/messages';
import { ZodSchema } from 'zod';
import { logger } from '../../utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role?: string;
      };
    }
  }
}

/**
 * Middleware to authenticate user using JWT
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError(AUTH_MESSAGES.UNAUTHORIZED);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyAccessToken(token);

    // Attach user to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    next(new UnauthorizedError(AUTH_MESSAGES.INVALID_TOKEN));
  }
};

/**
 * Middleware to authorize user based on roles
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError(AUTH_MESSAGES.UNAUTHORIZED);
      }

      const userRole = req.user.role || 'user';

      if (!allowedRoles.includes(userRole)) {
        throw new ForbiddenError(AUTH_MESSAGES.FORBIDDEN);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to validate request using Zod schema
 */
export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      logger.error('Validation error:', error);
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          statusCode: 400,
          details: error.errors || error.message,
        },
      });
    }
  };
};

export default {
  authenticate,
  authorize,
  validate,
};

