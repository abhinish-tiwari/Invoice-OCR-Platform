# OCR Integration & Parsing Logic

## Provider Selection: AWS Textract

**Chosen Provider:** AWS Textract  
**Justification:**
- Superior table detection (critical for invoice line items)
- Built-in invoice/receipt analysis with `AnalyzeExpense` API
- Structured output with confidence scores per field
- Better handling of multi-column layouts
- Native AWS integration (S3, IAM)
- Cost: ~$0.05 per page (acceptable for MVP)

**Alternative:** Google Cloud Vision API (good for general OCR but weaker on tables)

---

## Architecture: Swappable OCR Provider

Design pattern to allow switching providers:

```typescript
// src/services/ocr/types.ts
export interface OCRProvider {
  name: string;
  analyzeDocument(fileUrl: string): Promise<OCRResult>;
}

export interface OCRResult {
  provider: string;
  rawOutput: any;
  extractedData: {
    supplier?: string;
    invoiceDate?: string;
    invoiceNumber?: string;
    totalAmount?: number;
    lineItems: OCRLineItem[];
  };
  confidence: number;
  processingTimeMs: number;
}

export interface OCRLineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  confidence: number;
  boundingBox?: BoundingBox;
}
```

---

## Textract Implementation

### Service Structure

```typescript
// src/services/ocr/textract.service.ts
import { TextractClient, AnalyzeExpenseCommand } from '@aws-sdk/client-textract';
import { OCRProvider, OCRResult } from './types';

export class TextractOCRService implements OCRProvider {
  name = 'textract';
  private client: TextractClient;

  constructor() {
    this.client = new TextractClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async analyzeDocument(s3Url: string): Promise<OCRResult> {
    const startTime = Date.now();
    
    // Extract S3 bucket and key from URL
    const { bucket, key } = this.parseS3Url(s3Url);

    // Call Textract AnalyzeExpense
    const command = new AnalyzeExpenseCommand({
      Document: {
        S3Object: {
          Bucket: bucket,
          Name: key,
        },
      },
    });

    const response = await this.client.send(command);
    const processingTimeMs = Date.now() - startTime;

    // Parse Textract response
    const extractedData = this.parseTextractResponse(response);

    return {
      provider: this.name,
      rawOutput: response,
      extractedData,
      confidence: this.calculateOverallConfidence(response),
      processingTimeMs,
    };
  }

  private parseTextractResponse(response: any) {
    const expenseDocuments = response.ExpenseDocuments || [];
    if (expenseDocuments.length === 0) {
      throw new Error('No expense document found in Textract response');
    }

    const doc = expenseDocuments[0];
    
    // Extract summary fields (header)
    const summaryFields = doc.SummaryFields || [];
    const supplier = this.findField(summaryFields, ['VENDOR_NAME', 'VENDOR']);
    const invoiceDate = this.findField(summaryFields, ['INVOICE_RECEIPT_DATE', 'DATE']);
    const invoiceNumber = this.findField(summaryFields, ['INVOICE_RECEIPT_ID', 'INVOICE_NUMBER']);
    const totalAmount = this.findField(summaryFields, ['TOTAL', 'AMOUNT_PAID']);

    // Extract line items
    const lineItemGroups = doc.LineItemGroups || [];
    const lineItems = this.extractLineItems(lineItemGroups);

    return {
      supplier: supplier?.value,
      invoiceDate: invoiceDate?.value,
      invoiceNumber: invoiceNumber?.value,
      totalAmount: totalAmount ? parseFloat(totalAmount.value) : undefined,
      lineItems,
    };
  }

  private findField(fields: any[], typeNames: string[]) {
    for (const typeName of typeNames) {
      const field = fields.find((f: any) => 
        f.Type?.Text?.toUpperCase() === typeName
      );
      if (field && field.ValueDetection) {
        return {
          value: field.ValueDetection.Text,
          confidence: field.ValueDetection.Confidence || 0,
        };
      }
    }
    return null;
  }

  private extractLineItems(lineItemGroups: any[]): any[] {
    const items: any[] = [];

    for (const group of lineItemGroups) {
      const lineItems = group.LineItems || [];
      
      for (let i = 0; i < lineItems.length; i++) {
        const lineItem = lineItems[i];
        const fields = lineItem.LineItemExpenseFields || [];

        const description = this.findLineItemField(fields, ['ITEM', 'DESCRIPTION', 'PRODUCT_CODE']);
        const quantity = this.findLineItemField(fields, ['QUANTITY', 'QTY']);
        const unitPrice = this.findLineItemField(fields, ['UNIT_PRICE', 'PRICE']);
        const lineTotal = this.findLineItemField(fields, ['PRICE', 'AMOUNT', 'LINE_TOTAL']);

        if (description) {
          items.push({
            lineNumber: i + 1,
            description: description.value,
            quantity: quantity ? parseFloat(quantity.value) : undefined,
            unitPrice: unitPrice ? parseFloat(unitPrice.value) : undefined,
            lineTotal: lineTotal ? parseFloat(lineTotal.value) : undefined,
            confidence: Math.min(
              description.confidence,
              quantity?.confidence || 100,
              unitPrice?.confidence || 100
            ) / 100,
          });
        }
      }
    }

    return items;
  }

  private findLineItemField(fields: any[], typeNames: string[]) {
    for (const typeName of typeNames) {
      const field = fields.find((f: any) => 
        f.Type?.Text?.toUpperCase() === typeName
      );
      if (field && field.ValueDetection) {
        return {
          value: field.ValueDetection.Text,
          confidence: field.ValueDetection.Confidence || 0,
        };
      }
    }
    return null;
  }

  private calculateOverallConfidence(response: any): number {
    // Calculate average confidence across all fields
    const doc = response.ExpenseDocuments?.[0];
    if (!doc) return 0;

    const allConfidences: number[] = [];

    // Summary fields
    (doc.SummaryFields || []).forEach((field: any) => {
      if (field.ValueDetection?.Confidence) {
        allConfidences.push(field.ValueDetection.Confidence);
      }
    });

    // Line items
    (doc.LineItemGroups || []).forEach((group: any) => {
      (group.LineItems || []).forEach((item: any) => {
        (item.LineItemExpenseFields || []).forEach((field: any) => {
          if (field.ValueDetection?.Confidence) {
            allConfidences.push(field.ValueDetection.Confidence);
          }
        });
      });
    });

    if (allConfidences.length === 0) return 0;
    return allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length / 100;
  }

  private parseS3Url(url: string): { bucket: string; key: string } {
    // Parse S3 URL: https://bucket.s3.region.amazonaws.com/key
    // or s3://bucket/key
    const s3Match = url.match(/s3:\/\/([^\/]+)\/(.+)/);
    if (s3Match) {
      return { bucket: s3Match[1], key: s3Match[2] };
    }

    const httpsMatch = url.match(/https:\/\/([^.]+)\.s3\.[^.]+\.amazonaws\.com\/(.+)/);
    if (httpsMatch) {
      return { bucket: httpsMatch[1], key: httpsMatch[2] };
    }

    throw new Error('Invalid S3 URL format');
  }
}
```

