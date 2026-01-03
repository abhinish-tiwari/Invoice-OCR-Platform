/**
 * Extraction Configuration Controller
 * API endpoints for managing OCR extraction configurations
 */

import { Request, Response, NextFunction } from 'express';
import { extractionConfigManager, ExtractionConfig, VendorConfig } from './extraction-config';
import { logger } from '../../utils/logger';

export class ExtractionConfigController {
  /**
   * List all available extraction configurations
   */
  static async listConfigs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const configs = extractionConfigManager.listConfigs();
      res.json({
        success: true,
        data: configs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific configuration by name
   */
  static async getConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.params;
      const config = extractionConfigManager.getConfig(name);
      
      if (!config) {
        res.status(404).json({
          success: false,
          error: 'Configuration not found',
        });
        return;
      }

      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create or update a configuration
   */
  static async saveConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = req.body as ExtractionConfig | VendorConfig;

      // Validate required fields
      if (!config.name || !config.headerPatterns) {
        res.status(400).json({
          success: false,
          error: 'Invalid configuration: name and headerPatterns are required',
        });
        return;
      }

      // Save the configuration
      const configName = 'vendorId' in config ? config.vendorId : config.name;
      extractionConfigManager.saveConfig(configName, config);

      logger.info('📋 Configuration saved', { name: configName });

      res.json({
        success: true,
        message: `Configuration '${configName}' saved successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Test a configuration against sample text
   */
  static async testConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { configName, sampleText } = req.body;

      if (!sampleText) {
        res.status(400).json({
          success: false,
          error: 'Sample text is required',
        });
        return;
      }

      const config = extractionConfigManager.getConfig(configName);
      const patterns = extractionConfigManager.compilePatterns(config.headerPatterns.invoiceNumber);
      
      // Test invoice number extraction
      let invoiceNumber: string | null = null;
      for (const pattern of patterns) {
        const match = sampleText.match(pattern);
        if (match && match[1]) {
          invoiceNumber = match[1];
          break;
        }
      }

      res.json({
        success: true,
        data: {
          configUsed: config.name,
          testResults: {
            invoiceNumber,
            // Add more test results as needed
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

