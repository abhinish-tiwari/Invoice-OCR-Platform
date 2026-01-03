import { Request, Response } from 'express';
import InvoiceService from './invoice.service';
import MESSAGES from '../../constants/messages';
import { asyncHandler, ValidationError } from '../../middleware/error.middleware';
import { logger } from '../../utils/logger';
import { uploadToStorage, getStorageMode } from '../../config/upload.config';
import { ExportService, ExportInvoiceData } from './export.service';
import InvoiceLineRepository from './invoice-line.repository';
import InvoiceRepository from './invoice.repository';

export default class InvoiceController {
  /**
   * Upload a new invoice
   * @route POST /api/v1/invoices/upload
   * @access Private
   */
  static upload = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      throw new ValidationError(MESSAGES.INVOICE_MESSAGES.UPLOAD_FAILED);
    }

    const userId = req.user!.userId;
    const file = req.file;

    // Check if OCR processing should be triggered
    const processOcr = req.query.processOcr === 'true';

    // Upload to storage (S3 or local based on STORAGE_MODE)
    let fileUrl: string;
    if (getStorageMode() === 's3') {
      const result = await uploadToStorage(file);
      fileUrl = result.url;
    } else {
      // For local storage, file is already saved by multer
      fileUrl = `/uploads/invoices/${file.filename}`;
    }

    const invoice = await InvoiceService.uploadInvoice({
      userId,
      file: {
        path: fileUrl,
        mimetype: file.mimetype,
        size: file.size,
        originalname: file.originalname,
      },
    }, processOcr);

    logger.info('Invoice uploaded', {
      invoiceId: invoice.id,
      userId,
      processOcr,
    });

    res.status(201).json({
      success: true,
      message: MESSAGES.INVOICE_MESSAGES.UPLOAD_SUCCESS,
      data: {
        invoice,
        ocrProcessing: processOcr ? 'started' : 'not_requested',
      },
    });
  });

  /**
   * Get all invoices for the current user (with pagination)
   * @route GET /api/v1/invoices
   * @access Private
   */
  static getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    // If admin, they can optionally filter by userId, otherwise use their own
    const targetUserId = isAdmin && req.query.userId 
      ? req.query.userId as string 
      : userId;

    const options = {
      userId: targetUserId,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      status: req.query.status as any,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      sortBy: (req.query.sortBy as any) || 'created_at',
      sortOrder: (req.query.sortOrder as any) || 'DESC',
    };

    const result = await InvoiceService.getInvoices(options);

    res.status(200).json({
      success: true,
      message: MESSAGES.INVOICE_MESSAGES.FETCH_SUCCESS,
      data: result,
    });
  });

  /**
   * Get a single invoice by ID
   * @route GET /api/v1/invoices/:id
   * @access Private
   */
  static getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const invoice = await InvoiceService.getInvoiceById(id, userId, isAdmin);

    res.status(200).json({
      success: true,
      data: { invoice },
    });
  });

  /**
   * Update an invoice
   * @route PUT /api/v1/invoices/:id
   * @access Private
   */
  static update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const invoice = await InvoiceService.updateInvoice(id, userId, req.body, isAdmin);

    res.status(200).json({
      success: true,
      message: MESSAGES.INVOICE_MESSAGES.UPDATE_SUCCESS,
      data: { invoice },
    });
  });

  /**
   * Delete an invoice
   * @route DELETE /api/v1/invoices/:id
   * @access Private
   */
  static delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    await InvoiceService.deleteInvoice(id, userId, isAdmin);

    res.status(200).json({
      success: true,
      message: MESSAGES.INVOICE_MESSAGES.DELETE_SUCCESS,
    });
  });

  /**
   * Get invoice status counts for dashboard
   * @route GET /api/v1/invoices/stats
   * @access Private
   */
  static getStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    const counts = await InvoiceService.getStatusCounts(userId);

    res.status(200).json({
      success: true,
      data: { counts },
    });
  });

  /**
   * Get line items for an invoice
   * @route GET /api/v1/invoices/:id/lines
   * @access Private
   */
  static getLineItems = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id: invoiceId } = req.params;
    const userId = req.user!.userId;

    // Verify invoice exists and belongs to user
    await InvoiceService.getInvoiceById(invoiceId, userId);

    // Get line items
    const InvoiceLineRepository = (await import('./invoice-line.repository')).default;
    const lines = await InvoiceLineRepository.findByInvoiceId(invoiceId);

    res.status(200).json({
      success: true,
      data: { lines },
    });
  });

  /**
   * Update a line item
   * @route PUT /api/v1/invoices/:id/lines/:lineId
   * @access Private
   */
  static updateLineItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id: invoiceId, lineId } = req.params;
    const userId = req.user!.userId;

    // Verify invoice exists and belongs to user
    await InvoiceService.getInvoiceById(invoiceId, userId);

    // Get line item and verify it belongs to this invoice
    const InvoiceLineRepository = (await import('./invoice-line.repository')).default;
    const existingLine = await InvoiceLineRepository.findById(lineId);

    if (!existingLine || existingLine.invoice_id !== invoiceId) {
      throw new ValidationError('Line item not found');
    }

    // Update the line item
    const updatedLine = await InvoiceLineRepository.update(lineId, req.body);

    logger.info('Invoice line updated', { invoiceId, lineId, userId });

    res.status(200).json({
      success: true,
      message: 'Line item updated successfully',
      data: { line: updatedLine },
    });
  });

  /**
   * Mark invoice as reviewed
   * @route POST /api/v1/invoices/:id/review
   * @access Private
   */
  static markReviewed = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id: invoiceId } = req.params;
    const userId = req.user!.userId;

    // Update invoice status to REVIEWED
    const invoice = await InvoiceService.updateInvoice(invoiceId, userId, {
      status: 'REVIEWED',
    });

    logger.info('Invoice marked as reviewed', { invoiceId, userId });

    res.status(200).json({
      success: true,
      message: 'Invoice marked as reviewed',
      data: { invoice },
    });
  });

  /**
   * Export invoices to CSV, Excel, or PDF
   * @route GET /api/v1/invoices/export
   * @access Private
   */
  static export = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';
    const format = (req.query.format as string) || 'csv';
    const invoiceIds = req.query.ids ? (req.query.ids as string).split(',') : undefined;

    // Validate format
    if (!['csv', 'excel', 'pdf'].includes(format)) {
      throw new ValidationError('Invalid export format. Supported: csv, excel, pdf');
    }

    // Get invoices based on filters
    let invoices: Array<import('./invoice.repository').Invoice> = [];
    if (invoiceIds && invoiceIds.length > 0) {
      // Export specific invoices
      const results = await Promise.all(
        invoiceIds.map(id => InvoiceRepository.findById(id))
      );
      invoices = results.filter((inv): inv is import('./invoice.repository').Invoice => inv !== null);

      // Filter by ownership unless admin
      if (!isAdmin) {
        invoices = invoices.filter(inv => inv.user_id === userId);
      }
    } else {
      // Export all user's invoices (with pagination limits removed)
      const result = await InvoiceRepository.findByUser({
        userId: isAdmin ? (req.query.userId as string || userId) : userId,
        page: 1,
        limit: 1000, // Export up to 1000 invoices
        sortBy: 'created_at',
        sortOrder: 'DESC',
      });
      invoices = result.data;
    }

    // Build export data with line items
    const exportData: ExportInvoiceData[] = await Promise.all(
      invoices.map(async (invoice) => {
        const lines = await InvoiceLineRepository.findByInvoiceId(invoice!.id);
        logger.info('Export: fetched lines for invoice', {
          invoiceId: invoice!.id,
          invoiceNumber: invoice!.invoice_number,
          lineCount: lines.length,
        });
        // TODO: Optionally fetch supplier name
        return {
          invoice: invoice!,
          lines,
          supplierName: undefined,
        };
      })
    );

    // Generate export
    const result = await ExportService.generate(
      format as 'csv' | 'excel' | 'pdf',
      exportData
    );

    logger.info('Invoices exported', {
      userId,
      format,
      count: exportData.length,
      totalLineItems: exportData.reduce((sum, d) => sum + d.lines.length, 0),
    });

    // Set response headers for file download
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

    if (typeof result.data === 'string') {
      res.send(result.data);
    } else {
      res.send(result.data);
    }
  });
}