---

## Parsing Pipeline

### Flow Diagram

```
Raw OCR Output
    ↓
Header Extraction (supplier, date, invoice#)
    ↓
Line Item Extraction (description, qty, price)
    ↓
Normalization (clean text, standardize units)
    ↓
Confidence Scoring
    ↓
Validation (totals match, required fields present)
    ↓
Store in Database
```

### Parser Service

```typescript
// src/services/parser/invoice-parser.service.ts
import { OCRResult } from '../ocr/types';
import { InvoiceRepository } from '../../repositories/invoice.repository';
import { SupplierRepository } from '../../repositories/supplier.repository';
import { normalizeText, extractPackSize, parseQuantity } from '../../utils/text-utils';

export class InvoiceParserService {
  constructor(
    private invoiceRepo: InvoiceRepository,
    private supplierRepo: SupplierRepository
  ) {}

  async parseAndStore(invoiceId: string, ocrResult: OCRResult): Promise<void> {
    const { extractedData, confidence } = ocrResult;

    // 1. Find or create supplier
    let supplierId: string | null = null;
    if (extractedData.supplier) {
      const supplier = await this.supplierRepo.findOrCreate({
        name: extractedData.supplier,
        normalizedName: normalizeText(extractedData.supplier),
      });
      supplierId = supplier.id;
    }

    // 2. Parse invoice date
    const invoiceDate = extractedData.invoiceDate
      ? this.parseDate(extractedData.invoiceDate)
      : null;

    // 3. Determine status based on confidence
    const needsReview = confidence < 0.85 || extractedData.lineItems.length === 0;
    const status = needsReview ? 'NEEDS_REVIEW' : 'PARSED';

    // 4. Update invoice header
    await this.invoiceRepo.update(invoiceId, {
      supplierId,
      invoiceDate,
      invoiceNumber: extractedData.invoiceNumber,
      totalAmount: extractedData.totalAmount,
      confidenceScore: confidence,
      status,
    });

    // 5. Store line items
    for (const item of extractedData.lineItems) {
      const normalized = this.normalizeLineItem(item);

      await this.invoiceRepo.createLineItem({
        invoiceId,
        lineNumber: item.lineNumber,
        rawDescription: item.description,
        normalizedDescription: normalized.description,
        packSize: normalized.packSize,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        confidenceScore: item.confidence,
        needsReview: item.confidence < 0.80,
      });
    }

    // 6. Log processing completion
    await this.invoiceRepo.logProcessing(invoiceId, {
      stage: 'PARSING',
      status: 'SUCCESS',
    });
  }

  private normalizeLineItem(item: any) {
    const description = normalizeText(item.description);
    const packSize = extractPackSize(item.description);

    return {
      description,
      packSize,
    };
  }

  private parseDate(dateStr: string): Date | null {
    // Handle various date formats: DD/MM/YYYY, MM-DD-YYYY, etc.
    const formats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY or MM/DD/YYYY
      /(\d{4})-(\d{2})-(\d{2})/,        // YYYY-MM-DD
      /(\d{1,2})-(\d{1,2})-(\d{4})/,    // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        try {
          // Attempt to parse (handle ambiguous formats by trying both)
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date;
          }
        } catch (e) {
          continue;
        }
      }
    }

    return null;
  }
}
```

