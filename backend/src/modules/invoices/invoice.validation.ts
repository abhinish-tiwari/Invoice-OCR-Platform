import { z } from 'zod';
import MESSAGES from '../../constants/messages';

// Valid invoice statuses
const INVOICE_STATUSES = ['PENDING', 'PROCESSING', 'PARSED', 'NEEDS_REVIEW', 'REVIEWED', 'FAILED'] as const;

// Valid sort columns
const SORT_COLUMNS = ['created_at', 'invoice_date', 'total_amount'] as const;

// Valid sort orders
const SORT_ORDERS = ['ASC', 'DESC'] as const;

/**
 * Schema for getting invoice list with pagination and filters
 */
export const getInvoicesSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val > 0, { message: 'Page must be a positive number' }),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine((val) => val > 0 && val <= 100, { message: 'Limit must be between 1 and 100' }),
    status: z.enum(INVOICE_STATUSES).optional(),
    startDate: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Invalid start date format' })
      .transform((val) => (val ? new Date(val) : undefined)),
    endDate: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Invalid end date format' })
      .transform((val) => (val ? new Date(val) : undefined)),
    sortBy: z.enum(SORT_COLUMNS).optional().default('created_at'),
    sortOrder: z.enum(SORT_ORDERS).optional().default('DESC'),
  }),
});

/**
 * Schema for getting a single invoice by ID
 */
export const getInvoiceByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid invoice ID format' }),
  }),
});

/**
 * Schema for updating an invoice
 */
export const updateInvoiceSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid invoice ID format' }),
  }),
  body: z.object({
    supplierId: z.string().uuid().optional(),
    invoiceDate: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Invalid date format' })
      .transform((val) => (val ? new Date(val) : undefined)),
    invoiceNumber: z.string().max(100).optional(),
    status: z.enum(INVOICE_STATUSES).optional(),
    totalAmount: z.number().positive().optional(),
    currency: z.string().length(3).optional(),
  }),
});

/**
 * Schema for deleting an invoice
 */
export const deleteInvoiceSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid invoice ID format' }),
  }),
});

// Type exports for use in controllers
export type GetInvoicesInput = z.infer<typeof getInvoicesSchema>;
export type GetInvoiceByIdInput = z.infer<typeof getInvoiceByIdSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type DeleteInvoiceInput = z.infer<typeof deleteInvoiceSchema>;

