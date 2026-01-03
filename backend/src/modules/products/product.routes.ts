/**
 * Product Routes
 * API routes for product management
 */

import { Router } from 'express';
import {
  createProduct,
  getProduct,
  listProducts,
  updateProduct,
  deleteProduct,
  getCategories,
  searchProducts,
  bulkCreateProducts,
} from './product.controller';
import {
  matchProduct,
  matchBatch,
  getSuggestions,
  learnCorrection,
} from './product-matching.controller';
import { authenticate } from '../auth/auth.middleware';
import { adminOnly } from '../../middleware/admin.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/products - List all products
router.get('/', listProducts);

// GET /api/v1/products/categories - Get all categories
router.get('/categories', getCategories);

// GET /api/v1/products/search - Search products
router.get('/search', searchProducts);

// GET /api/v1/products/suggestions - Get product suggestions for matching
router.get('/suggestions', getSuggestions);

// POST /api/v1/products/match - Match a description to a product
router.post('/match', matchProduct);

// POST /api/v1/products/match/batch - Match multiple descriptions
router.post('/match/batch', matchBatch);

// GET /api/v1/products/:id - Get product by ID
router.get('/:id', getProduct);

// Admin only routes
router.use(adminOnly);

// POST /api/v1/products - Create product
router.post('/', createProduct);

// POST /api/v1/products/bulk - Bulk create products
router.post('/bulk', bulkCreateProducts);

// POST /api/v1/products/learn - Learn a correction (create alias)
router.post('/learn', learnCorrection);

// PUT /api/v1/products/:id - Update product
router.put('/:id', updateProduct);

// DELETE /api/v1/products/:id - Delete product
router.delete('/:id', deleteProduct);

export default router;