---

## Text Normalization Utilities

```typescript
// src/utils/text-utils.ts

/**
 * Normalize text for matching:
 * - Convert to lowercase
 * - Remove special characters
 * - Collapse whitespace
 * - Remove common stop words
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Remove punctuation
    .replace(/\s+/g, ' ')       // Collapse whitespace
    .trim();
}

/**
 * Extract pack size from description
 * Examples:
 * - "Tomatoes 1kg" → "1kg"
 * - "Milk 2L" → "2L"
 * - "Eggs 12pk" → "12pk"
 */
export function extractPackSize(text: string): string | null {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pk|pack|pcs|pieces)/i,
    /(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(kg|g|l|ml)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].toLowerCase().replace(/\s+/g, '');
    }
  }

  return null;
}

/**
 * Parse quantity from text
 * Handles: "10", "10.5", "10 x 2"
 */
export function parseQuantity(text: string): number | null {
  // Handle "X x Y" format (multiply)
  const multiplyMatch = text.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i);
  if (multiplyMatch) {
    return parseFloat(multiplyMatch[1]) * parseFloat(multiplyMatch[2]);
  }

  // Handle simple number
  const numberMatch = text.match(/(\d+(?:\.\d+)?)/);
  if (numberMatch) {
    return parseFloat(numberMatch[1]);
  }

  return null;
}

/**
 * Normalize unit for comparison
 * Examples:
 * - "1kg" → { value: 1000, unit: "g" }
 * - "500g" → { value: 500, unit: "g" }
 * - "2L" → { value: 2000, unit: "ml" }
 */
export function normalizeUnit(packSize: string): { value: number; unit: string } | null {
  const match = packSize.match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pk|pack)/i);
  if (!match) return null;

  let value = parseFloat(match[1]);
  let unit = match[2].toLowerCase();

  // Convert to base units
  if (unit === 'kg') {
    value *= 1000;
    unit = 'g';
  } else if (unit === 'l') {
    value *= 1000;
    unit = 'ml';
  }

  return { value, unit };
}
```

