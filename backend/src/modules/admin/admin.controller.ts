/**
 * Admin Controller
 * HTTP handlers for admin endpoints
 */

import { Request, Response, NextFunction } from 'express';
import AdminService from './admin.service';
import { logger } from '../../utils/logger';

/**
 * List all users
 * GET /api/v1/admin/users
 */
export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, search, role, sortBy, sortOrder } = req.query;

    const result = await AdminService.listUsers({
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      search: search as string,
      role: role as string,
      sortBy: sortBy as 'email' | 'created_at' | 'last_login',
      sortOrder: sortOrder as 'ASC' | 'DESC',
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user by ID
 * GET /api/v1/admin/users/:id
 */
export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = await AdminService.getUserById(id);

    res.json({
      success: true,
      data: { user },
    });
  } catch (error: any) {
    if (error.message === 'User not found') {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
}

/**
 * Update user role
 * PUT /api/v1/admin/users/:id/role
 */
export async function updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = req.user!.userId;

    const user = await AdminService.updateUserRole(id, role, adminId);

    logger.info('User role updated by admin', { adminId, userId: id, newRole: role });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: { user },
    });
  } catch (error: any) {
    if (error.message === 'User not found') {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    if (error.message === 'Cannot change your own role' || error.message === 'Invalid role') {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
}

/**
 * Delete user
 * DELETE /api/v1/admin/users/:id
 */
export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const adminId = req.user!.userId;

    await AdminService.deleteUser(id, adminId);

    logger.info('User deleted by admin', { adminId, userId: id });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    if (error.message === 'User not found') {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    if (error.message === 'Cannot delete your own account') {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
}

/**
 * Get system stats
 * GET /api/v1/admin/stats
 */
export async function getSystemStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await AdminService.getSystemStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

