/**
 * Tesseract OCR Service
 * Uses Tesseract.js for local OCR processing (free, no API keys required)
 * Supports images (PNG, JPG, etc.)
 * Note: For PDFs, please convert to images first or use AWS Textract
 *
 * Features:
 * - Dynamic table detection and parsing
 * - Configurable extraction patterns (loaded from files)
 * - Vendor-specific extraction rules
 * - Automatic column identification
 */

import fs from 'fs';
import Tesseract from 'tesseract.js';
import { logger } from '../../utils/logger';
import { OCRResult, OCRInput, ExtractedInvoiceData, OCRLineItem } from './ocr.types';
import { extractionConfigManager, ExtractionConfig, DEFAULT_CONFIG } from './extraction-config';
import { aiExtractionService } from './ai-extraction.service';

// Runtime config with compiled RegExp patterns
interface RuntimeConfig {
  headerPatterns: {
    invoiceNumber: RegExp[];
    date: RegExp[];
    total: RegExp[];
    subtotal: RegExp[];
    tax: RegExp[];
    vendor: RegExp[];
  };
  tableHeaderKeywords: string[];
  excludeKeywords: string[];
  minConfidence: number;
  lineItemPatterns: RegExp[];
}

class TesseractService {
  public readonly name = 'TesseractOCR';

