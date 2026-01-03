/**
 * Admin Routes
 * API routes for admin functionality
 */

import { Router } from 'express';
import {
  listUsers,
  getUser,
  updateUserRole,
  deleteUser,
  getSystemStats,
} from './admin.controller';
import { authenticate } from '../auth/auth.middleware';
import { adminOnly } from '../../middleware/admin.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(adminOnly);

// GET /api/v1/admin/stats - Get system statistics
router.get('/stats', getSystemStats);

// GET /api/v1/admin/users - List all users
router.get('/users', listUsers);

// GET /api/v1/admin/users/:id - Get user by ID
router.get('/users/:id', getUser);

// PUT /api/v1/admin/users/:id/role - Update user role
router.put('/users/:id/role', updateUserRole);

// DELETE /api/v1/admin/users/:id - Delete user
router.delete('/users/:id', deleteUser);

export default router;

