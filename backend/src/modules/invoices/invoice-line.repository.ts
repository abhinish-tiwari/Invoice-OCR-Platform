/**
 * Invoice Line Repository
 * Data access layer for invoice_lines table
 */

import { pool } from '../../config/db';
import { logger } from '../../utils/logger';

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  product_id: string | null;
  line_number: number;
  raw_description: string;
  normalized_description: string | null;
  pack_size: string | null;
  quantity: number | null;
  unit_price: number | null;
  line_total: number | null;
  confidence_score: number | null;
  needs_review: boolean;
  reviewed: boolean;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateInvoiceLineData {
  invoiceId: string;
  lineNumber: number;
  rawDescription: string;
  normalizedDescription?: string;
  packSize?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  confidenceScore?: number;
  needsReview?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateInvoiceLineData {
  productId?: string;
  normalizedDescription?: string;
  packSize?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  confidenceScore?: number;
  needsReview?: boolean;
  reviewed?: boolean;
  metadata?: Record<string, unknown>;
}

export default class InvoiceLineRepository {
  /**
   * Create a single invoice line
   */
  static async create(data: CreateInvoiceLineData): Promise<InvoiceLine> {
    const query = `
      INSERT INTO invoice_lines (
        invoice_id, line_number, raw_description, normalized_description,
        pack_size, quantity, unit_price, line_total, confidence_score,
        needs_review, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      data.invoiceId,
      data.lineNumber,
      data.rawDescription,
      data.normalizedDescription || null,
      data.packSize || null,
      data.quantity || null,
      data.unitPrice || null,
      data.lineTotal || null,
      data.confidenceScore || null,
      data.needsReview ?? false,
      data.metadata || {},
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating invoice line:', error);
      throw error;
    }
  }

  /**
   * Bulk create invoice lines
   */
  static async createBulk(lines: CreateInvoiceLineData[]): Promise<InvoiceLine[]> {
    if (lines.length === 0) return [];

    const values: any[] = [];
    const valuePlaceholders: string[] = [];

    lines.forEach((line, index) => {
      const offset = index * 11;
      valuePlaceholders.push(`(
        $${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4},
        $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8},
        $${offset + 9}, $${offset + 10}, $${offset + 11}
      )`);
      values.push(
        line.invoiceId,
        line.lineNumber,
        line.rawDescription,
        line.normalizedDescription || null,
        line.packSize || null,
        line.quantity || null,
        line.unitPrice || null,
        line.lineTotal || null,
        line.confidenceScore || null,
        line.needsReview ?? false,
        line.metadata || {}
      );
    });

    const query = `
      INSERT INTO invoice_lines (
        invoice_id, line_number, raw_description, normalized_description,
        pack_size, quantity, unit_price, line_total, confidence_score,
        needs_review, metadata
      )
      VALUES ${valuePlaceholders.join(', ')}
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      logger.info('Bulk created invoice lines', { count: result.rows.length });
      return result.rows;
    } catch (error) {
      logger.error('Error bulk creating invoice lines:', error);
      throw error;
    }
  }

  /**
   * Find all lines for an invoice
   */
  static async findByInvoiceId(invoiceId: string): Promise<InvoiceLine[]> {
    const query = `
      SELECT * FROM invoice_lines
      WHERE invoice_id = $1
      ORDER BY line_number ASC
    `;

    try {
      logger.info('Finding invoice lines', { invoiceId });
      const result = await pool.query(query, [invoiceId]);
      logger.info('Found invoice lines', { invoiceId, count: result.rows.length });
      return result.rows;
    } catch (error) {
      logger.error('Error finding invoice lines:', error);
      throw error;
    }
  }

  /**
   * Find a single line by ID
   */
  static async findById(id: string): Promise<InvoiceLine | null> {
    const query = `SELECT * FROM invoice_lines WHERE id = $1`;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding invoice line by ID:', error);
      throw error;
    }
  }

  /**
   * Update an invoice line
   */
  static async update(id: string, data: UpdateInvoiceLineData): Promise<InvoiceLine | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.productId !== undefined) {
      updates.push(`product_id = $${paramIndex++}`);
      values.push(data.productId);
    }
    if (data.normalizedDescription !== undefined) {
      updates.push(`normalized_description = $${paramIndex++}`);
      values.push(data.normalizedDescription);
    }
    if (data.packSize !== undefined) {
      updates.push(`pack_size = $${paramIndex++}`);
      values.push(data.packSize);
    }
    if (data.quantity !== undefined) {
      updates.push(`quantity = $${paramIndex++}`);
      values.push(data.quantity);
    }
    if (data.unitPrice !== undefined) {
      updates.push(`unit_price = $${paramIndex++}`);
      values.push(data.unitPrice);
    }
    if (data.lineTotal !== undefined) {
      updates.push(`line_total = $${paramIndex++}`);
      values.push(data.lineTotal);
    }
    if (data.confidenceScore !== undefined) {
      updates.push(`confidence_score = $${paramIndex++}`);
      values.push(data.confidenceScore);
    }
    if (data.needsReview !== undefined) {
      updates.push(`needs_review = $${paramIndex++}`);
      values.push(data.needsReview);
    }
    if (data.reviewed !== undefined) {
      updates.push(`reviewed = $${paramIndex++}`);
      values.push(data.reviewed);
    }
    if (data.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      values.push(data.metadata);
    }

    if (updates.length === 0) return this.findById(id);

    values.push(id);
    const query = `
      UPDATE invoice_lines
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating invoice line:', error);
      throw error;
    }
  }

  /**
   * Delete all lines for an invoice
   */
  static async deleteByInvoiceId(invoiceId: string): Promise<number> {
    const query = `DELETE FROM invoice_lines WHERE invoice_id = $1`;

    try {
      const result = await pool.query(query, [invoiceId]);
      return result.rowCount || 0;
    } catch (error) {
      logger.error('Error deleting invoice lines:', error);
      throw error;
    }
  }

  /**
   * Find lines needing review for an invoice
   */
  static async findNeedingReview(invoiceId: string): Promise<InvoiceLine[]> {
    const query = `
      SELECT * FROM invoice_lines
      WHERE invoice_id = $1 AND needs_review = true
      ORDER BY line_number ASC
    `;

    try {
      const result = await pool.query(query, [invoiceId]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding lines needing review:', error);
      throw error;
    }
  }

  /**
   * Count lines for an invoice
   */
  static async countByInvoiceId(invoiceId: string): Promise<number> {
    const query = `SELECT COUNT(*) FROM invoice_lines WHERE invoice_id = $1`;

    try {
      const result = await pool.query(query, [invoiceId]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error counting invoice lines:', error);
      throw error;
    }
  }
}
