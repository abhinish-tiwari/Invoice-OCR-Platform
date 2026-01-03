/**
 * OCR Routes
 * API endpoints for OCR processing and extraction configuration
 */

import { Router } from 'express';
import OCRController from './ocr.controller';
import { ExtractionConfigController } from './extraction-config.controller';
import { authenticate } from '../auth/auth.middleware';

const router = Router();

// All OCR routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/ocr/process/:invoiceId
 * @desc    Process a single invoice with OCR
 * @access  Private
 */
router.post('/process/:invoiceId', OCRController.processInvoice);

/**
 * @route   POST /api/ocr/process-batch
 * @desc    Process multiple invoices with OCR
 * @access  Private
 */
router.post('/process-batch', OCRController.processBatch);

/**
 * @route   GET /api/ocr/status/:invoiceId
 * @desc    Get OCR processing status
 * @access  Private
 */
router.get('/status/:invoiceId', OCRController.getStatus);

// ==========================================
// Extraction Configuration Routes
// ==========================================

/**
 * @route   GET /api/ocr/configs
 * @desc    List all extraction configurations
 * @access  Private
 */
router.get('/configs', ExtractionConfigController.listConfigs);

/**
 * @route   GET /api/ocr/configs/:name
 * @desc    Get a specific extraction configuration
 * @access  Private
 */
router.get('/configs/:name', ExtractionConfigController.getConfig);

/**
 * @route   POST /api/ocr/configs
 * @desc    Create or update an extraction configuration
 * @access  Private
 */
router.post('/configs', ExtractionConfigController.saveConfig);

/**
 * @route   POST /api/ocr/configs/test
 * @desc    Test a configuration against sample text
 * @access  Private
 */
router.post('/configs/test', ExtractionConfigController.testConfig);

export default router;

