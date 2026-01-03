/**
 * Invoice Parser Service
 * Parses OCR results and stores extracted data in the database
 */

import { logger } from '../../utils/logger';
import InvoiceRepository, { UpdateInvoiceData, InvoiceStatus } from '../invoices/invoice.repository';
import InvoiceLineRepository, { CreateInvoiceLineData } from '../invoices/invoice-line.repository';
import { OCRResult, ExtractedInvoiceData, OCRLineItem } from './ocr.types';

// Confidence threshold for requiring review
const CONFIDENCE_THRESHOLD = 0.85;

export interface ParseResult {
  invoiceId: string;
  status: InvoiceStatus;
  lineItemsCreated: number;
  needsReview: boolean;
  confidence: number;
}

export class InvoiceParserService {
  /**
   * Parse OCR result and store in database
   */
  async parseAndStore(invoiceId: string, ocrResult: OCRResult): Promise<ParseResult> {
    const { extractedData, confidence } = ocrResult;
    logger.info('Parsing OCR result', { invoiceId, confidence });

    try {
      // Determine if review is needed
      const needsReview = this.checkNeedsReview(extractedData, confidence);
      const status: InvoiceStatus = needsReview ? 'NEEDS_REVIEW' : 'PARSED';

      // Parse invoice date
      const invoiceDate = this.parseDate(extractedData.invoiceDate);

      // Update invoice header
      const updateData: UpdateInvoiceData = {
        invoiceDate,
        invoiceNumber: extractedData.invoiceNumber,
        totalAmount: extractedData.totalAmount,
        confidenceScore: confidence,
        status,
      };

      // Update currency if detected
      if (extractedData.currency) {
        updateData.currency = extractedData.currency;
      }

      await InvoiceRepository.update(invoiceId, updateData);

      // Delete existing line items (in case of re-processing)
      await InvoiceLineRepository.deleteByInvoiceId(invoiceId);

      // Create line items
      const lineItemsCreated = await this.createLineItems(invoiceId, extractedData.lineItems, confidence);

      logger.info('Successfully parsed invoice', {
        invoiceId,
        status,
        lineItemsCreated,
        confidence,
      });

      return {
        invoiceId,
        status,
        lineItemsCreated,
        needsReview,
        confidence,
      };
    } catch (error) {
      logger.error('Error parsing OCR result', { invoiceId, error });

      // Mark invoice as failed
      await InvoiceRepository.update(invoiceId, { status: 'FAILED' });
      throw error;
    }
  }

  /**
   * Check if invoice needs manual review
   */
  private checkNeedsReview(extractedData: ExtractedInvoiceData, confidence: number): boolean {
    // Low confidence
    if (confidence < CONFIDENCE_THRESHOLD) return true;

    // Missing critical fields
    if (!extractedData.invoiceNumber && !extractedData.invoiceDate) return true;

    // No line items extracted
    if (extractedData.lineItems.length === 0) return true;

    // Line items with low confidence
    const lowConfidenceItems = extractedData.lineItems.filter(
      item => item.confidence < CONFIDENCE_THRESHOLD
    );
    if (lowConfidenceItems.length > extractedData.lineItems.length * 0.3) return true;

    return false;
  }

  /**
   * Parse date string to Date object
   */
  private parseDate(dateStr: string | null): Date | null {
    if (!dateStr) return null;

    try {
      // Try various date formats
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date;

      // Try DD/MM/YYYY format
      const parts = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (parts) {
        const [, day, month, year] = parts;
        const fullYear = year.length === 2 ? `20${year}` : year;
        return new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Create line items from OCR result
   */
  private async createLineItems(
    invoiceId: string,
    lineItems: OCRLineItem[],
    overallConfidence: number
  ): Promise<number> {
    if (lineItems.length === 0) return 0;

    const lineData: CreateInvoiceLineData[] = lineItems.map((item, index) => ({
      invoiceId,
      lineNumber: index + 1,
      rawDescription: item.description,
      normalizedDescription: this.normalizeDescription(item.description),
      quantity: item.quantity ?? undefined,
      unitPrice: item.unitPrice ?? undefined,
      lineTotal: item.lineTotal ?? undefined,
      confidenceScore: item.confidence,
      needsReview: item.confidence < CONFIDENCE_THRESHOLD,
      metadata: {
        boundingBox: item.boundingBox,
        overallConfidence,
      },
    }));

    const created = await InvoiceLineRepository.createBulk(lineData);
    return created.length;
  }

  /**
   * Normalize description text
   */
  private normalizeDescription(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Remove punctuation
      .replace(/\s+/g, ' ')      // Collapse whitespace
      .trim();
  }
}

export default new InvoiceParserService();