---

## Confidence Scoring Rules

### Field-Level Confidence
- **High (≥ 0.90):** Auto-accept, no review needed
- **Medium (0.70-0.89):** Accept but flag for spot-check
- **Low (< 0.70):** Requires manual review

### Invoice-Level Status Logic

```typescript
function determineInvoiceStatus(ocrResult: OCRResult): string {
  const { confidence, extractedData } = ocrResult;

  // Critical fields missing
  if (!extractedData.supplier || extractedData.lineItems.length === 0) {
    return 'NEEDS_REVIEW';
  }

  // Overall confidence too low
  if (confidence < 0.85) {
    return 'NEEDS_REVIEW';
  }

  // Any line item with very low confidence
  const hasLowConfidenceItems = extractedData.lineItems.some(
    item => item.confidence < 0.70
  );
  if (hasLowConfidenceItems) {
    return 'NEEDS_REVIEW';
  }

  // Validation failures
  if (!this.validateTotals(extractedData)) {
    return 'NEEDS_REVIEW';
  }

  return 'PARSED';
}

function validateTotals(data: any): boolean {
  if (!data.totalAmount) return true; // Can't validate without total

  const calculatedTotal = data.lineItems.reduce(
    (sum: number, item: any) => sum + (item.lineTotal || 0),
    0
  );

  const difference = Math.abs(calculatedTotal - data.totalAmount);
  const tolerance = data.totalAmount * 0.05; // 5% tolerance

  return difference <= tolerance;
}
```

---

## Error Handling & Retries

```typescript
// src/services/ocr/ocr-orchestrator.service.ts
export class OCROrchestratorService {
  private maxRetries = 3;
  private retryDelayMs = 2000;

  async processInvoice(invoiceId: string, fileUrl: string): Promise<void> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.maxRetries) {
      try {
        // Log attempt
        await this.invoiceRepo.logProcessing(invoiceId, {
          stage: 'OCR',
          status: attempt === 0 ? 'STARTED' : 'RETRY',
          metadata: { attempt: attempt + 1 },
        });

        // Update invoice status
        await this.invoiceRepo.update(invoiceId, { status: 'PROCESSING' });

        // Call OCR
        const ocrResult = await this.ocrService.analyzeDocument(fileUrl);

        // Store raw OCR result
        await this.invoiceRepo.createOCRResult(invoiceId, ocrResult);

        // Parse and store
        await this.parserService.parseAndStore(invoiceId, ocrResult);

        // Success - log and return
        await this.invoiceRepo.logProcessing(invoiceId, {
          stage: 'COMPLETE',
          status: 'SUCCESS',
        });

        return;

      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (attempt < this.maxRetries) {
          // Wait before retry (exponential backoff)
          await this.sleep(this.retryDelayMs * Math.pow(2, attempt - 1));
        }
      }
    }

    // All retries failed
    await this.invoiceRepo.update(invoiceId, { status: 'FAILED' });
    await this.invoiceRepo.logProcessing(invoiceId, {
      stage: 'OCR',
      status: 'FAILED',
      errorMessage: lastError?.message || 'Unknown error',
    });

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## Storage Strategy

### Database Records

1. **`ocr_results` table:** Store complete raw Textract JSON
   - Allows re-parsing without re-calling API
   - Useful for debugging and improving parser

2. **`invoices` table:** Store extracted header fields
   - Supplier, date, invoice number, total
   - Overall confidence score
   - Processing status

3. **`invoice_lines` table:** Store parsed line items
   - Raw description + normalized description
   - Quantities, prices
   - Per-field confidence scores
   - Review flags

4. **`processing_logs` table:** Audit trail
   - Each processing stage
   - Timestamps, errors, retry attempts

### Example Flow

```
1. Upload → invoices (status=PENDING)
2. OCR call → ocr_results (raw JSON)
3. Parse → invoices (update header), invoice_lines (insert rows)
4. Match → invoice_lines (update product_id)
5. Review → invoices (status=REVIEWED)
```


