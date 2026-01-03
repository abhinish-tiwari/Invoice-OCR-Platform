/**
 * AI-based Invoice Data Extraction Service
 * Uses LLMs (OpenAI/Anthropic) to intelligently parse OCR text into structured invoice data
 */

import { logger } from '../../utils/logger';

// Types for extracted invoice data
export interface AIExtractedLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  unit?: string;
  vatPercent?: number;
}

export interface AIExtractedInvoice {
  invoiceNumber: string | null;
  invoiceDate: string | null;
  supplier: string | null;
  supplierAddress?: string | null;
  customerName?: string | null;
  subtotal: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  currency: string;
  lineItems: AIExtractedLineItem[];
  confidence: number;
}

// The extraction prompt template
const EXTRACTION_PROMPT = `You are an expert invoice data extraction system. Parse the OCR text precisely.

CRITICAL RULES:

1. LINE ITEM SEPARATION:
   - Each product/service is a SEPARATE line item
   - DO NOT merge multiple products into one item
   - Look for patterns: each row in the table = one item
   - Row typically ends with a price/total amount

2. DESCRIPTION:
   - Extract the complete product name/description
   - Remove line numbers (1., 2:, a), ik, etc.)
   - Examples: "Dell Desktop Computer Tower", "Quad Intel Core i5 8GB PC"
   - Do NOT include prices or quantities in description

3. QUANTITY:
   - Small integer, usually 1-50
   - "3,00" or "3.00" = 3 units (not 3.00 as price!)
   - Look for "each", "pcs", "unit" keywords nearby

4. PRICES:
   - European: comma = decimal (149,95 = 149.95)
   - unitPrice = per-unit cost (typically 2nd or 3rd number)
   - lineTotal = GROSS/FINAL amount (rightmost large number)
   - lineTotal is usually > unitPrice when qty > 1

5. TABLE STRUCTURE:
   - Header row: Description, Qty, Unit Price, Net, VAT%, Gross
   - Items between header and SUMMARY/TOTAL
   - Stop at "Summary", "Total", "Subtotal"

OCR TEXT:
\`\`\`
{{OCR_TEXT}}
\`\`\`

Return ONLY valid JSON:
{
  "invoiceNumber": "string or null",
  "invoiceDate": "string or null",
  "supplier": "company name or null",
  "supplierAddress": "string or null",
  "customerName": "string or null",
  "subtotal": number or null,
  "taxAmount": number or null,
  "totalAmount": number or null,
  "currency": "USD/EUR/GBP/PLN",
  "lineItems": [
    {
      "description": "product name only",
      "quantity": integer,
      "unitPrice": number,
      "lineTotal": number,
      "unit": "each/pcs/null",
      "vatPercent": number or null
    }
  ],
  "confidence": 0.0-1.0
}`;

class AIExtractionService {
  private provider: string | null;
  private apiKey: string | null;
  private model: string;

  constructor() {
    this.provider = process.env.AI_EXTRACTION_PROVIDER || null;
    this.apiKey = process.env.OPENAI_API_KEY || null;
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  /**
   * Check if AI extraction is available
   */
  isAvailable(): boolean {
    return !!(this.provider && this.apiKey);
  }

  /**
   * Extract structured invoice data from OCR text using AI
   */
  async extractFromText(ocrText: string): Promise<AIExtractedInvoice | null> {
    if (!this.isAvailable()) {
      logger.info('🤖 AI extraction not configured, skipping');
      return null;
    }

    try {
      logger.info('🤖 Starting AI extraction', {
        provider: this.provider,
        model: this.model,
        textLength: ocrText.length
      });

      const startTime = Date.now();
      const prompt = EXTRACTION_PROMPT.replace('{{OCR_TEXT}}', ocrText);

      let result: AIExtractedInvoice | null = null;

      if (this.provider === 'openai') {
        result = await this.extractWithOpenAI(prompt);
      } else {
        logger.warn('Unknown AI provider', { provider: this.provider });
        return null;
      }

      const processingTime = Date.now() - startTime;

      logger.info('🤖 AI extraction complete', {
        processingTimeMs: processingTime,
        lineItems: result?.lineItems.length || 0,
        confidence: `${((result?.confidence || 0) * 100).toFixed(1)}%`
      });

      return result;
    } catch (error) {
      logger.error('🤖 AI extraction failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Extract using OpenAI API
   */
  private async extractWithOpenAI(prompt: string): Promise<AIExtractedInvoice | null> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a precise invoice data extraction assistant. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Parse the JSON response
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr) as AIExtractedInvoice;

    return this.validateAndNormalize(parsed);
  }

  /**
   * Validate and normalize the extracted data
   */
  private validateAndNormalize(data: AIExtractedInvoice): AIExtractedInvoice {
    // Ensure line items have valid numbers
    const validLineItems = (data.lineItems || [])
      .filter(item => item.description && item.description.length > 0)
      .map(item => ({
        description: String(item.description).trim(),
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        lineTotal: Number(item.lineTotal) || 0,
        unit: item.unit || undefined,
        vatPercent: item.vatPercent ? Number(item.vatPercent) : undefined,
      }));

    return {
      invoiceNumber: data.invoiceNumber || null,
      invoiceDate: data.invoiceDate || null,
      supplier: data.supplier || null,
      supplierAddress: data.supplierAddress || null,
      customerName: data.customerName || null,
      subtotal: data.subtotal ? Number(data.subtotal) : null,
      taxAmount: data.taxAmount ? Number(data.taxAmount) : null,
      totalAmount: data.totalAmount ? Number(data.totalAmount) : null,
      currency: data.currency || 'USD',
      lineItems: validLineItems,
      confidence: Math.min(1, Math.max(0, Number(data.confidence) || 0.8)),
    };
  }
}

export const aiExtractionService = new AIExtractionService();

