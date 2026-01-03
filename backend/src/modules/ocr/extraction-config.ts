/**
 * Dynamic Extraction Configuration System
 * Allows customizing extraction rules per vendor or invoice type
 */

import fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logger';

// Extraction configuration interface
export interface ExtractionConfig {
  name: string;
  version: string;
  // Patterns for header fields
  headerPatterns: {
    invoiceNumber: string[];  // Regex patterns as strings
    date: string[];
    total: string[];
    subtotal: string[];
    tax: string[];
    vendor: string[];
  };
  // Keywords that indicate table headers
  tableHeaderKeywords: string[];
  // Keywords to exclude from line items
  excludeKeywords: string[];
  // Minimum confidence for extracted values
  minConfidence: number;
  // Line item patterns (regex as strings)
  lineItemPatterns: string[];
}

// Vendor-specific configuration
export interface VendorConfig extends ExtractionConfig {
  vendorId: string;
  vendorNames: string[];  // Names/patterns to match vendor
}

// Default extraction configuration
export const DEFAULT_CONFIG: ExtractionConfig = {
  name: 'default',
  version: '1.0.0',
  headerPatterns: {
    invoiceNumber: [
      'invoice\\s*(?:#|no\\.?|number)?:?\\s*([A-Z0-9\\-]+)',
      'inv\\s*(?:#|no\\.?)?:?\\s*([A-Z0-9\\-]+)',
      '(?:^|\\s)#\\s*(\\d{5,})',
    ],
    date: [
      '(?:date|dated?|invoice\\s*date):?\\s*(\\d{1,2}[\\/\\-\\.]\\d{1,2}[\\/\\-\\.]\\d{2,4})',
      '(\\d{1,2}[\\/\\-\\.]\\d{1,2}[\\/\\-\\.]\\d{2,4})',
      '(\\d{4}[\\/\\-\\.]\\d{1,2}[\\/\\-\\.]\\d{1,2})',
    ],
    total: [
      '(?:total|grand\\s*total|amount\\s*due|balance\\s*due):?\\s*[\\$€£]?\\s*([\\d,]+\\.?\\d{0,2})',
      '(?:total|sum):?\\s*([\\d,]+[.,]\\d{2})',
    ],
    subtotal: [
      '(?:subtotal|sub\\s*total|net\\s*worth):?\\s*[\\$€£]?\\s*([\\d,]+\\.?\\d{0,2})',
    ],
    tax: [
      '(?:tax|vat|gst):?\\s*[\\$€£]?\\s*([\\d,]+\\.?\\d{0,2})',
      '(?:tax|vat)\\s*\\(?\\d+%?\\)?:?\\s*[\\$€£]?\\s*([\\d,]+\\.?\\d{0,2})',
    ],
    vendor: [
      '^([A-Z][A-Za-z\\s&]+(?:Inc\\.?|LLC|Ltd\\.?|Corp\\.?)?)',
    ],
  },
  tableHeaderKeywords: [
    'description', 'item', 'product', 'service', 'particulars',
    'qty', 'quantity', 'units', 'no.',
    'price', 'rate', 'unit price', 'net price',
    'amount', 'total', 'net worth', 'gross',
  ],
  excludeKeywords: [
    'invoice', 'bill', 'date', 'from', 'to', 'address', 'phone', 'email',
    'payment', 'due', 'terms', 'thank', 'page', 'customer', 'client',
    'seller', 'buyer', 'ship', 'bank', 'account', 'iban', 'tax id',
  ],
  minConfidence: 0.5,
  lineItemPatterns: [
    '^(\\d+)[\\.)\\s]\\s*(.+?)\\s+(\\d+)\\s+\\w*\\s*([\\d,\\.]+)\\s+([\\d,\\.]+)',
    '^(.+?)\\s+(\\d+)\\s+[\\$€£]?([\\d,\\.]+)\\s+[\\$€£]?([\\d,\\.]+)$',
    '^([A-Za-z][A-Za-z0-9\\s\\-\\/]+?)\\s+[\\$€£]?([\\d,\\.]+)$',
  ],
};

// Configuration manager class
class ExtractionConfigManager {
  private configs: Map<string, ExtractionConfig> = new Map();
  private vendorConfigs: Map<string, VendorConfig> = new Map();
  private configPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), 'config', 'extraction-rules');
    this.configs.set('default', DEFAULT_CONFIG);
    this.loadConfigsFromFiles();
  }

  /**
   * Load configurations from JSON files in the config directory
   */
  private loadConfigsFromFiles(): void {
    try {
      if (!fs.existsSync(this.configPath)) {
        fs.mkdirSync(this.configPath, { recursive: true });
        // Save default config as example
        this.saveConfig('default', DEFAULT_CONFIG);
        logger.info('📁 Created extraction config directory with default config');
        return;
      }

      const files = fs.readdirSync(this.configPath).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(this.configPath, file), 'utf-8');
          const config = JSON.parse(content) as ExtractionConfig | VendorConfig;
          
          if ('vendorId' in config) {
            this.vendorConfigs.set(config.vendorId, config as VendorConfig);
            logger.info(`📋 Loaded vendor config: ${config.vendorId}`);
          } else {
            this.configs.set(config.name, config);
            logger.info(`📋 Loaded extraction config: ${config.name}`);
          }
        } catch (err) {
          logger.error(`Failed to load config file: ${file}`, { error: err });
        }
      }
    } catch (err) {
      logger.error('Failed to load extraction configs', { error: err });
    }
  }

  /**
   * Get configuration by name
   */
  getConfig(name: string = 'default'): ExtractionConfig {
    return this.configs.get(name) || DEFAULT_CONFIG;
  }

  /**
   * Find vendor-specific config by matching vendor name in text
   */
  findVendorConfig(text: string): VendorConfig | null {
    const lowerText = text.toLowerCase();
    for (const [, config] of this.vendorConfigs) {
      if (config.vendorNames.some(name => lowerText.includes(name.toLowerCase()))) {
        logger.info(`🏢 Found vendor-specific config: ${config.vendorId}`);
        return config;
      }
    }
    return null;
  }

  /**
   * Save configuration to file
   */
  saveConfig(name: string, config: ExtractionConfig | VendorConfig): void {
    const filePath = path.join(this.configPath, `${name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
    
    if ('vendorId' in config) {
      this.vendorConfigs.set(config.vendorId, config as VendorConfig);
    } else {
      this.configs.set(name, config);
    }
  }

  /**
   * Convert string patterns to RegExp
   */
  compilePatterns(patterns: string[]): RegExp[] {
    return patterns.map(p => new RegExp(p, 'i'));
  }

  /**
   * Get all available configs
   */
  listConfigs(): { name: string; type: 'general' | 'vendor' }[] {
    const list: { name: string; type: 'general' | 'vendor' }[] = [];
    for (const [name] of this.configs) {
      list.push({ name, type: 'general' });
    }
    for (const [name] of this.vendorConfigs) {
      list.push({ name, type: 'vendor' });
    }
    return list;
  }
}

// Singleton instance
export const extractionConfigManager = new ExtractionConfigManager();

