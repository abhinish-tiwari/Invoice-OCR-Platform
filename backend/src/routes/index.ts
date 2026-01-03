import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import invoiceRoutes from '../modules/invoices/invoice.routes';
import ocrRoutes from '../modules/ocr/ocr.routes';
import productRoutes from '../modules/products/product.routes';
import supplierRoutes from '../modules/suppliers/supplier.routes';
import analyticsRoutes from '../modules/analytics/analytics.routes';
import adminRoutes from '../modules/admin/admin.routes';
import healthCheck from '../utils/health.check.utils';

const router = Router();

// Health check
router.use('/health', healthCheck);

// Auth routes
router.use('/auth', authRoutes);

// Invoice routes
router.use('/invoices', invoiceRoutes);

// OCR routes
router.use('/ocr', ocrRoutes);

// Product routes
router.use('/products', productRoutes);

// Supplier routes
router.use('/suppliers', supplierRoutes);

// Analytics routes
router.use('/analytics', analyticsRoutes);

// Admin routes
router.use('/admin', adminRoutes);

export default router;