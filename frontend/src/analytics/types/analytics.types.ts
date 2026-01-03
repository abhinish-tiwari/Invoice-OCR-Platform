/**
 * Analytics Types
 * TypeScript types for analytics data
 */

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

export interface AnalyticsDashboard {
  summary: DashboardSummary;
  spendingByMonth: SpendingByMonth[];
  spendingBySupplier: SpendingBySupplier[];
  statusSummary: InvoiceStatusSummary[];
  topProducts: TopProduct[];
}

export interface AnalyticsApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

