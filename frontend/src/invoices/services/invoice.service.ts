import { ApiService } from '../../common/services/api.service';
import type {
  Invoice,
  InvoiceListResponse,
  InvoiceListParams,
  InvoiceStats,
  UpdateInvoiceData,
  ApiResponse,
} from '../types/invoice.types';

const ENDPOINTS = {
  LIST: '/invoices',
  UPLOAD: '/invoices/upload',
  STATS: '/invoices/stats',
  EXPORT: '/invoices/export',
  DETAIL: (id: string) => `/invoices/${id}`,
  LINES: (id: string) => `/invoices/${id}/lines`,
  LINE_DETAIL: (invoiceId: string, lineId: string) => `/invoices/${invoiceId}/lines/${lineId}`,
  REVIEW: (id: string) => `/invoices/${id}/review`,
  OCR_PROCESS: (id: string) => `/ocr/process/${id}`,
  OCR_STATUS: (id: string) => `/ocr/status/${id}`,
};

/**
 * Invoice API Service
 * Handles all invoice-related API calls
 */
export class InvoiceService {
  /**
   * Get paginated list of invoices with optional filters
   */
  static async getInvoices(params?: InvoiceListParams): Promise<ApiResponse<InvoiceListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const query = queryParams.toString();
    const url = query ? `${ENDPOINTS.LIST}?${query}` : ENDPOINTS.LIST;
    
    return ApiService.get<ApiResponse<InvoiceListResponse>>(url);
  }

  /**
   * Get invoice status counts for dashboard
   */
  static async getStats(): Promise<ApiResponse<{ counts: InvoiceStats }>> {
    return ApiService.get<ApiResponse<{ counts: InvoiceStats }>>(ENDPOINTS.STATS);
  }

  /**
   * Get a single invoice by ID
   */
  static async getInvoiceById(id: string): Promise<ApiResponse<{ invoice: Invoice }>> {
    return ApiService.get<ApiResponse<{ invoice: Invoice }>>(ENDPOINTS.DETAIL(id));
  }

  /**
   * Upload a new invoice file
   * @param file - The invoice file to upload
   * @param processOcr - Whether to trigger OCR processing after upload
   * @param onProgress - Progress callback
   */
  static async uploadInvoice(
    file: File,
    processOcr: boolean = false,
    onProgress?: (percent: number) => void
  ): Promise<ApiResponse<{ invoice: Invoice; ocrProcessing?: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    const url = processOcr ? `${ENDPOINTS.UPLOAD}?processOcr=true` : ENDPOINTS.UPLOAD;

    return ApiService.post<ApiResponse<{ invoice: Invoice; ocrProcessing?: string }>>(
      url,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      }
    );
  }

  /**
   * Update an invoice
   */
  static async updateInvoice(
    id: string,
    data: UpdateInvoiceData
  ): Promise<ApiResponse<{ invoice: Invoice }>> {
    return ApiService.put<ApiResponse<{ invoice: Invoice }>>(ENDPOINTS.DETAIL(id), data);
  }

  /**
   * Delete an invoice
   */
  static async deleteInvoice(id: string): Promise<ApiResponse<null>> {
    return ApiService.delete<ApiResponse<null>>(ENDPOINTS.DETAIL(id));
  }

  /**
   * Get line items for an invoice
   */
  static async getInvoiceLines(id: string): Promise<ApiResponse<{ lines: InvoiceLine[] }>> {
    return ApiService.get<ApiResponse<{ lines: InvoiceLine[] }>>(ENDPOINTS.LINES(id));
  }

  /**
   * Trigger OCR processing for an invoice
   */
  static async processOcr(id: string): Promise<ApiResponse<OcrProcessResult>> {
    return ApiService.post<ApiResponse<OcrProcessResult>>(ENDPOINTS.OCR_PROCESS(id), {});
  }

  /**
   * Get OCR processing status for an invoice
   */
  static async getOcrStatus(id: string): Promise<ApiResponse<OcrStatus>> {
    return ApiService.get<ApiResponse<OcrStatus>>(ENDPOINTS.OCR_STATUS(id));
  }

  /**
   * Update a line item
   */
  static async updateLineItem(
    invoiceId: string,
    lineId: string,
    data: UpdateLineItemData
  ): Promise<ApiResponse<{ line: InvoiceLine }>> {
    return ApiService.put<ApiResponse<{ line: InvoiceLine }>>(
      ENDPOINTS.LINE_DETAIL(invoiceId, lineId),
      data
    );
  }

  /**
   * Mark invoice as reviewed
   */
  static async markReviewed(id: string): Promise<ApiResponse<{ invoice: Invoice }>> {
    return ApiService.post<ApiResponse<{ invoice: Invoice }>>(ENDPOINTS.REVIEW(id), {});
  }

  /**
   * Export invoices to CSV, Excel, or PDF
   * @param format - Export format: 'csv', 'excel', or 'pdf'
   * @param invoiceIds - Optional array of invoice IDs to export
   */
  static async exportInvoices(
    format: 'csv' | 'excel' | 'pdf',
    invoiceIds?: string[]
  ): Promise<Blob> {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    if (invoiceIds && invoiceIds.length > 0) {
      queryParams.append('ids', invoiceIds.join(','));
    }

    const url = `${ENDPOINTS.EXPORT}?${queryParams.toString()}`;
    const response = await ApiService.getBlob(url);
    return response;
  }
}

// Update line item data
export interface UpdateLineItemData {
  normalizedDescription?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  needsReview?: boolean;
  reviewed?: boolean;
  confidenceScore?: number;
}

// OCR-related types
export interface InvoiceLine {
  id: string;
  invoice_id: string;
  line_number: number;
  raw_description: string;
  normalized_description: string | null;
  quantity: number | null;
  unit_price: number | null;
  line_total: number | null;
  confidence_score: number | null;
  needs_review: boolean;
  reviewed?: boolean;
}

export interface OcrProcessResult {
  invoiceId: string;
  status: string;
  confidence?: number;
  lineItemsCreated?: number;
  needsReview?: boolean;
  processingTimeMs?: number;
}

export interface OcrStatus {
  invoiceId: string;
  status: string;
  confidenceScore: number | null;
  updatedAt: string;
}

export default InvoiceService;
