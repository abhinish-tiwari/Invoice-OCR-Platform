/**
 * Analytics Routes
 * API routes for analytics endpoints
 */

import { Router } from 'express';
import AnalyticsController from './analytics.controller';
import { authenticate } from '../auth/auth.middleware';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/analytics/dashboard
 * @desc    Get complete dashboard analytics
 * @access  Private
 */
router.get('/dashboard', AnalyticsController.getDashboard);

/**
 * @route   GET /api/v1/analytics/summary
 * @desc    Get dashboard summary
 * @access  Private
 */
router.get('/summary', AnalyticsController.getSummary);

/**
 * @route   GET /api/v1/analytics/spending-trends
 * @desc    Get spending trends by month
 * @access  Private
 */
router.get('/spending-trends', AnalyticsController.getSpendingTrends);

/**
 * @route   GET /api/v1/analytics/supplier-breakdown
 * @desc    Get spending breakdown by supplier
 * @access  Private
 */
router.get('/supplier-breakdown', AnalyticsController.getSupplierBreakdown);

/**
 * @route   GET /api/v1/analytics/status-distribution
 * @desc    Get invoice status distribution
 * @access  Private
 */
router.get('/status-distribution', AnalyticsController.getStatusDistribution);

/**
 * @route   GET /api/v1/analytics/top-products
 * @desc    Get top products by spending
 * @access  Private
 */
router.get('/top-products', AnalyticsController.getTopProducts);

export default router;

