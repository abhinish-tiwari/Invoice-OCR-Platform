import { pool } from '../../config/db';
import { logger } from '../../utils/logger';

export interface User {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company?: string;
  role: string;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
}

export default class AuthRepository {
  
  static async createUser(userData: CreateUserData): Promise<User> {
    const query = `
      INSERT INTO users (email, password, first_name, last_name, company, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, first_name, last_name, company, role, is_verified, created_at, updated_at
    `;

    const values = [
      userData.email,
      userData.password,
      userData.firstName,
      userData.lastName,
      userData.company || null,
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
      SELECT id, email, password, first_name, last_name, company, role, is_verified, created_at, updated_at
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
      SELECT id, email, password, first_name, last_name, company, role, is_verified, created_at, updated_at
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
}