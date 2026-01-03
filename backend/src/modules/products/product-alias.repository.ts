/**
 * Product Alias Repository
 * Data access layer for product_aliases table
 * Stores learned mappings from invoice text to products
 */

import { pool } from '../../config/db';
import { logger } from '../../utils/logger';

export interface ProductAlias {
  id: string;
  product_id: string;
  raw_text: string;
  normalized_text: string;
  match_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAliasData {
  productId: string;
  rawText: string;
  normalizedText: string;
}

export default class ProductAliasRepository {
  /**
   * Create a new alias
   */
  static async create(data: CreateAliasData): Promise<ProductAlias> {
    const query = `
      INSERT INTO product_aliases (product_id, raw_text, normalized_text)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [data.productId, data.rawText, data.normalizedText]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating product alias:', error);
      throw error;
    }
  }

  /**
   * Find alias by normalized text
   */
  static async findByNormalizedText(normalizedText: string): Promise<ProductAlias | null> {
    const query = `SELECT * FROM product_aliases WHERE normalized_text = $1`;

    try {
      const result = await pool.query(query, [normalizedText]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding alias by normalized text:', error);
      throw error;
    }
  }

  /**
   * Find alias by raw text
   */
  static async findByRawText(rawText: string): Promise<ProductAlias | null> {
    const query = `SELECT * FROM product_aliases WHERE raw_text = $1`;

    try {
      const result = await pool.query(query, [rawText]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding alias by raw text:', error);
      throw error;
    }
  }

  /**
   * Find all aliases for a product
   */
  static async findByProductId(productId: string): Promise<ProductAlias[]> {
    const query = `SELECT * FROM product_aliases WHERE product_id = $1 ORDER BY match_count DESC`;

    try {
      const result = await pool.query(query, [productId]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding aliases by product ID:', error);
      throw error;
    }
  }

  /**
   * Increment match count for an alias
   */
  static async incrementMatchCount(id: string): Promise<void> {
    const query = `UPDATE product_aliases SET match_count = match_count + 1 WHERE id = $1`;

    try {
      await pool.query(query, [id]);
    } catch (error) {
      logger.error('Error incrementing alias match count:', error);
      throw error;
    }
  }

  /**
   * Delete an alias
   */
  static async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM product_aliases WHERE id = $1`;

    try {
      const result = await pool.query(query, [id]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      logger.error('Error deleting product alias:', error);
      throw error;
    }
  }

  /**
   * Find or create alias
   */
  static async findOrCreate(data: CreateAliasData): Promise<{ alias: ProductAlias; created: boolean }> {
    // Try to find existing
    const existing = await this.findByRawText(data.rawText);
    if (existing) {
      // Update match count
      await this.incrementMatchCount(existing.id);
      return { alias: existing, created: false };
    }

    // Create new
    const alias = await this.create(data);
    return { alias, created: true };
  }
}

