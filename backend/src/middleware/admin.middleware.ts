/**
 * Admin Middleware
 * Restricts access to admin users only
 */

import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from './error.middleware';
import MESSAGES from '../constants/messages';

/**
 * Middleware to restrict access to admin users only
 * Must be used after authenticate middleware
 */
export const adminOnly = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new ForbiddenError(MESSAGES.AUTH_MESSAGES.UNAUTHORIZED));
  }

  if (req.user.role !== 'admin') {
    return next(new ForbiddenError(MESSAGES.AUTH_MESSAGES.FORBIDDEN));
  }

  next();
};

export default { adminOnly };

