import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API version info
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Invoice OCR API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      invoices: '/api/v1/invoices',
      analytics: '/api/v1/analytics',
      admin: '/api/v1/admin',
    },
  });
});

// Mount routes
router.use('/auth', authRoutes);

// TODO: Add more routes
// router.use('/invoices', invoiceRoutes);
// router.use('/analytics', analyticsRoutes);
// router.use('/admin', adminRoutes);

export default router;

