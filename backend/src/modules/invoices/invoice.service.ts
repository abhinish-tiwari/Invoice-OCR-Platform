import InvoiceRepository, {
  Invoice,
  CreateInvoiceData,
  UpdateInvoiceData,
  InvoiceListOptions,
  PaginatedResult,
  InvoiceStatus,
} from './invoice.repository';
import { NotFoundError } from '../../middleware/error.middleware';
import MESSAGES from '../../constants/messages';
import { logger } from '../../utils/logger';

// Response interfaces
export interface InvoiceResponse {
  id: string;
  userId: string;
  supplierId: string | null;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number | null;
  invoiceDate: Date | null;
  invoiceNumber: string | null;
  status: InvoiceStatus;
  totalAmount: number | null;
  currency: string;
  confidenceScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadInvoiceData {
  userId: string;
  file: {
    path: string;
    mimetype: string;
    size: number;
    originalname: string;
  };
}

// Helper function to transform database record to response format
const transformInvoice = (invoice: Invoice): InvoiceResponse => ({
  id: invoice.id,
  userId: invoice.user_id,
  supplierId: invoice.supplier_id,
  fileUrl: invoice.file_url,
  fileType: invoice.file_type,
  fileSizeBytes: invoice.file_size_bytes,
  invoiceDate: invoice.invoice_date,
  invoiceNumber: invoice.invoice_number,
  status: invoice.status,
  totalAmount: invoice.total_amount,
  currency: invoice.currency,
  confidenceScore: invoice.confidence_score,
  createdAt: invoice.created_at,
  updatedAt: invoice.updated_at,
});

export default class InvoiceService {
  /**
   * Upload and create a new invoice
   */
  static async uploadInvoice(data: UploadInvoiceData, processOcr: boolean = false): Promise<InvoiceResponse> {
    const { userId, file } = data;

    // For now, store the local file path
    // Later this will be replaced with S3 upload
    const fileUrl = file.path;

    const createData: CreateInvoiceData = {
      userId,
      fileUrl,
      fileType: file.mimetype,
      fileSizeBytes: file.size,
      originalFilename: file.originalname,
    };

    const invoice = await InvoiceRepository.create(createData);
    logger.info('Invoice uploaded successfully', { invoiceId: invoice.id, userId });

    // Trigger OCR processing asynchronously if requested
    if (processOcr) {
      // Import dynamically to avoid circular dependency
      const { default: ocrProcessorService } = await import('../ocr/ocr-processor.service');

      // Process in background (don't await)
      ocrProcessorService.processInvoice(invoice.id, userId)
        .then(result => {
          logger.info('Background OCR completed', { invoiceId: invoice.id, success: result.success });
        })
        .catch(error => {
          logger.error('Background OCR failed', { invoiceId: invoice.id, error });
        });
    }

    return transformInvoice(invoice);
  }

  /**
   * Get invoice by ID (with user authorization check)
   */
  static async getInvoiceById(invoiceId: string, userId: string, isAdmin: boolean = false): Promise<InvoiceResponse> {
    let invoice: Invoice | null;

    if (isAdmin) {
      // Admin can access any invoice
      invoice = await InvoiceRepository.findById(invoiceId);
    } else {
      // Regular user can only access their own invoices
      invoice = await InvoiceRepository.findByIdAndUser(invoiceId, userId);
    }

    if (!invoice) {
      throw new NotFoundError(MESSAGES.INVOICE_MESSAGES.INVOICE_NOT_FOUND);
    }

    return transformInvoice(invoice);
  }

  /**
   * Get all invoices for a user with pagination
   */
  static async getInvoices(options: InvoiceListOptions): Promise<PaginatedResult<InvoiceResponse>> {
    const result = await InvoiceRepository.findByUser(options);

    return {
      ...result,
      data: result.data.map(transformInvoice),
    };
  }

  /**
   * Update an invoice (with authorization check)
   */
  static async updateInvoice(
    invoiceId: string,
    userId: string,
    data: UpdateInvoiceData,
    isAdmin: boolean = false
  ): Promise<InvoiceResponse> {
    // First verify the invoice exists and user has access
    const existing = isAdmin
      ? await InvoiceRepository.findById(invoiceId)
      : await InvoiceRepository.findByIdAndUser(invoiceId, userId);

    if (!existing) {
      throw new NotFoundError(MESSAGES.INVOICE_MESSAGES.INVOICE_NOT_FOUND);
    }

    const updated = await InvoiceRepository.update(invoiceId, data);
    if (!updated) {
      throw new NotFoundError(MESSAGES.INVOICE_MESSAGES.INVOICE_NOT_FOUND);
    }

    logger.info('Invoice updated successfully', { invoiceId, userId });
    return transformInvoice(updated);
  }

  /**
   * Delete an invoice (with authorization check)
   */
  static async deleteInvoice(invoiceId: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const existing = isAdmin
      ? await InvoiceRepository.findById(invoiceId)
      : await InvoiceRepository.findByIdAndUser(invoiceId, userId);

    if (!existing) {
      throw new NotFoundError(MESSAGES.INVOICE_MESSAGES.INVOICE_NOT_FOUND);
    }

    await InvoiceRepository.delete(invoiceId);
    logger.info('Invoice deleted successfully', { invoiceId, userId });
  }

  /**
   * Get invoice status counts for dashboard
   */
  static async getStatusCounts(userId: string): Promise<Record<InvoiceStatus, number>> {
    return InvoiceRepository.getStatusCounts(userId);
  }
}

