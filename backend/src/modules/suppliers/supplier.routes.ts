/**
 * Supplier Routes
 * API routes for supplier management
 */

import { Router } from 'express';
import {
  createSupplier,
  getSupplier,
  listSuppliers,
  updateSupplier,
  deleteSupplier,
  searchSuppliers,
} from './supplier.controller';
import { authenticate } from '../auth/auth.middleware';
import { adminOnly } from '../../middleware/admin.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/suppliers - List all suppliers
router.get('/', listSuppliers);

// GET /api/v1/suppliers/search - Search suppliers
router.get('/search', searchSuppliers);

// GET /api/v1/suppliers/:id - Get supplier by ID
router.get('/:id', getSupplier);

// Admin only routes
router.use(adminOnly);

// POST /api/v1/suppliers - Create supplier
router.post('/', createSupplier);

// PUT /api/v1/suppliers/:id - Update supplier
router.put('/:id', updateSupplier);

// DELETE /api/v1/suppliers/:id - Delete supplier
router.delete('/:id', deleteSupplier);

export default router;

