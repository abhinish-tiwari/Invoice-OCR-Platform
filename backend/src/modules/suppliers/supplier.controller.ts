/**
 * Supplier Controller
 * HTTP handlers for supplier operations
 */

import { Request, Response, NextFunction } from 'express';
import SupplierService from './supplier.service';
import { logger } from '../../utils/logger';

/**
 * Create a new supplier
 * POST /api/v1/suppliers
 */
export async function createSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, contactEmail, contactPhone, metadata } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Supplier name is required' });
      return;
    }

    const supplier = await SupplierService.createSupplier({
      name,
      contactEmail,
      contactPhone,
      metadata,
    });

    logger.info('Supplier created', { supplierId: supplier.id });
    res.status(201).json(supplier);
  } catch (error: any) {
    if (error.message === 'Supplier with similar name already exists') {
      res.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
}

/**
 * Get supplier by ID
 * GET /api/v1/suppliers/:id
 */
export async function getSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const supplier = await SupplierService.getSupplierById(id);
    res.json(supplier);
  } catch (error: any) {
    if (error.message === 'Supplier not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
}

/**
 * List suppliers with pagination and filters
 * GET /api/v1/suppliers
 */
export async function listSuppliers(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, search, sortBy, sortOrder } = req.query;

    const result = await SupplierService.getSuppliers({
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      search: search as string,
      sortBy: sortBy as 'name' | 'created_at',
      sortOrder: sortOrder as 'ASC' | 'DESC',
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Update a supplier
 * PUT /api/v1/suppliers/:id
 */
export async function updateSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { name, contactEmail, contactPhone, metadata } = req.body;

    const supplier = await SupplierService.updateSupplier(id, {
      name,
      contactEmail,
      contactPhone,
      metadata,
    });

    logger.info('Supplier updated', { supplierId: id });
    res.json(supplier);
  } catch (error: any) {
    if (error.message === 'Supplier not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error.message === 'Supplier with similar name already exists') {
      res.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
}

/**
 * Delete a supplier
 * DELETE /api/v1/suppliers/:id
 */
export async function deleteSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await SupplierService.deleteSupplier(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Supplier not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
}

/**
 * Search suppliers
 * GET /api/v1/suppliers/search
 */
export async function searchSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q, limit } = req.query;

    if (!q) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const suppliers = await SupplierService.searchSuppliers(
      q as string,
      limit ? parseInt(limit as string, 10) : 10
    );

    res.json({ suppliers });
  } catch (error) {
    next(error);
  }
}

