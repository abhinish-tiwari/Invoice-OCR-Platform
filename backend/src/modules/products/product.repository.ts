/**
 * Product Repository
 * Data access layer for products table
 */

import { pool } from '../../config/db';
import { logger } from '../../utils/logger';

export interface Product {
  id: string;
  name: string;
  normalized_name: string;
  pack_size: string | null;
  category: string | null;
  unit: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProductData {
  name: string;
  normalizedName: string;
  packSize?: string;
  category?: string;
  unit?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateProductData {
  name?: string;
  normalizedName?: string;
  packSize?: string;
  category?: string;
  unit?: string;
  metadata?: Record<string, unknown>;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sortBy?: 'name' | 'category' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
}

export default class ProductRepository {
  /**
   * Create a new product
   */
  static async create(data: CreateProductData): Promise<Product> {
    const query = `
      INSERT INTO products (name, normalized_name, pack_size, category, unit, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      data.name,
      data.normalizedName,
      data.packSize || null,
      data.category || null,
      data.unit || null,
      data.metadata || {},
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Find product by ID
   */
  static async findById(id: string): Promise<Product | null> {
    const query = `SELECT * FROM products WHERE id = $1`;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding product by ID:', error);
      throw error;
    }
  }

  /**
   * Find product by normalized name
   */
  static async findByNormalizedName(normalizedName: string): Promise<Product | null> {
    const query = `SELECT * FROM products WHERE normalized_name = $1`;

    try {
      const result = await pool.query(query, [normalizedName]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding product by normalized name:', error);
      throw error;
    }
  }

  /**
   * Find all products with optional filters
   */
  static async findAll(params: ProductListParams = {}): Promise<{ products: Product[]; total: number }> {
    const { page = 1, limit = 50, category, search, sortBy = 'name', sortOrder = 'ASC' } = params;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (category) {
      conditions.push(`category = $${paramIndex++}`);
      values.push(category);
    }

    if (search) {
      conditions.push(`(name ILIKE $${paramIndex} OR normalized_name ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column
    const validSortColumns = ['name', 'category', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name';
    const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';

    const countQuery = `SELECT COUNT(*) FROM products ${whereClause}`;
    const dataQuery = `
      SELECT * FROM products 
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
        products: dataResult.rows,
        total: parseInt(countResult.rows[0].count, 10),
      };
    } catch (error) {
      logger.error('Error finding products:', error);
      throw error;
    }
  }

  /**
   * Update a product
   */
  static async update(id: string, data: UpdateProductData): Promise<Product | null> {
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
    if (data.packSize !== undefined) {
      updates.push(`pack_size = $${paramIndex++}`);
      values.push(data.packSize);
    }
    if (data.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(data.category);
    }
    if (data.unit !== undefined) {
      updates.push(`unit = $${paramIndex++}`);
      values.push(data.unit);
    }
    if (data.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      values.push(data.metadata);
    }

    if (updates.length === 0) return this.findById(id);

    values.push(id);
    const query = `
      UPDATE products
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating product:', error);
      throw error;
    }
  }

  /**
   * Delete a product
   */
  static async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM products WHERE id = $1`;

    try {
      const result = await pool.query(query, [id]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      logger.error('Error deleting product:', error);
      throw error;
    }
  }

  /**
   * Get all categories
   */
  static async getCategories(): Promise<string[]> {
    const query = `SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category`;

    try {
      const result = await pool.query(query);
      return result.rows.map(row => row.category);
    } catch (error) {
      logger.error('Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Search products by name (for fuzzy matching)
   */
  static async searchByName(searchTerm: string, limit: number = 10): Promise<Product[]> {
    const query = `
      SELECT * FROM products
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
      logger.error('Error searching products:', error);
      throw error;
    }
  }
}

