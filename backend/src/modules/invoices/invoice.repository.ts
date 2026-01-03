import { pool } from '../../config/db';
import { logger } from '../../utils/logger';

// Invoice status enum
export type InvoiceStatus = 'PENDING' | 'PROCESSING' | 'PARSED' | 'NEEDS_REVIEW' | 'REVIEWED' | 'FAILED';

// Invoice interface matching database schema
export interface Invoice {
  id: string;
  user_id: string;
  supplier_id: string | null;
  file_url: string;
  file_type: string;
  file_size_bytes: number | null;
  thumbnail_url: string | null;
  invoice_date: Date | null;
  invoice_number: string | null;
  status: InvoiceStatus;
  total_amount: number | null;
  currency: string;
  confidence_score: number | null;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Data for creating a new invoice
export interface CreateInvoiceData {
  userId: string;
  fileUrl: string;
  fileType: string;
  fileSizeBytes?: number;
  originalFilename?: string;
}

// Data for updating an invoice
export interface UpdateInvoiceData {
  supplierId?: string;
  invoiceDate?: Date;
  invoiceNumber?: string;
  status?: InvoiceStatus;
  totalAmount?: number;
  currency?: string;
  confidenceScore?: number;
  reviewedBy?: string;
  reviewedAt?: Date;
}

// Pagination and filtering options
export interface InvoiceListOptions {
  userId: string;
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'created_at' | 'invoice_date' | 'total_amount';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default class InvoiceRepository {
  /**
   * Create a new invoice record
   */
  static async create(data: CreateInvoiceData): Promise<Invoice> {
    const query = `
      INSERT INTO invoices (user_id, file_url, file_type, file_size_bytes, status)
      VALUES ($1, $2, $3, $4, 'PENDING')
      RETURNING *
    `;

    const values = [
      data.userId,
      data.fileUrl,
      data.fileType,
      data.fileSizeBytes || null,
    ];

    try {
      const result = await pool.query(query, values);
      logger.info('Invoice created successfully', { invoiceId: result.rows[0].id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Find invoice by ID
   */
  static async findById(id: string): Promise<Invoice | null> {
    const query = `SELECT * FROM invoices WHERE id = $1`;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding invoice by ID:', error);
      throw error;
    }
  }

  /**
   * Find invoice by ID and user (for authorization)
   */
  static async findByIdAndUser(id: string, userId: string): Promise<Invoice | null> {
    const query = `SELECT * FROM invoices WHERE id = $1 AND user_id = $2`;

    try {
      const result = await pool.query(query, [id, userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding invoice by ID and user:', error);
      throw error;
    }
  }

  /**
   * Find all invoices for a user with pagination and filtering
   */
  static async findByUser(options: InvoiceListOptions): Promise<PaginatedResult<Invoice>> {
    const {
      userId,
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const conditions: string[] = ['user_id = $1'];
    const values: any[] = [userId];
    let paramIndex = 2;

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`created_at >= $${paramIndex}`);
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`created_at <= $${paramIndex}`);
      values.push(endDate);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const allowedSortColumns = ['created_at', 'invoice_date', 'total_amount'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Continued in next part...
    const countQuery = `SELECT COUNT(*) FROM invoices WHERE ${whereClause}`;
    const dataQuery = `
      SELECT * FROM invoices 
      WHERE ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    try {
      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, values),
        pool.query(dataQuery, [...values, limit, offset]),
      ]);

      const total = parseInt(countResult.rows[0].count, 10);

      return {
        data: dataResult.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error finding invoices by user:', error);
      throw error;
    }
  }

  /**
   * Update an invoice
   */
  static async update(id: string, data: UpdateInvoiceData): Promise<Invoice | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.supplierId !== undefined) {
      updates.push(`supplier_id = $${paramIndex++}`);
      values.push(data.supplierId);
    }
    if (data.invoiceDate !== undefined) {
      updates.push(`invoice_date = $${paramIndex++}`);
      values.push(data.invoiceDate);
    }
    if (data.invoiceNumber !== undefined) {
      updates.push(`invoice_number = $${paramIndex++}`);
      values.push(data.invoiceNumber);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.totalAmount !== undefined) {
      updates.push(`total_amount = $${paramIndex++}`);
      values.push(data.totalAmount);
    }
    if (data.currency !== undefined) {
      updates.push(`currency = $${paramIndex++}`);
      values.push(data.currency);
    }
    if (data.confidenceScore !== undefined) {
      updates.push(`confidence_score = $${paramIndex++}`);
      values.push(data.confidenceScore);
    }
    if (data.reviewedBy !== undefined) {
      updates.push(`reviewed_by = $${paramIndex++}`);
      values.push(data.reviewedBy);
    }
    if (data.reviewedAt !== undefined) {
      updates.push(`reviewed_at = $${paramIndex++}`);
      values.push(data.reviewedAt);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE invoices
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      if (result.rows[0]) {
        logger.info('Invoice updated successfully', { invoiceId: id });
      }
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating invoice:', error);
      throw error;
    }
  }

  /**
   * Update invoice status
   */
  static async updateStatus(id: string, status: InvoiceStatus): Promise<Invoice | null> {
    return this.update(id, { status });
  }

  /**
   * Delete an invoice
   */
  static async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM invoices WHERE id = $1 RETURNING id`;

    try {
      const result = await pool.query(query, [id]);
      const deleted = result.rowCount !== null && result.rowCount > 0;
      if (deleted) {
        logger.info('Invoice deleted successfully', { invoiceId: id });
      }
      return deleted;
    } catch (error) {
      logger.error('Error deleting invoice:', error);
      throw error;
    }
  }

  /**
   * Get invoice counts by status for a user
   */
  static async getStatusCounts(userId: string): Promise<Record<InvoiceStatus, number>> {
    const query = `
      SELECT status, COUNT(*) as count
      FROM invoices
      WHERE user_id = $1
      GROUP BY status
    `;

    try {
      const result = await pool.query(query, [userId]);
      const counts: Record<string, number> = {
        PENDING: 0,
        PROCESSING: 0,
        PARSED: 0,
        NEEDS_REVIEW: 0,
        REVIEWED: 0,
        FAILED: 0,
      };

      result.rows.forEach((row) => {
        counts[row.status] = parseInt(row.count, 10);
      });

      return counts as Record<InvoiceStatus, number>;
    } catch (error) {
      logger.error('Error getting status counts:', error);
      throw error;
    }
  }
}

