/**
 * Product Controller
 * HTTP handlers for product operations
 */

import { Request, Response, NextFunction } from 'express';
import ProductService from './product.service';
import { logger } from '../../utils/logger';

/**
 * Create a new product
 * POST /api/v1/products
 */
export async function createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, packSize, category, unit, metadata } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Product name is required' });
      return;
    }

    const product = await ProductService.createProduct({
      name,
      packSize,
      category,
      unit,
      metadata,
    });

    logger.info('Product created', { productId: product.id });
    res.status(201).json(product);
  } catch (error: any) {
    if (error.message === 'Product with similar name already exists') {
      res.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
}

/**
 * Get product by ID
 * GET /api/v1/products/:id
 */
export async function getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const product = await ProductService.getProductById(id);
    res.json(product);
  } catch (error: any) {
    if (error.message === 'Product not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
}

/**
 * List products with pagination and filters
 * GET /api/v1/products
 */
export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, category, search, sortBy, sortOrder } = req.query;

    const result = await ProductService.getProducts({
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      category: category as string,
      search: search as string,
      sortBy: sortBy as 'name' | 'category' | 'created_at',
      sortOrder: sortOrder as 'ASC' | 'DESC',
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Update a product
 * PUT /api/v1/products/:id
 */
export async function updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { name, packSize, category, unit, metadata } = req.body;

    const product = await ProductService.updateProduct(id, {
      name,
      packSize,
      category,
      unit,
      metadata,
    });

    logger.info('Product updated', { productId: id });
    res.json(product);
  } catch (error: any) {
    if (error.message === 'Product not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error.message === 'Product with similar name already exists') {
      res.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
}

/**
 * Delete a product
 * DELETE /api/v1/products/:id
 */
export async function deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await ProductService.deleteProduct(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Product not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
}

/**
 * Get all categories
 * GET /api/v1/products/categories
 */
export async function getCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await ProductService.getCategories();
    res.json({ categories });
  } catch (error) {
    next(error);
  }
}

/**
 * Search products
 * GET /api/v1/products/search
 */
export async function searchProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q, limit } = req.query;

    if (!q) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const products = await ProductService.searchProducts(
      q as string,
      limit ? parseInt(limit as string, 10) : 10
    );

    res.json({ products });
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk create products
 * POST /api/v1/products/bulk
 */
export async function bulkCreateProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      res.status(400).json({ error: 'Products array is required' });
      return;
    }

    const result = await ProductService.bulkCreate(products);

    logger.info('Bulk products created', {
      created: result.created.length,
      skipped: result.skipped.length
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

