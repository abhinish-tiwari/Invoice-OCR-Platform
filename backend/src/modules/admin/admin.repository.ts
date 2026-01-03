/**
 * Admin Repository
 * Database operations for admin functionality
 */

import { pool } from '../../config/db';
import { logger } from '../../utils/logger';

export interface UserListItem {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company: string | null;
  role: string;
  created_at: Date;
  last_login: Date | null;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  sortBy?: 'email' | 'created_at' | 'last_login';
  sortOrder?: 'ASC' | 'DESC';
}

export default class AdminRepository {
  /**
   * Get paginated list of users
   */
  static async listUsers(params: UserListParams = {}): Promise<{
    users: UserListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = params;

    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(email ILIKE $${paramIndex} OR first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      conditions.push(`role = $${paramIndex}`);
      values.push(role);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const validSortColumns = ['email', 'created_at', 'last_login'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get users
    const query = `
      SELECT id, email, first_name, last_name, company, role, created_at, last_login
      FROM users
      ${whereClause}
      ORDER BY ${sortColumn} ${order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await pool.query(query, [...values, limit, offset]);

    return {
      users: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<UserListItem | null> {
    const query = `
      SELECT id, email, first_name, last_name, company, role, created_at, last_login
      FROM users
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Update user role
   */
  static async updateUserRole(id: string, role: string): Promise<UserListItem | null> {
    const query = `
      UPDATE users
      SET role = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, first_name, last_name, company, role, created_at, last_login
    `;
    const result = await pool.query(query, [id, role]);
    logger.info('User role updated', { userId: id, newRole: role });
    return result.rows[0] || null;
  }

  /**
   * Delete user
   */
  static async deleteUser(id: string): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    if (result.rowCount && result.rowCount > 0) {
      logger.info('User deleted', { userId: id });
      return true;
    }
    return false;
  }

  /**
   * Get system stats
   */
  static async getSystemStats(): Promise<{
    totalUsers: number;
    totalInvoices: number;
    totalProducts: number;
    totalSuppliers: number;
  }> {
    const queries = [
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM invoices'),
      pool.query('SELECT COUNT(*) FROM products'),
      pool.query('SELECT COUNT(*) FROM suppliers'),
    ];

    const [users, invoices, products, suppliers] = await Promise.all(queries);

    return {
      totalUsers: parseInt(users.rows[0].count, 10),
      totalInvoices: parseInt(invoices.rows[0].count, 10),
      totalProducts: parseInt(products.rows[0].count, 10),
      totalSuppliers: parseInt(suppliers.rows[0].count, 10),
    };
  }
}

