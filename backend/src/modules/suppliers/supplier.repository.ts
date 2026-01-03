/**
 * Supplier Repository
 * Data access layer for suppliers table
 */

import { pool } from '../../config/db';
import { logger } from '../../utils/logger';

export interface Supplier {
  id: string;
  name: string;
  normalized_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSupplierData {
  name: string;
  normalizedName: string;
  contactEmail?: string;
  contactPhone?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateSupplierData {
  name?: string;
  normalizedName?: string;
  contactEmail?: string;
  contactPhone?: string;
  metadata?: Record<string, unknown>;
}

export interface SupplierListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
}

export default class SupplierRepository {
  /**
   * Create a new supplier
   */
  static async create(data: CreateSupplierData): Promise<Supplier> {
    const query = `
      INSERT INTO suppliers (name, normalized_name, contact_email, contact_phone, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      data.name,
      data.normalizedName,
      data.contactEmail || null,
      data.contactPhone || null,
      data.metadata || {},
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating supplier:', error);
      throw error;
    }
  }

  /**
   * Find supplier by ID
   */
  static async findById(id: string): Promise<Supplier | null> {
    const query = `SELECT * FROM suppliers WHERE id = $1`;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding supplier by ID:', error);
      throw error;
    }
  }

  /**
   * Find supplier by normalized name
   */
  static async findByNormalizedName(normalizedName: string): Promise<Supplier | null> {
    const query = `SELECT * FROM suppliers WHERE normalized_name = $1`;

    try {
      const result = await pool.query(query, [normalizedName]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding supplier by normalized name:', error);
      throw error;
    }
  }

  /**
   * Find all suppliers with optional filters
   */
  static async findAll(params: SupplierListParams = {}): Promise<{ suppliers: Supplier[]; total: number }> {
    const { page = 1, limit = 50, search, sortBy = 'name', sortOrder = 'ASC' } = params;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(name ILIKE $${paramIndex} OR normalized_name ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column
    const validSortColumns = ['name', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name';
    const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';

    const countQuery = `SELECT COUNT(*) FROM suppliers ${whereClause}`;
    const dataQuery = `
      SELECT * FROM suppliers 
      ${whereClause}
      ORDER BY ${sortColumn} ${order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    try {
      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, values),
        pool.query(dataQuery, [...values, limit, offset]),
      ]);

      return {
        suppliers: dataResult.rows,
        total: parseInt(countResult.rows[0].count, 10),
      };
    } catch (error) {
      logger.error('Error finding suppliers:', error);
      throw error;
    }
  }

  /**
   * Update a supplier
   */
  static async update(id: string, data: UpdateSupplierData): Promise<Supplier | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.normalizedName !== undefined) {
      updates.push(`normalized_name = $${paramIndex++}`);
      values.push(data.normalizedName);
    }
    if (data.contactEmail !== undefined) {
      updates.push(`contact_email = $${paramIndex++}`);
      values.push(data.contactEmail);
    }
    if (data.contactPhone !== undefined) {
      updates.push(`contact_phone = $${paramIndex++}`);
      values.push(data.contactPhone);
    }
    if (data.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      values.push(data.metadata);
    }

    if (updates.length === 0) return this.findById(id);

    values.push(id);
    const query = `
      UPDATE suppliers
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating supplier:', error);
      throw error;
    }
  }

  /**
   * Delete a supplier
   */
  static async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM suppliers WHERE id = $1`;

    try {
      const result = await pool.query(query, [id]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      logger.error('Error deleting supplier:', error);
      throw error;
    }
  }

  /**
   * Search suppliers by name
   */
  static async searchByName(searchTerm: string, limit: number = 10): Promise<Supplier[]> {
    const query = `
      SELECT * FROM suppliers
      WHERE name ILIKE $1 OR normalized_name ILIKE $1
      ORDER BY
        CASE WHEN normalized_name = $2 THEN 0 ELSE 1 END,
        name
      LIMIT $3
    `;

    try {
      const result = await pool.query(query, [`%${searchTerm}%`, searchTerm.toLowerCase(), limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error searching suppliers:', error);
      throw error;
    }
  }
}

