/**
 * Admin Service
 * Business logic for admin functionality
 */

import AdminRepository, { UserListParams } from './admin.repository';
import { logger } from '../../utils/logger';

export default class AdminService {
  /**
   * Get paginated list of users
   */
  static async listUsers(params: UserListParams) {
    return AdminRepository.listUsers(params);
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string) {
    const user = await AdminRepository.getUserById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Update user role
   */
  static async updateUserRole(id: string, role: string, adminId: string) {
    // Prevent admin from changing their own role
    if (id === adminId) {
      throw new Error('Cannot change your own role');
    }

    // Validate role
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }

    const user = await AdminRepository.updateUserRole(id, role);
    if (!user) {
      throw new Error('User not found');
    }

    logger.info('Admin updated user role', { adminId, userId: id, newRole: role });
    return user;
  }

  /**
   * Delete user
   */
  static async deleteUser(id: string, adminId: string) {
    // Prevent admin from deleting themselves
    if (id === adminId) {
      throw new Error('Cannot delete your own account');
    }

    const deleted = await AdminRepository.deleteUser(id);
    if (!deleted) {
      throw new Error('User not found');
    }

    logger.info('Admin deleted user', { adminId, userId: id });
    return true;
  }

  /**
   * Get system statistics
   */
  static async getSystemStats() {
    return AdminRepository.getSystemStats();
  }
}

