/**
 * Product Matching Controller
 * HTTP handlers for product matching operations
 */

import { Request, Response, NextFunction } from 'express';
import ProductMatchingService from './product-matching.service';
import { logger } from '../../utils/logger';

/**
 * Match a description to a product
 * POST /api/v1/products/match
 */
export async function matchProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { description, options } = req.body;

    if (!description) {
      res.status(400).json({ error: 'Description is required' });
      return;
    }

    const result = await ProductMatchingService.matchProduct(description, options);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Match multiple descriptions in batch
 * POST /api/v1/products/match/batch
 */
export async function matchBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { descriptions, options } = req.body;

    if (!Array.isArray(descriptions) || descriptions.length === 0) {
      res.status(400).json({ error: 'Descriptions array is required' });
      return;
    }

    const results = await ProductMatchingService.matchBatch(descriptions, options);

    // Convert Map to object for JSON response
    const response: Record<string, any> = {};
    results.forEach((value, key) => {
      response[key] = value;
    });

    res.json({ matches: response });
  } catch (error) {
    next(error);
  }
}

/**
 * Get product suggestions for a description
 * GET /api/v1/products/suggestions
 */
export async function getSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q, limit, minConfidence } = req.query;

    if (!q) {
      res.status(400).json({ error: 'Query (q) is required' });
      return;
    }

    const suggestions = await ProductMatchingService.getSuggestions(
      q as string,
      limit ? parseInt(limit as string, 10) : 5,
      minConfidence ? parseFloat(minConfidence as string) : 0.5
    );

    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
}

/**
 * Learn a correction (create alias)
 * POST /api/v1/products/learn
 */
export async function learnCorrection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { rawDescription, productId } = req.body;

    if (!rawDescription || !productId) {
      res.status(400).json({ error: 'rawDescription and productId are required' });
      return;
    }

    await ProductMatchingService.learnCorrection(rawDescription, productId);

    logger.info('Product correction learned', { rawDescription, productId });
    res.json({ success: true, message: 'Correction learned successfully' });
  } catch (error: any) {
    if (error.message === 'Product not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
}

