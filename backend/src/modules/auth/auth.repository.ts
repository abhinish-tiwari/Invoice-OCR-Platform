import { pool } from '../../config/db';
import { logger } from '../../utils/logger';

export interface User {
  id: string;
  email: string;
  password: string;
  full_name?: string;
  company_name?: string;
  role: string;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  fullName?: string;
  companyName?: string;
}

export default class AuthRepository {

  static async createUser(userData: CreateUserData): Promise<User> {
    const query = `
      INSERT INTO users (email, password, full_name, company_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, full_name, company_name, role, is_verified, created_at, updated_at
    `;

    const values = [
      userData.email,
      userData.password,
      userData.fullName || null,
      userData.companyName || null,
      'user', // Default role
    ];

    try {
      const result = await pool.query(query, values);
      logger.info('User created successfully', { userId: result?.rows?.[0]?.id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, email, password, full_name, company_name, role, is_verified, created_at, updated_at
      FROM users
      WHERE email = $1
    `;

    try {
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const query = `
      SELECT id, email, password, full_name, company_name, role, is_verified, created_at, updated_at
      FROM users
      WHERE id = $1
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Update user's last login timestamp
   */
  static async updateLastLogin(userId: string): Promise<void> {
    const query = `
      UPDATE users
      SET last_login = NOW()
      WHERE id = $1
    `;

    try {
      await pool.query(query, [userId]);
      logger.info('Updated last login', { userId });
    } catch (error) {
      logger.error('Error updating last login:', error);
      throw error;
    }
  }

  /**
   * Verify user's email
   */
  static async verifyEmail(userId: string): Promise<void> {
    const query = `
      UPDATE users
      SET is_verified = true
      WHERE id = $1
    `;

    try {
      await pool.query(query, [userId]);
      logger.info('Email verified', { userId });
    } catch (error) {
      logger.error('Error verifying email:', error);
      throw error;
    }
  }

  /**
   * Update user's password
   */
  static async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    const query = `
      UPDATE users
      SET password = $1, updated_at = NOW()
      WHERE id = $2
    `;

    try {
      await pool.query(query, [hashedPassword, userId]);
      logger.info('Password updated', { userId });
    } catch (error) {
      logger.error('Error updating password:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, data: { fullName?: string; companyName?: string }): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.fullName !== undefined) {
      updates.push(`full_name = $${paramIndex}`);
      values.push(data.fullName);
      paramIndex++;
    }

    if (data.companyName !== undefined) {
      updates.push(`company_name = $${paramIndex}`);
      values.push(data.companyName);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.findById(userId);
    }

    updates.push('updated_at = NOW()');
    values.push(userId);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, full_name, company_name, role, is_verified, created_at, updated_at
    `;

    try {
      const result = await pool.query(query, values);
      logger.info('Profile updated', { userId });
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating profile:', error);
      throw error;
    }
  }
}