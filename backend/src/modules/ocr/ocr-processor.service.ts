/**
 * OCR Processor Service
 * Orchestrates the OCR processing pipeline:
 * 1. Fetch invoice from database
 * 2. Call OCR provider (Tesseract.js - free, local OCR)
 * 3. Parse and store results
 */

import path from 'path';
import { logger } from '../../utils/logger';
import InvoiceRepository from '../invoices/invoice.repository';
import tesseractService from './tesseract.service';
import invoiceParserService, { ParseResult } from './invoice-parser.service';
import { OCRResult, OCRInput } from './ocr.types';

export interface ProcessingResult {
  invoiceId: string;
  success: boolean;
  ocrResult?: OCRResult;
  parseResult?: ParseResult;
  error?: string;
  processingTimeMs: number;
}

export class OCRProcessorService {
  private maxRetries = 3;
  private retryDelayMs = 1000;

  /**
   * Process a single invoice with OCR
   */
  async processInvoice(invoiceId: string, userId: string): Promise<ProcessingResult> {
    const startTime = Date.now();
    logger.info('Starting OCR processing', { invoiceId, userId });

    try {
      // 1. Fetch invoice
      const invoice = await InvoiceRepository.findByIdAndUser(invoiceId, userId);
      if (!invoice) {
        return this.errorResult(invoiceId, startTime, 'Invoice not found');
      }

      // Check if already processed
      if (['PARSED', 'REVIEWED'].includes(invoice.status)) {
        logger.info('Invoice already processed', { invoiceId, status: invoice.status });
        return {
          invoiceId,
          success: true,
          processingTimeMs: Date.now() - startTime,
        };
      }

      // 2. Update status to PROCESSING
      await InvoiceRepository.update(invoiceId, { status: 'PROCESSING' });

      // 3. Prepare OCR input - convert URL path to absolute file path
      const filePath = this.resolveFilePath(invoice.file_url);
      logger.info('Resolved file path', {
        invoiceId,
        originalUrl: invoice.file_url,
        resolvedPath: filePath,
        mimeType: invoice.file_type,
      });

      const ocrInput: OCRInput = {
        filePath,
        mimeType: invoice.file_type,
      };

      // 4. Call OCR with retry
      let ocrResult: OCRResult | null = null;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          logger.info('OCR attempt', { invoiceId, attempt });
          ocrResult = await tesseractService.analyzeDocument(ocrInput);
          break;
        } catch (error) {
          lastError = error as Error;
          logger.warn('OCR attempt failed', { invoiceId, attempt, error: lastError.message });

          if (attempt < this.maxRetries) {
            await this.delay(this.retryDelayMs * attempt);
          }
        }
      }

      if (!ocrResult) {
        await InvoiceRepository.update(invoiceId, { status: 'FAILED' });
        return this.errorResult(
          invoiceId,
          startTime,
          lastError?.message || 'OCR processing failed after retries'
        );
      }

      // 5. Parse and store results
      const parseResult = await invoiceParserService.parseAndStore(invoiceId, ocrResult);

      logger.info('OCR processing completed', {
        invoiceId,
        confidence: ocrResult.confidence,
        lineItems: ocrResult.extractedData.lineItems.length,
        status: parseResult.status,
      });

      return {
        invoiceId,
        success: true,
        ocrResult,
        parseResult,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('OCR processing error', { invoiceId, error });
      await InvoiceRepository.update(invoiceId, { status: 'FAILED' }).catch(() => {});
      return this.errorResult(invoiceId, startTime, (error as Error).message);
    }
  }

  /**
   * Process invoice without user check (for admin/background jobs)
   */
  async processInvoiceAdmin(invoiceId: string): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    const invoice = await InvoiceRepository.findById(invoiceId);
    if (!invoice) {
      return this.errorResult(invoiceId, startTime, 'Invoice not found');
    }

    return this.processInvoice(invoiceId, invoice.user_id);
  }

  /**
   * Process multiple invoices
   */
  async processBatch(invoiceIds: string[], userId: string): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];

    for (const invoiceId of invoiceIds) {
      const result = await this.processInvoice(invoiceId, userId);
      results.push(result);
    }

    return results;
  }

  /**
   * Helper to create error result
   */
  private errorResult(invoiceId: string, startTime: number, error: string): ProcessingResult {
    return {
      invoiceId,
      success: false,
      error,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Resolve URL path to absolute file path
   * Converts /uploads/invoices/file.pdf to absolute path on disk
   */
  private resolveFilePath(fileUrl: string): string {
    // If it's already an absolute path or S3 URL, return as-is
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }

    // Check if it's a URL path (starts with /)
    if (fileUrl.startsWith('/uploads/')) {
      // Convert URL path to file system path
      // /uploads/invoices/file.pdf -> {cwd}/uploads/invoices/file.pdf
      const relativePath = fileUrl.substring(1); // Remove leading /
      return path.join(process.cwd(), relativePath);
    }

    // If it's already an absolute path, return as-is
    if (path.isAbsolute(fileUrl)) {
      return fileUrl;
    }

    // For other relative paths, resolve from cwd
    return path.join(process.cwd(), fileUrl);
  }
}

export default new OCRProcessorService();

