import { Router } from 'express';
import InvoiceController from './invoice.controller';
import { authenticate, validate } from '../auth/auth.middleware';
import { 
  getInvoicesSchema, 
  getInvoiceByIdSchema, 
  updateInvoiceSchema, 
  deleteInvoiceSchema 
} from './invoice.validation';
import { invoiceUpload } from '../../config/upload.config';
import { uploadLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

// All invoice routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/invoices/upload
 * @desc    Upload a new invoice file
 * @access  Private
 */
router.post(
  '/upload',
  uploadLimiter,
  invoiceUpload.single('file'),
  InvoiceController.upload
);

/**
 * @route   GET /api/v1/invoices/stats
 * @desc    Get invoice status counts for dashboard
 * @access  Private
 * @note    This route must be before /:id to avoid conflict
 */
router.get('/stats', InvoiceController.getStats);

/**
 * @route   GET /api/v1/invoices/export
 * @desc    Export invoices to CSV, Excel, or PDF
 * @access  Private
 * @query   format - Export format: csv, excel, pdf (default: csv)
 * @query   ids - Comma-separated list of invoice IDs to export (optional)
 */
router.get('/export', InvoiceController.export);

/**
 * @route   GET /api/v1/invoices
 * @desc    Get all invoices for the current user (paginated)
 * @access  Private
 */
router.get('/', validate(getInvoicesSchema), InvoiceController.getAll);

/**
 * @route   GET /api/v1/invoices/:id
 * @desc    Get a single invoice by ID
 * @access  Private
 */
router.get('/:id', validate(getInvoiceByIdSchema), InvoiceController.getById);

/**
 * @route   GET /api/v1/invoices/:id/lines
 * @desc    Get line items for an invoice
 * @access  Private
 */
router.get('/:id/lines', validate(getInvoiceByIdSchema), InvoiceController.getLineItems);

/**
 * @route   PUT /api/v1/invoices/:id/lines/:lineId
 * @desc    Update a line item
 * @access  Private
 */
router.put('/:id/lines/:lineId', InvoiceController.updateLineItem);

/**
 * @route   POST /api/v1/invoices/:id/review
 * @desc    Mark invoice as reviewed
 * @access  Private
 */
router.post('/:id/review', validate(getInvoiceByIdSchema), InvoiceController.markReviewed);

/**
 * @route   PUT /api/v1/invoices/:id
 * @desc    Update an invoice
 * @access  Private
 */
router.put('/:id', validate(updateInvoiceSchema), InvoiceController.update);

/**
 * @route   DELETE /api/v1/invoices/:id
 * @desc    Delete an invoice
 * @access  Private
 */
router.delete('/:id', validate(deleteInvoiceSchema), InvoiceController.delete);

export default router;

