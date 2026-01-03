/**
 * Analytics Repository
 * Data access for analytics queries
 */

import { pool } from '../../config/db';

export interface SpendingByMonth {
  month: string;
  totalAmount: number;
  invoiceCount: number;
}

export interface SpendingBySupplier {
  supplierId: string;
  supplierName: string;
  totalAmount: number;
  invoiceCount: number;
}

export interface InvoiceStatusSummary {
  status: string;
  count: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalAmount: number;
}

export interface DashboardSummary {
  totalInvoices: number;
  totalSpending: number;
  pendingInvoices: number;
  processedInvoices: number;
  averageConfidence: number;
}

export default class AnalyticsRepository {
  /**
   * Get spending by month for a user
   */
  static async getSpendingByMonth(
    userId: string,
    months: number = 12
  ): Promise<SpendingByMonth[]> {
    const query = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', invoice_date), 'YYYY-MM') as month,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COUNT(*) as invoice_count
      FROM invoices
      WHERE user_id = $1 
        AND invoice_date IS NOT NULL
        AND invoice_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '${months} months')
      GROUP BY DATE_TRUNC('month', invoice_date)
      ORDER BY month DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => ({
      month: row.month,
      totalAmount: parseFloat(row.total_amount) || 0,
      invoiceCount: parseInt(row.invoice_count, 10),
    }));
  }

  /**
   * Get spending by supplier for a user
   */
  static async getSpendingBySupplier(
    userId: string,
    limit: number = 10
  ): Promise<SpendingBySupplier[]> {
    const query = `
      SELECT 
        s.id as supplier_id,
        s.name as supplier_name,
        COALESCE(SUM(i.total_amount), 0) as total_amount,
        COUNT(i.id) as invoice_count
      FROM invoices i
      JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.user_id = $1 AND i.supplier_id IS NOT NULL
      GROUP BY s.id, s.name
      ORDER BY total_amount DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows.map(row => ({
      supplierId: row.supplier_id,
      supplierName: row.supplier_name,
      totalAmount: parseFloat(row.total_amount) || 0,
      invoiceCount: parseInt(row.invoice_count, 10),
    }));
  }

  /**
   * Get invoice status summary for a user
   */
  static async getInvoiceStatusSummary(userId: string): Promise<InvoiceStatusSummary[]> {
    const query = `
      SELECT status, COUNT(*) as count
      FROM invoices
      WHERE user_id = $1
      GROUP BY status
      ORDER BY count DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count, 10),
    }));
  }

  /**
   * Get top products by spending for a user
   */
  static async getTopProducts(
    userId: string,
    limit: number = 10
  ): Promise<TopProduct[]> {
    const query = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        COALESCE(SUM(il.quantity), 0) as total_quantity,
        COALESCE(SUM(il.total_price), 0) as total_amount
      FROM invoice_lines il
      JOIN invoices i ON il.invoice_id = i.id
      JOIN products p ON il.product_id = p.id
      WHERE i.user_id = $1 AND il.product_id IS NOT NULL
      GROUP BY p.id, p.name
      ORDER BY total_amount DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows.map(row => ({
      productId: row.product_id,
      productName: row.product_name,
      totalQuantity: parseFloat(row.total_quantity) || 0,
      totalAmount: parseFloat(row.total_amount) || 0,
    }));
  }

  /**
   * Get dashboard summary for a user
   */
  static async getDashboardSummary(userId: string): Promise<DashboardSummary> {
    const query = `
      SELECT 
        COUNT(*) as total_invoices,
        COALESCE(SUM(total_amount), 0) as total_spending,
        COUNT(*) FILTER (WHERE status IN ('PENDING', 'PROCESSING')) as pending_invoices,
        COUNT(*) FILTER (WHERE status IN ('PARSED', 'REVIEWED')) as processed_invoices,
        COALESCE(AVG(confidence_score), 0) as average_confidence
      FROM invoices
      WHERE user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    const row = result.rows[0];
    return {
      totalInvoices: parseInt(row.total_invoices, 10),
      totalSpending: parseFloat(row.total_spending) || 0,
      pendingInvoices: parseInt(row.pending_invoices, 10),
      processedInvoices: parseInt(row.processed_invoices, 10),
      averageConfidence: parseFloat(row.average_confidence) || 0,
    };
  }
}

