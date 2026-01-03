/**
 * AWS Textract OCR Service
 * Uses Textract's AnalyzeExpense API for invoice/receipt analysis
 */

import {
  TextractClient,
  AnalyzeExpenseCommand,
  AnalyzeExpenseCommandInput,
  ExpenseDocument,
  ExpenseField,
  LineItemGroup,
} from '@aws-sdk/client-textract';
import * as fs from 'fs';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import {
  OCRProvider,
  OCRInput,
  OCRResult,
  ExtractedInvoiceData,
  OCRLineItem,
} from './ocr.types';

export class TextractService implements OCRProvider {
  name = 'textract';
  private client: TextractClient;

  constructor() {
    this.client = new TextractClient({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  /**
   * Analyze a document using Textract AnalyzeExpense
   */
  async analyzeDocument(input: OCRInput): Promise<OCRResult> {
    const startTime = Date.now();
    logger.info('Starting Textract analysis', { input: { ...input, filePath: input.filePath ? '[LOCAL]' : undefined } });

    try {
      let commandInput: AnalyzeExpenseCommandInput;

      if (input.s3Bucket && input.s3Key) {
        // Use S3 document
        commandInput = {
          Document: {
            S3Object: {
              Bucket: input.s3Bucket,
              Name: input.s3Key,
            },
          },
        };
      } else if (input.filePath) {
        // Read local file and send as bytes
        const fileBytes = fs.readFileSync(input.filePath);
        commandInput = {
          Document: {
            Bytes: fileBytes,
          },
        };
      } else {
        throw new Error('No valid input provided for OCR');
      }

      const command = new AnalyzeExpenseCommand(commandInput);
      const response = await this.client.send(command);
      const processingTimeMs = Date.now() - startTime;

      logger.info('Textract analysis completed', { processingTimeMs });

      // Parse the response
      const extractedData = this.parseExpenseResponse(response.ExpenseDocuments || []);
      const confidence = this.calculateOverallConfidence(response.ExpenseDocuments || []);

      return {
        provider: this.name,
        rawOutput: response,
        extractedData,
        confidence,
        processingTimeMs,
      };
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      logger.error('Textract analysis failed', { error, processingTimeMs });
      throw error;
    }
  }

  /**
   * Parse Textract ExpenseDocuments response
   */
  private parseExpenseResponse(expenseDocuments: ExpenseDocument[]): ExtractedInvoiceData {
    if (expenseDocuments.length === 0) {
      return this.emptyExtractedData();
    }

    const doc = expenseDocuments[0];
    const summaryFields = doc.SummaryFields || [];

    return {
      supplier: this.extractSummaryField(summaryFields, ['VENDOR_NAME', 'SUPPLIER_NAME', 'NAME']),
      invoiceDate: this.extractSummaryField(summaryFields, ['INVOICE_RECEIPT_DATE', 'DATE', 'DUE_DATE']),
      invoiceNumber: this.extractSummaryField(summaryFields, ['INVOICE_RECEIPT_ID', 'INVOICE_NUMBER', 'RECEIPT_NUMBER']),
      totalAmount: this.extractNumericField(summaryFields, ['TOTAL', 'AMOUNT_DUE', 'GRAND_TOTAL']),
      subtotal: this.extractNumericField(summaryFields, ['SUBTOTAL', 'SUB_TOTAL']),
      taxAmount: this.extractNumericField(summaryFields, ['TAX', 'TAX_AMOUNT', 'GST', 'VAT']),
      currency: this.extractCurrency(summaryFields),
      lineItems: this.extractLineItems(doc.LineItemGroups || []),
    };
  }

  /**
   * Extract a summary field by type
   */
  private extractSummaryField(fields: ExpenseField[], types: string[]): string | null {
    for (const type of types) {
      const field = fields.find(f => f.Type?.Text?.toUpperCase() === type);
      if (field?.ValueDetection?.Text) {
        return field.ValueDetection.Text;
      }
    }
    return null;
  }

  /**
   * Extract numeric field
   */
  private extractNumericField(fields: ExpenseField[], types: string[]): number | null {
    const textValue = this.extractSummaryField(fields, types);
    if (!textValue) return null;

    // Remove currency symbols and parse
    const cleaned = textValue.replace(/[^0-9.,\-]/g, '').replace(',', '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  /**
   * Extract currency from fields
   */
  private extractCurrency(fields: ExpenseField[]): string | null {
    // Look for explicit currency field
    const currencyField = fields.find(f => f.Type?.Text?.toUpperCase() === 'CURRENCY');
    if (currencyField?.ValueDetection?.Text) {
      return currencyField.ValueDetection.Text;
    }

    // Try to infer from total amount field
    const totalField = fields.find(f => 
      ['TOTAL', 'AMOUNT_DUE'].includes(f.Type?.Text?.toUpperCase() || '')
    );
    if (totalField?.ValueDetection?.Text) {
      const text = totalField.ValueDetection.Text;
      if (text.includes('$')) return 'USD';
      if (text.includes('£')) return 'GBP';
      if (text.includes('€')) return 'EUR';
      if (text.includes('₹')) return 'INR';
    }

    return null;
  }

  /**
   * Extract line items from LineItemGroups
   */
  private extractLineItems(lineItemGroups: LineItemGroup[]): OCRLineItem[] {
    const items: OCRLineItem[] = [];

    for (const group of lineItemGroups) {
      for (const lineItem of group.LineItems || []) {
        const item = this.parseLineItem(lineItem.LineItemExpenseFields || []);
        if (item.description) {
          items.push(item);
        }
      }
    }

    return items;
  }

  /**
   * Parse a single line item
   */
  private parseLineItem(fields: ExpenseField[]): OCRLineItem {
    let description = '';
    let quantity: number | null = null;
    let unitPrice: number | null = null;
    let lineTotal: number | null = null;
    let totalConfidence = 0;
    let fieldCount = 0;

    for (const field of fields) {
      const type = field.Type?.Text?.toUpperCase() || '';
      const value = field.ValueDetection?.Text || '';
      const confidence = field.ValueDetection?.Confidence || 0;

      switch (type) {
        case 'ITEM':
        case 'DESCRIPTION':
        case 'PRODUCT_CODE':
          description = value;
          totalConfidence += confidence;
          fieldCount++;
          break;
        case 'QUANTITY':
          quantity = this.parseNumber(value);
          totalConfidence += confidence;
          fieldCount++;
          break;
        case 'UNIT_PRICE':
        case 'PRICE':
          unitPrice = this.parseNumber(value);
          totalConfidence += confidence;
          fieldCount++;
          break;
        case 'EXPENSE_ROW_TOTAL':
        case 'LINE_TOTAL':
        case 'AMOUNT':
          lineTotal = this.parseNumber(value);
          totalConfidence += confidence;
          fieldCount++;
          break;
      }
    }

    return {
      description,
      quantity,
      unitPrice,
      lineTotal,
      confidence: fieldCount > 0 ? totalConfidence / fieldCount / 100 : 0,
    };
  }

  /**
   * Parse a number from text
   */
  private parseNumber(text: string): number | null {
    if (!text) return null;
    const cleaned = text.replace(/[^0-9.,\-]/g, '').replace(',', '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  /**
   * Calculate overall confidence from expense documents
   */
  private calculateOverallConfidence(expenseDocuments: ExpenseDocument[]): number {
    if (expenseDocuments.length === 0) return 0;

    let totalConfidence = 0;
    let fieldCount = 0;

    for (const doc of expenseDocuments) {
      for (const field of doc.SummaryFields || []) {
        if (field.ValueDetection?.Confidence) {
          totalConfidence += field.ValueDetection.Confidence;
          fieldCount++;
        }
      }
    }

    return fieldCount > 0 ? totalConfidence / fieldCount / 100 : 0;
  }

  /**
   * Return empty extracted data
   */
  private emptyExtractedData(): ExtractedInvoiceData {
    return {
      supplier: null,
      invoiceDate: null,
      invoiceNumber: null,
      totalAmount: null,
      subtotal: null,
      taxAmount: null,
      currency: null,
      lineItems: [],
    };
  }
}

export default new TextractService();
