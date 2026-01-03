/**
 * Invoice status values matching backend enum
 */
export type InvoiceStatus = 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'PARSED' 
  | 'NEEDS_REVIEW' 
  | 'REVIEWED' 
  | 'FAILED';

/**
 * Invoice entity matching backend response
 */
export interface Invoice {
  id: string;
  userId: string;
  supplierId: string | null;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: string;
  invoiceDate: string | null;
  invoiceNumber: string | null;
  status: InvoiceStatus;
  totalAmount: string | null;
  currency: string;
  confidenceScore: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  productId: string | null;
  description: string | null;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  rawText: string | null;
  confidenceScore: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Invoice with line items (detailed view)
 */
export interface InvoiceWithLines extends Invoice {
  lineItems: InvoiceLineItem[];
}

/**
 * Pagination info from API
 */
export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Paginated invoice list response
 */
export interface InvoiceListResponse {
  data: Invoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Invoice stats (status counts)
 */
export interface InvoiceStats {
  PENDING: number;
  PROCESSING: number;
  PARSED: number;
  NEEDS_REVIEW: number;
  REVIEWED: number;
  FAILED: number;
}

/**
 * Query parameters for listing invoices
 */
export interface InvoiceListParams {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  startDate?: string;
  endDate?: string;
  sortBy?: 'created_at' | 'invoice_date' | 'total_amount';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Update invoice request body
 */
export interface UpdateInvoiceData {
  supplierId?: string;
  invoiceDate?: string;
  invoiceNumber?: string;
  status?: InvoiceStatus;
  totalAmount?: number;
  currency?: string;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: {
    message: string;
    statusCode: number;
  };
}

/**
 * Status display configuration
 */
export const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  PROCESSING: { label: 'Processing', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  PARSED: { label: 'Parsed', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  NEEDS_REVIEW: { label: 'Needs Review', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  REVIEWED: { label: 'Reviewed', color: 'text-green-700', bgColor: 'bg-green-100' },
  FAILED: { label: 'Failed', color: 'text-red-700', bgColor: 'bg-red-100' },
};