  /**
   * Analyze a document using Tesseract.js
   */
  async analyzeDocument(input: OCRInput): Promise<OCRResult> {
    const startTime = Date.now();

    if (!input.filePath) {
      throw new Error('File path is required for Tesseract OCR');
    }

    logger.info('🔍 Starting Tesseract OCR analysis', {
      filePath: input.filePath.includes('uploads') ? '[LOCAL]' : input.filePath,
      mimeType: input.mimeType,
    });

    try {
      // Check if file exists
      if (!fs.existsSync(input.filePath)) {
        throw new Error(`File not found: ${input.filePath}`);
      }

      // Check if PDF - Tesseract only works with images
      if (input.mimeType === 'application/pdf') {
        throw new Error('PDF files are not supported by Tesseract.js. Please upload an image file (PNG, JPG) or use AWS Textract for PDF support.');
      }

      // Process image with Tesseract
      logger.info('📷 Processing image with Tesseract.js');

      const { data } = await Tesseract.recognize(input.filePath, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            logger.debug('Tesseract progress', { progress: Math.round(m.progress * 100) });
          }
        },
      });

      // Extract invoice data from OCR text (try AI first, then patterns)
      const extractedData = await this.extractInvoiceDataAsync(data.text);

      const processingTimeMs = Date.now() - startTime;
      logger.info('✅ Tesseract OCR completed', {
        processingTimeMs,
        confidence: data.confidence,
        textLength: data.text.length,
      });

      return {
        provider: this.name,
        rawOutput: {
          text: data.text,
          confidence: data.confidence,
        },
        extractedData,
        confidence: data.confidence / 100,
        processingTimeMs,
      };

    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      logger.error('❌ Tesseract OCR failed', { error, processingTimeMs });
      throw error;
    }
  }

  /**
   * Convert ExtractionConfig (with string patterns) to RuntimeConfig (with RegExp)
   */
  private compileConfig(config: ExtractionConfig): RuntimeConfig {
    const compile = (patterns: string[]): RegExp[] =>
      patterns.map(p => new RegExp(p, 'i'));

    return {
      headerPatterns: {
        invoiceNumber: compile(config.headerPatterns.invoiceNumber),
        date: compile(config.headerPatterns.date),
        total: compile(config.headerPatterns.total),
        subtotal: compile(config.headerPatterns.subtotal),
        tax: compile(config.headerPatterns.tax),
        vendor: compile(config.headerPatterns.vendor || []),
      },
      tableHeaderKeywords: config.tableHeaderKeywords,
      excludeKeywords: config.excludeKeywords,
      minConfidence: config.minConfidence,
      lineItemPatterns: compile(config.lineItemPatterns || []),
    };
  }

  /**
   * Extract invoice data from OCR text
   * Tries AI extraction first (if configured), falls back to pattern-based
   */
  async extractInvoiceDataAsync(text: string): Promise<ExtractedInvoiceData> {
    const aiAvailable = aiExtractionService.isAvailable();
    logger.info('� Extraction method selection', { aiAvailable });

    // Try AI extraction first if available
    if (aiAvailable) {
      logger.info('🤖 Using AI extraction (OpenAI GPT-4o-mini)');

      try {
        const aiResult = await aiExtractionService.extractFromText(text);

        if (aiResult && aiResult.lineItems.length > 0) {
          logger.info('✅ AI extraction successful', {
            invoiceNumber: aiResult.invoiceNumber,
            lineItems: aiResult.lineItems.length,
            confidence: `${(aiResult.confidence * 100).toFixed(1)}%`
          });

          return {
            supplier: aiResult.supplier,
            invoiceDate: aiResult.invoiceDate,
            invoiceNumber: aiResult.invoiceNumber,
            totalAmount: aiResult.totalAmount,
            subtotal: aiResult.subtotal,
            taxAmount: aiResult.taxAmount,
            currency: aiResult.currency,
            lineItems: aiResult.lineItems.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
              confidence: aiResult.confidence,
            })),
          };
        } else {
          logger.warn('AI returned no line items, falling back to patterns');
        }
      } catch (error) {
        logger.error('AI extraction failed', { error: (error as Error).message });
      }
    }

    // Fall back to pattern-based extraction
    logger.info('📝 Using pattern-based extraction');
    const patternResult = this.extractInvoiceDataWithPatterns(text);

    logger.info('✅ Pattern extraction complete', {
      invoiceNumber: patternResult.invoiceNumber,
      lineItems: patternResult.lineItems.length,
      totalAmount: patternResult.totalAmount
    });

    return patternResult;
  }

  /**
   * Pattern-based extraction (original method)
   */
  private extractInvoiceDataWithPatterns(text: string, configInput?: ExtractionConfig): ExtractedInvoiceData {
    // Try to find vendor-specific config first
    const vendorConfig = extractionConfigManager.findVendorConfig(text);
    const baseConfig = configInput || vendorConfig || DEFAULT_CONFIG;
    const config = this.compileConfig(baseConfig);

    // Dynamic header field extraction
    const invoiceNumber = this.extractWithPatterns(text, config.headerPatterns.invoiceNumber);
    const invoiceDate = this.extractWithPatterns(text, config.headerPatterns.date);
    const totalAmount = this.extractWithPatterns(text, config.headerPatterns.total);
    const subtotal = this.extractWithPatterns(text, config.headerPatterns.subtotal);
    const taxAmount = this.extractWithPatterns(text, config.headerPatterns.tax);

    // Vendor/Supplier extraction
    let supplier: string | null = null;
    if (config.headerPatterns.vendor.length > 0) {
      supplier = this.extractWithPatterns(text, config.headerPatterns.vendor);
    }
    if (!supplier) {
      const vendorMatch = text.match(/^([A-Z][A-Za-z\s&]+(?:Inc\.?|LLC|Ltd\.?|Corp\.?)?)/m);
      supplier = vendorMatch ? vendorMatch[1].trim() : null;
    }

    // Dynamic currency detection
    const currency = this.detectCurrency(text);

    // Extract line items using dynamic table detection
    const lineItems = this.extractLineItemsDynamicWithRuntime(text, config);

    return {
      supplier,
      invoiceDate,
      invoiceNumber,
      totalAmount: totalAmount ? this.parseNumber(totalAmount) : null,
      subtotal: subtotal ? this.parseNumber(subtotal) : null,
      taxAmount: taxAmount ? this.parseNumber(taxAmount) : null,
      currency,
      lineItems,
    };
  }

  /**
   * Extract value using multiple patterns (tries each until one matches)
   */
  private extractWithPatterns(text: string, patterns: RegExp[]): string | null {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  /**
   * Detect currency from text
   */
  private detectCurrency(text: string): string {
    const currencyIndicators = [
      { symbols: ['$', 'USD', 'usd'], currency: 'USD' },
      { symbols: ['€', 'EUR', 'eur'], currency: 'EUR' },
      { symbols: ['£', 'GBP', 'gbp'], currency: 'GBP' },
      { symbols: ['₹', 'INR', 'inr', 'Rs', 'rs'], currency: 'INR' },
      { symbols: ['¥', 'JPY', 'jpy', 'CNY', 'cny'], currency: 'JPY' },
      { symbols: ['PLN', 'pln', 'zł', 'zl'], currency: 'PLN' },
    ];

    for (const indicator of currencyIndicators) {
      if (indicator.symbols.some(s => text.includes(s))) {
        return indicator.currency;
      }
    }
    return 'USD'; // Default
  }

  /**
   * Parse number from string (handles both 10.00 and 10,00 formats)
   */
  private parseNumber(str: string): number {
    if (!str) return 0;
    const cleaned = str.replace(/[^\d.,\-]/g, '');
    if (!cleaned) return 0;

    // Handle European format: 1.234,56 (dot as thousand sep, comma as decimal)
    if (cleaned.includes(',') && cleaned.includes('.')) {
      const lastComma = cleaned.lastIndexOf(',');
      const lastDot = cleaned.lastIndexOf('.');
      if (lastComma > lastDot) {
        // European: 1.234,56
        return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
      }
      // US: 1,234.56
      return parseFloat(cleaned.replace(/,/g, ''));
    } else if (cleaned.includes(',')) {
      // Single comma - check if decimal (XX,YY) or thousand separator
      const parts = cleaned.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        // Likely decimal: 149,95
        return parseFloat(cleaned.replace(',', '.'));
      }
      // Likely thousand separator: 1,234
      return parseFloat(cleaned.replace(/,/g, ''));
    }
    return parseFloat(cleaned) || 0;
  }

  /**
   * Clean and normalize description text
   */
  private cleanDescription(desc: string): string {
    if (!desc) return '';

    let cleaned = desc
      // Remove line number prefixes: 1., 2:, a), ik, etc.
      .replace(/^(?:\d+[\.\:\)]\s*|[a-z]{1,2}[\.\:\)]\s*)/i, '')
      // Remove leading/trailing special characters and numbers
      .replace(/^[\s\-\.\:\|]+/, '')
      .replace(/[\s\-\.\:\|]+$/, '')
      // Remove OCR artifacts (single random characters surrounded by spaces)
      .replace(/\s[a-zA-Z]\s/g, ' ')
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove trailing unit words that got attached
      .replace(/\s+(each|pcs|pc|unit|units|hrs|hour|hours|szt|kpl)\s*$/i, '')
      .trim();

    // Capitalize first letter if all lowercase
    if (cleaned.length > 0 && cleaned === cleaned.toLowerCase()) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return cleaned;
  }

  /**
   * Dynamic line items extraction with table detection (uses RuntimeConfig)
   */
  private extractLineItemsDynamicWithRuntime(text: string, config: RuntimeConfig): OCRLineItem[] {
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    // Step 1: Try improved multi-line extraction first
    const multiLineResult = this.extractMultiLineItems(lines, config);
    if (multiLineResult.length > 0) {
      logger.debug('Multi-line extraction successful', { items: multiLineResult.length });
      return multiLineResult;
    }

    // Step 2: Try to detect table structure
    const tableResult = this.detectTableStructure(lines, config);
    if (tableResult.items.length > 0) {
      logger.debug('Table structure detected', { items: tableResult.items.length });
      return tableResult.items;
    }

    // Step 3: Fall back to pattern-based extraction
    return this.extractWithPatternMatching(lines, config);
  }

  /**
   * Extract line items that may span multiple lines
   * Handles invoices where description continues on next line(s)
   */
  private extractMultiLineItems(lines: string[], _config: RuntimeConfig): OCRLineItem[] {
    const items: OCRLineItem[] = [];

    // Find ITEMS section
    let startIndex = -1;
    let endIndex = lines.length;

    for (let i = 0; i < lines.length; i++) {
      const lowerLine = lines[i].toLowerCase().trim();
      if (lowerLine === 'items' || lowerLine.includes('no. description')) {
        startIndex = i + 1;
        // Skip header line if present
        if (lines[i + 1]?.toLowerCase().includes('worth') ||
            lines[i + 1]?.toLowerCase().includes('description')) {
          startIndex = i + 2;
        }
      }
      if (lowerLine === 'summary' || lowerLine.startsWith('total')) {
        endIndex = i;
        break;
      }
    }

    if (startIndex === -1) {
      return [];
    }

    logger.debug('Found ITEMS section', { startIndex, endIndex });

    // Pattern to match a line item row with prices
    // Matches: "text qty,decimal unit price,decimal net,decimal vat% gross,decimal"
    // Example: "ik Dell Desktop Computer Tower 3,00 each 149,95 449,85 10% 494,83"
    const lineItemPattern = /^(.+?)\s+(\d+[,\.]\d{2})\s+(?:each|pcs|pc|unit|units|hrs)\s+([\d,\.]+)\s+([\d,\.]+)\s+(\d+)%\s+([\d,\.]+)\s*$/i;

    // Alternative pattern without unit
    const lineItemPattern2 = /^(.+?)\s+(\d+[,\.]\d{2})\s+([\d,\.]+)\s+([\d,\.]+)\s+(\d+)%\s+([\d,\.]+)\s*$/i;

    // Pattern to detect line number prefix (1., 2., 3:, ik, etc.)
    const lineNumberPattern = /^(?:(\d+)[\.\:\)]|([a-zA-Z]{1,2}))\s*/;

    let currentDescription = '';

    for (let i = startIndex; i < endIndex; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();

      // Skip header continuation
      if (lowerLine === 'worth' || lowerLine.includes('no. description')) {
        continue;
      }

      // Skip if it's a summary line
      if (lowerLine.includes('vat [%]') && lowerLine.includes('net worth') && lowerLine.includes('gross worth')) {
        break;
      }

      // Try to match line item pattern
      let match = line.match(lineItemPattern) || line.match(lineItemPattern2);

      if (match) {
        // Found a complete line item
        let description = match[1].trim();

        // Remove line number prefix
        description = description.replace(lineNumberPattern, '').trim();

        // If we accumulated a description from previous lines, prepend it
        if (currentDescription) {
          description = currentDescription + ' ' + description;
          currentDescription = '';
        }

        const rawQty = this.parseNumber(match[2]);
        const qty = rawQty <= 50 ? Math.round(rawQty) : 1; // Quantities are typically <= 50
        const unitPrice = this.parseNumber(match[3]);
        const grossWorth = this.parseNumber(match[match.length - 1]);
        const cleanedDesc = this.cleanDescription(description);

        if (cleanedDesc.length >= 2 && grossWorth > 0) {
          items.push({
            description: cleanedDesc,
            quantity: qty,
            unitPrice: unitPrice,
            lineTotal: grossWorth,
            confidence: 0.85,
          });
        }
      } else {
        // Check if this line has prices (might be a complete item on one line)
        const priceMatch = line.match(/(\d+[,\.]\d{2})\s+(?:each|pcs|unit)?\s*([\d,\.]+)\s+([\d,\.]+)\s+\d+%\s+([\d,\.]+)/i);

        if (priceMatch) {
          // Line has prices - extract description before the qty
          const priceStart = line.indexOf(priceMatch[0]);
          let description = line.substring(0, priceStart).trim();
          description = description.replace(lineNumberPattern, '').trim();

          if (currentDescription) {
            description = currentDescription + ' ' + description;
            currentDescription = '';
          }

          const rawQty = this.parseNumber(priceMatch[1]);
          const qty = rawQty <= 50 ? Math.round(rawQty) : 1;
          const unitPrice = this.parseNumber(priceMatch[2]);
          const grossWorth = this.parseNumber(priceMatch[4]);
          const cleanedDesc = this.cleanDescription(description);

          if (cleanedDesc.length >= 2 && grossWorth > 0) {
            items.push({
              description: cleanedDesc,
              quantity: qty,
              unitPrice: unitPrice,
              lineTotal: grossWorth,
              confidence: 0.85,
            });
          }
        } else if (line.length > 3 && !/^\d+%/.test(line)) {
          // Continuation line (description text)
          if (!lowerLine.includes('summary') && !lowerLine.includes('total') &&
              !lowerLine.includes('vat') && !lowerLine.includes('subtotal')) {
            currentDescription += ' ' + line;
          }
        }
      }
    }

    return items;
  }

  /**
   * Detect table structure by analyzing column positions
   */
  private detectTableStructure(lines: string[], config: RuntimeConfig): { items: OCRLineItem[], headerIndex: number } {
    const items: OCRLineItem[] = [];
    let headerIndex = -1;

    // Find the header row by looking for table header keywords
    for (let i = 0; i < lines.length; i++) {
      const lowerLine = lines[i].toLowerCase();
      const matchedKeywords = config.tableHeaderKeywords.filter(kw => lowerLine.includes(kw));

      if (matchedKeywords.length >= 2) {
        headerIndex = i;
        logger.debug('Found table header', { line: i, matchedKeywords });
        break;
      }
    }

    if (headerIndex === -1) {
      return { items: [], headerIndex: -1 };
    }

    // Analyze header to determine column positions
    const headerLine = lines[headerIndex].toLowerCase();
    const columns = this.identifyColumns(headerLine);

    if (!columns.hasDescription || !columns.hasAmount) {
      return { items: [], headerIndex: -1 };
    }

    // Extract data rows after header
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();

      // Stop at summary section
      if (lowerLine === 'summary' || lowerLine.includes('subtotal')) {
        break;
      }

      // Stop at VAT/Tax lines that are part of summary
      if ((lowerLine.includes('vat [%]') || lowerLine.includes('tax [%]')) &&
          !lowerLine.match(/\d+[,\.]\d{2}\s+each/)) {
        break;
      }

      // Skip excluded keywords
      if (config.excludeKeywords.some(kw => lowerLine.includes(kw))) {
        continue;
      }

      // Skip short lines that are likely continuations
      if (line.length < 10 || !/\d/.test(line)) {
        continue;
      }

      // Try to parse the row
      const item = this.parseTableRow(line, columns);
      if (item) {
        items.push(item);
        logger.debug('Parsed item', { description: item.description.substring(0, 30), total: item.lineTotal });
      }
    }

    return { items, headerIndex };
  }

  /**
   * Identify columns in header row
   */
  private identifyColumns(headerLine: string): {
    hasDescription: boolean;
    hasQuantity: boolean;
    hasUnitPrice: boolean;
    hasAmount: boolean;
  } {
    return {
      hasDescription: /description|item|product|service|particulars/i.test(headerLine),
      hasQuantity: /qty|quantity|units|no\./i.test(headerLine),
      hasUnitPrice: /price|rate|unit/i.test(headerLine),
      hasAmount: /amount|total|gross|net worth/i.test(headerLine),
    };
  }

  /**
   * Parse a table row into a line item - DYNAMIC APPROACH
   * This method uses a flexible strategy to extract line items from OCR text
   */
  private parseTableRow(line: string, _columns: Record<string, boolean>): OCRLineItem | null {
    // Preprocess: fix thousand separators (e.g., "1 149,75" -> "1149,75")
    const preprocessedLine = line.replace(/(\d)\s+(\d{3}[,\.])/g, '$1$2');

    // DYNAMIC STRATEGY: Extract all numeric values and text portions
    // This is more flexible than rigid regex patterns

    // Pattern to find all numbers (including European format with comma as decimal)
    const numberPattern = /[\d]+[,\.][\d]+|\d+/g;
    const allNumberMatches = [...preprocessedLine.matchAll(numberPattern)];

    if (allNumberMatches.length < 2) {
      // Need at least qty and total, or just total with some description
      return null;
    }

    // Extract numeric values with their positions
    const numbersWithPos = allNumberMatches.map(m => ({
      value: this.parseNumber(m[0]),
      raw: m[0],
      start: m.index || 0,
      end: (m.index || 0) + m[0].length
    }));

    // Find the description: text portion before the main numeric data
    // Usually between start of line (or after line number) and the first price-like number
    let descStart = 0;
    let descEnd = preprocessedLine.length;

    // Check if line starts with a line number marker (e.g., "1.", "2:", "ik", etc.)
    const lineNumberMatch = preprocessedLine.match(/^(?:(\d+)[\.\:\)]|([a-z]{1,2}))\s*/i);
    if (lineNumberMatch) {
      descStart = lineNumberMatch[0].length;
    }

    // Find where the numeric columns start (look for pattern like "qty unit price...")
    // Usually there are multiple consecutive numbers toward the end
    const priceAreaStart = this.findPriceAreaStart(numbersWithPos, preprocessedLine);
    if (priceAreaStart > descStart) {
      descEnd = priceAreaStart;
    }

    // Extract description
    let description = preprocessedLine.substring(descStart, descEnd).trim();

    // Clean up description: remove trailing unit words
    // Clean the description
    const cleanedDesc = this.cleanDescription(description);

    if (cleanedDesc.length < 2) {
      return null;
    }

    // Extract the numeric values from the price area
    const priceNumbers = numbersWithPos.filter(n => n.start >= priceAreaStart);

    if (priceNumbers.length === 0) {
      // Fall back to using all numbers
      const nums = numbersWithPos.map(n => n.value);
      if (nums.length >= 1) {
        const lineTotal = nums[nums.length - 1];
        if (lineTotal > 0) {
          return {
            description: cleanedDesc,
            quantity: 1,
            unitPrice: lineTotal,
            lineTotal,
            confidence: 0.5,
          };
        }
      }
      return null;
    }

    // Analyze the price numbers to determine qty, unit price, and total
    const nums = priceNumbers.map(n => n.value);
    const rawNums = priceNumbers.map(n => n.raw);
    const lineTotal = nums[nums.length - 1]; // Last number is typically the gross/total

    let quantity = 1;
    let unitPrice = lineTotal;

    // Helper: check if a number looks like a quantity (small integer, or X,00/X.00 format)
    const isLikelyQuantity = (num: number, raw: string): boolean => {
      if (num <= 0 || num > 50) return false; // Quantities rarely exceed 50
      // Check if it's a whole number (1, 2, 3...) or ends with ,00/.00
      const isWholeOrZeroDecimal = num === Math.floor(num) || /[,\.](00|0)$/.test(raw);
      return isWholeOrZeroDecimal;
    };

    if (nums.length >= 4) {
      // Pattern: qty, unit_price, net_worth, gross (possibly with VAT% between)
      if (isLikelyQuantity(nums[0], rawNums[0])) {
        quantity = Math.round(nums[0]); // Round to ensure integer
        unitPrice = nums[1];
      } else {
        unitPrice = nums[0];
      }
    } else if (nums.length >= 3) {
      // Pattern: qty, unit_price, total OR unit_price, net_worth, gross
      if (isLikelyQuantity(nums[0], rawNums[0])) {
        quantity = Math.round(nums[0]);
        unitPrice = nums[1];
      } else {
        unitPrice = nums[0];
      }
    } else if (nums.length >= 2) {
      // Pattern: qty, total OR unit_price, total
      if (isLikelyQuantity(nums[0], rawNums[0])) {
        quantity = Math.round(nums[0]);
        unitPrice = lineTotal / quantity;
      } else {
        unitPrice = nums[0];
      }
    }

    if (lineTotal > 0 && cleanedDesc.length <= 200) {
      return {
        description: cleanedDesc,
        quantity,
        unitPrice,
        lineTotal,
        confidence: nums.length >= 3 ? 0.75 : 0.6,
      };
    }

    return null;
  }

  /**
   * Find where the price/numeric area starts in a line
   * Looks for consecutive numbers that represent qty, prices, totals
   */
  private findPriceAreaStart(
    numbers: Array<{ value: number; raw: string; start: number; end: number }>,
    line: string
  ): number {
    if (numbers.length < 2) {
      return line.length;
    }

    // Look for a cluster of numbers at the end of the line
    // Price area typically has multiple numbers close together
    for (let i = 0; i < numbers.length - 1; i++) {
      const current = numbers[i];
      const next = numbers[i + 1];
      const gap = next.start - current.end;
      const textBetween = line.substring(current.end, next.start);

      // Check if this looks like the start of tabular data
      // Gap should be small OR contain unit words like "each"
      if (gap < 20 || /^\s*(each|pcs|pc|unit|units|hrs|%)\s*$/i.test(textBetween)) {
        // Found the start of price columns
        // But first, check if the current number looks like a quantity (small integer)
        if (current.value < 100 && current.value === Math.floor(current.value)) {
          return current.start;
        }
        // Otherwise this might be the unit price
        return current.start;
      }
    }

    // Default: assume the last few numbers are prices
    // Return position just before the first number in the last cluster
    if (numbers.length >= 2) {
      return numbers[numbers.length - 2].start;
    }

    return numbers[numbers.length - 1].start;
  }
  /**
   * Pattern-based extraction fallback
   */
  private extractWithPatternMatching(lines: string[], config: RuntimeConfig): OCRLineItem[] {
    const items: OCRLineItem[] = [];

    // Use patterns from config, or default patterns if not provided
    const patterns = config.lineItemPatterns.length > 0
      ? config.lineItemPatterns
      : [
          // European format: "1. Description 3,00 each 149,95 449,85 10% 494,83"
          /^(?:\d+[\.\:\)]|[a-z]{1,2})\s*(.+?)\s+(\d+[,\.]\d{2})\s+\w+\s+([\d,\.]+)\s+([\d,\.]+)\s+\d+%\s+([\d,\.]+)$/i,
          // Format with unit keyword: "Description 3,00 each 149,95 449,85 10% 494,83"
          /^(?:\d+[\.\:\)]|[a-z]{1,2})?\s*(.+?)\s+(\d+[,\.]\d{2})\s+(?:each|pcs|pc|unit|units)\s+([\d,\.]+)\s+([\d,\.]+)\s+\d+%?\s*([\d,\.]+)$/i,
          // Number. Description Qty Unit Price Total
          /^(\d+)[\.\)]\s*(.+?)\s+(\d+[,\.]?\d*)\s+\w*\s*([\d,\.]+)\s+([\d,\.]+)/,
          // Description Qty $Price $Total
          /^(.+?)\s+(\d+)\s+[\$€£]?([\d,\.]+)\s+[\$€£]?([\d,\.]+)$/,
          // Description $Amount
          /^([A-Za-z][A-Za-z0-9\s\-\/]+?)\s+[\$€£]?([\d,\.]+)$/,
        ];

    for (const line of lines) {
      const trimmedLine = line.trim();
      const lowerLine = trimmedLine.toLowerCase();

      // Skip excluded lines
      if (config.excludeKeywords.some(kw => lowerLine.includes(kw))) continue;
      if (trimmedLine.length < 5) continue;

      for (const pattern of patterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          const item = this.parseMatchResult(match);
          if (item && item.lineTotal > 0 && item.description.length >= 2) {
            items.push(item);
            break;
          }
        }
      }
    }

    return items;
  }

  /**
   * Parse regex match result into line item
   */
  private parseMatchResult(match: RegExpMatchArray): OCRLineItem | null {
    const groups = match.slice(1);

    // Find description (non-numeric part)
    let description = '';
    const numbers: number[] = [];

    for (const group of groups) {
      if (!group) continue;
      const num = this.parseNumber(group);
      if (num > 0 && /^[\d,\.]+$/.test(group.trim())) {
        numbers.push(num);
      } else if (group.length > 1 && !/^\d+$/.test(group.trim())) {
        description = group.trim();
      }
    }

    if (!description || numbers.length === 0) return null;

    // Clean the description
    const cleanedDesc = this.cleanDescription(description);
    if (cleanedDesc.length < 2) return null;

    // Helper: check if a number looks like a quantity (small integer <= 50)
    const isLikelyQty = (n: number): boolean => n > 0 && n <= 50 && n === Math.floor(n);

    let quantity = 1;
    let unitPrice = numbers[numbers.length - 1];
    let lineTotal = numbers[numbers.length - 1];

    if (numbers.length >= 3) {
      if (isLikelyQty(numbers[0])) {
        quantity = numbers[0];
        unitPrice = numbers[1];
      } else {
        unitPrice = numbers[0];
      }
      lineTotal = numbers[numbers.length - 1];
    } else if (numbers.length >= 2) {
      // Could be qty+total or unitPrice+total
      if (isLikelyQty(numbers[0])) {
        quantity = numbers[0];
        lineTotal = numbers[1];
        unitPrice = lineTotal / quantity;
      } else {
        unitPrice = numbers[0];
        lineTotal = numbers[1];
      }
    }

    return {
      description: cleanedDesc,
      quantity,
      unitPrice,
      lineTotal,
      confidence: 0.7,
    };
  }
}

export default new TesseractService();

