/**
 * Analytics Controller
 * HTTP request handlers for analytics endpoints
 */

import { Request, Response } from 'express';
import AnalyticsService from './analytics.service';
import { asyncHandler } from '../../middleware/error.middleware';
import { logger } from '../../utils/logger';

export default class AnalyticsController {
  /**
   * Get complete dashboard analytics
   * @route GET /api/v1/analytics/dashboard
   * @access Private
   */
  static getDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    const dashboard = await AnalyticsService.getDashboard(userId);

    logger.info('Dashboard analytics fetched', { userId });

    res.json({
      success: true,
      data: dashboard,
    });
  });

  /**
   * Get spending trends by month
   * @route GET /api/v1/analytics/spending-trends
   * @access Private
   */
  static getSpendingTrends = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const months = req.query.months ? parseInt(req.query.months as string, 10) : 12;

    const trends = await AnalyticsService.getSpendingTrends(userId, months);

    res.json({
      success: true,
      data: trends,
    });
  });

  /**
   * Get spending breakdown by supplier
   * @route GET /api/v1/analytics/supplier-breakdown
   * @access Private
   */
  static getSupplierBreakdown = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const breakdown = await AnalyticsService.getSupplierBreakdown(userId, limit);

    res.json({
      success: true,
      data: breakdown,
    });
  });

  /**
   * Get invoice status distribution
   * @route GET /api/v1/analytics/status-distribution
   * @access Private
   */
  static getStatusDistribution = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    const distribution = await AnalyticsService.getStatusDistribution(userId);

    res.json({
      success: true,
      data: distribution,
    });
  });

  /**
   * Get top products by spending
   * @route GET /api/v1/analytics/top-products
   * @access Private
   */
  static getTopProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const products = await AnalyticsService.getTopProducts(userId, limit);

    res.json({
      success: true,
      data: products,
    });
  });

  /**
   * Get dashboard summary
   * @route GET /api/v1/analytics/summary
   * @access Private
   */
  static getSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    const summary = await AnalyticsService.getSummary(userId);

    res.json({
      success: true,
      data: summary,
    });
  });
}

