/**
 * OCR Types and Interfaces
 * Defines the contract for OCR providers and results
 */

// Bounding box for detected text
export interface BoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Individual line item extracted from invoice
export interface OCRLineItem {
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  lineTotal: number | null;
  confidence: number;
  boundingBox?: BoundingBox;
}

// Extracted invoice data
export interface ExtractedInvoiceData {
  supplier: string | null;
  invoiceDate: string | null;
  invoiceNumber: string | null;
  totalAmount: number | null;
  subtotal: number | null;
  taxAmount: number | null;
  currency: string | null;
  lineItems: OCRLineItem[];
}

// Complete OCR result
export interface OCRResult {
  provider: string;
  rawOutput: unknown;
  extractedData: ExtractedInvoiceData;
  confidence: number;
  processingTimeMs: number;
}

// Input for OCR processing
export interface OCRInput {
  // Local file path
  filePath?: string;
  // S3 location
  s3Bucket?: string;
  s3Key?: string;
  // File type
  mimeType: string;
}

// Processing status for async OCR jobs
export type OCRProcessingStatus = 
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

// OCR job record
export interface OCRJob {
  id: string;
  invoiceId: string;
  status: OCRProcessingStatus;
  provider: string;
  startedAt: Date | null;
  completedAt: Date | null;
  error: string | null;
  result: OCRResult | null;
  retryCount: number;
}

// Field extraction result with confidence
export interface ExtractedField<T = string> {
  value: T | null;
  confidence: number;
  rawText?: string;
}

// Textract-specific types
export interface TextractExpenseField {
  type: string;
  value: string;
  confidence: number;
}

export interface TextractLineItemField {
  type: string;
  value: string;
  confidence: number;
}

// OCR Provider interface
export interface OCRProvider {
  name: string;
  analyzeDocument(input: OCRInput): Promise<OCRResult>;
}

