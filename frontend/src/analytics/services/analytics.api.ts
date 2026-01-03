/**
 * Analytics API Service
 * API calls for analytics endpoints
 */

import httpClient from '../../common/utils/HttpClients';
import {
  AnalyticsDashboard,
  SpendingByMonth,
  SpendingBySupplier,
  InvoiceStatusSummary,
  TopProduct,
  DashboardSummary,
  AnalyticsApiResponse,
} from '../types/analytics.types';

const ANALYTICS_BASE_URL = '/analytics';

/**
 * Get complete dashboard analytics
 */
export async function getDashboard(): Promise<AnalyticsDashboard> {
  const response = await httpClient.get<AnalyticsApiResponse<AnalyticsDashboard>>(
    `${ANALYTICS_BASE_URL}/dashboard`
  );
  return response.data.data;
}

/**
 * Get dashboard summary
 */
export async function getSummary(): Promise<DashboardSummary> {
  const response = await httpClient.get<AnalyticsApiResponse<DashboardSummary>>(
    `${ANALYTICS_BASE_URL}/summary`
  );
  return response.data.data;
}

/**
 * Get spending trends by month
 */
export async function getSpendingTrends(months: number = 12): Promise<SpendingByMonth[]> {
  const response = await httpClient.get<AnalyticsApiResponse<SpendingByMonth[]>>(
    `${ANALYTICS_BASE_URL}/spending-trends`,
    { params: { months } }
  );
  return response.data.data;
}

/**
 * Get spending breakdown by supplier
 */
export async function getSupplierBreakdown(limit: number = 10): Promise<SpendingBySupplier[]> {
  const response = await httpClient.get<AnalyticsApiResponse<SpendingBySupplier[]>>(
    `${ANALYTICS_BASE_URL}/supplier-breakdown`,
    { params: { limit } }
  );
  return response.data.data;
}

/**
 * Get invoice status distribution
 */
export async function getStatusDistribution(): Promise<InvoiceStatusSummary[]> {
  const response = await httpClient.get<AnalyticsApiResponse<InvoiceStatusSummary[]>>(
    `${ANALYTICS_BASE_URL}/status-distribution`
  );
  return response.data.data;
}

/**
 * Get top products by spending
 */
export async function getTopProducts(limit: number = 10): Promise<TopProduct[]> {
  const response = await httpClient.get<AnalyticsApiResponse<TopProduct[]>>(
    `${ANALYTICS_BASE_URL}/top-products`,
    { params: { limit } }
  );
  return response.data.data;
}

export const analyticsApi = {
  getDashboard,
  getSummary,
  getSpendingTrends,
  getSupplierBreakdown,
  getStatusDistribution,
  getTopProducts,
};

export default analyticsApi;

