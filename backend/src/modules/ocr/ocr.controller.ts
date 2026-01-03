/**
 * OCR Controller
 * HTTP handlers for OCR processing endpoints
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import ocrProcessorService from './ocr-processor.service';
import { logger } from '../../utils/logger';
import MESSAGES from '../../constants/messages';

export default class OCRController {
  /**
   * Process a single invoice with OCR
   * POST /api/ocr/process/:invoiceId
   */
  static processInvoice: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { invoiceId } = req.params;
      const userId = req.user!.userId;

      logger.info('OCR process request received', { invoiceId, userId });

      const result = await ocrProcessorService.processInvoice(invoiceId, userId);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: MESSAGES.INVOICE_MESSAGES.PROCESSING_FAILED,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Invoice processed successfully',
        data: {
          invoiceId: result.invoiceId,
          status: result.parseResult?.status,
          confidence: result.ocrResult?.confidence,
          lineItemsCreated: result.parseResult?.lineItemsCreated,
          needsReview: result.parseResult?.needsReview,
          processingTimeMs: result.processingTimeMs,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process multiple invoices with OCR
   * POST /api/ocr/process-batch
   */
  static processBatch: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { invoiceIds } = req.body;
      const userId = req.user!.userId;

      if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'invoiceIds must be a non-empty array',
        });
        return;
      }

      // Limit batch size
      const maxBatchSize = 10;
      if (invoiceIds.length > maxBatchSize) {
        res.status(400).json({
          success: false,
          message: `Maximum batch size is ${maxBatchSize} invoices`,
        });
        return;
      }

      logger.info('OCR batch process request', { count: invoiceIds.length, userId });

      const results = await ocrProcessorService.processBatch(invoiceIds, userId);

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      res.status(200).json({
        success: true,
        message: `Processed ${successful}/${results.length} invoices`,
        data: {
          successful,
          failed,
          results: results.map(r => ({
            invoiceId: r.invoiceId,
            success: r.success,
            status: r.parseResult?.status,
            error: r.error,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get OCR processing status for an invoice
   * GET /api/ocr/status/:invoiceId
   */
  static getStatus: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { invoiceId } = req.params;
      const userId = req.user!.userId;

      // This would fetch from a jobs table in production
      // For now, we just return the invoice status
      const InvoiceRepository = (await import('../invoices/invoice.repository')).default;
      const invoice = await InvoiceRepository.findByIdAndUser(invoiceId, userId);

      if (!invoice) {
        res.status(404).json({
          success: false,
          message: MESSAGES.INVOICE_MESSAGES.INVOICE_NOT_FOUND,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          invoiceId,
          status: invoice.status,
          confidenceScore: invoice.confidence_score,
          updatedAt: invoice.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

