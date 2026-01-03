/**
 * Analytics Service
 * Business logic for analytics operations
 */

import AnalyticsRepository, {
  SpendingByMonth,
  SpendingBySupplier,
  InvoiceStatusSummary,
  TopProduct,
  DashboardSummary,
} from './analytics.repository';
import { logger } from '../../utils/logger';

export interface AnalyticsDashboard {
  summary: DashboardSummary;
  spendingByMonth: SpendingByMonth[];
  spendingBySupplier: SpendingBySupplier[];
  statusSummary: InvoiceStatusSummary[];
  topProducts: TopProduct[];
}

export default class AnalyticsService {
  /**
   * Get complete dashboard analytics for a user
   */
  static async getDashboard(userId: string): Promise<AnalyticsDashboard> {
    logger.info('Fetching dashboard analytics', { userId });

    const [summary, spendingByMonth, spendingBySupplier, statusSummary, topProducts] =
      await Promise.all([
        AnalyticsRepository.getDashboardSummary(userId),
        AnalyticsRepository.getSpendingByMonth(userId, 12),
        AnalyticsRepository.getSpendingBySupplier(userId, 10),
        AnalyticsRepository.getInvoiceStatusSummary(userId),
        AnalyticsRepository.getTopProducts(userId, 10),
      ]);

    return {
      summary,
      spendingByMonth,
      spendingBySupplier,
      statusSummary,
      topProducts,
    };
  }

  /**
   * Get spending trends by month
   */
  static async getSpendingTrends(
    userId: string,
    months: number = 12
  ): Promise<SpendingByMonth[]> {
    logger.info('Fetching spending trends', { userId, months });
    return AnalyticsRepository.getSpendingByMonth(userId, months);
  }

  /**
   * Get spending breakdown by supplier
   */
  static async getSupplierBreakdown(
    userId: string,
    limit: number = 10
  ): Promise<SpendingBySupplier[]> {
    logger.info('Fetching supplier breakdown', { userId, limit });
    return AnalyticsRepository.getSpendingBySupplier(userId, limit);
  }

  /**
   * Get invoice status distribution
   */
  static async getStatusDistribution(userId: string): Promise<InvoiceStatusSummary[]> {
    logger.info('Fetching status distribution', { userId });
    return AnalyticsRepository.getInvoiceStatusSummary(userId);
  }

  /**
   * Get top products by spending
   */
  static async getTopProducts(
    userId: string,
    limit: number = 10
  ): Promise<TopProduct[]> {
    logger.info('Fetching top products', { userId, limit });
    return AnalyticsRepository.getTopProducts(userId, limit);
  }

  /**
   * Get dashboard summary
   */
  static async getSummary(userId: string): Promise<DashboardSummary> {
    logger.info('Fetching dashboard summary', { userId });
    return AnalyticsRepository.getDashboardSummary(userId);
  }
}

