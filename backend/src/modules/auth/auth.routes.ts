import { Router } from 'express';
import authController from './auth.controller';
import { authenticate, validate } from './auth.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from './auth.validation';
import { authLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refreshToken
);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/profile',
  authenticate,
  authController.getProfile
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

export default router;

