/**
 * Supplier Service
 * Business logic for supplier operations
 */

import SupplierRepository, { 
  Supplier, 
  CreateSupplierData, 
  UpdateSupplierData, 
  SupplierListParams 
} from './supplier.repository';
import { normalizeText } from '../../utils/text-utils';
import { logger } from '../../utils/logger';

export default class SupplierService {
  /**
   * Create a new supplier
   */
  static async createSupplier(data: Omit<CreateSupplierData, 'normalizedName'>): Promise<Supplier> {
    // Auto-generate normalized name
    const normalizedName = normalizeText(data.name);

    // Check if supplier with same normalized name exists
    const existing = await SupplierRepository.findByNormalizedName(normalizedName);
    if (existing) {
      throw new Error('Supplier with similar name already exists');
    }

    return SupplierRepository.create({
      ...data,
      normalizedName,
    });
  }

  /**
   * Get supplier by ID
   */
  static async getSupplierById(id: string): Promise<Supplier> {
    const supplier = await SupplierRepository.findById(id);
    if (!supplier) {
      throw new Error('Supplier not found');
    }
    return supplier;
  }

  /**
   * Get suppliers with pagination and filters
   */
  static async getSuppliers(params: SupplierListParams): Promise<{
    suppliers: Supplier[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { suppliers, total } = await SupplierRepository.findAll(params);
    const page = params.page || 1;
    const limit = params.limit || 50;

    return {
      suppliers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update a supplier
   */
  static async updateSupplier(id: string, data: Omit<UpdateSupplierData, 'normalizedName'> & { name?: string }): Promise<Supplier> {
    // Verify supplier exists
    await this.getSupplierById(id);

    const updateData: UpdateSupplierData = { ...data };

    // Auto-update normalized name if name is changed
    if (data.name) {
      updateData.normalizedName = normalizeText(data.name);
      
      // Check if another supplier has this normalized name
      const existing = await SupplierRepository.findByNormalizedName(updateData.normalizedName);
      if (existing && existing.id !== id) {
        throw new Error('Supplier with similar name already exists');
      }
    }

    const updated = await SupplierRepository.update(id, updateData);
    if (!updated) {
      throw new Error('Failed to update supplier');
    }

    return updated;
  }

  /**
   * Delete a supplier
   */
  static async deleteSupplier(id: string): Promise<void> {
    // Verify supplier exists
    await this.getSupplierById(id);

    const deleted = await SupplierRepository.delete(id);
    if (!deleted) {
      throw new Error('Failed to delete supplier');
    }

    logger.info('Supplier deleted', { supplierId: id });
  }

  /**
   * Search suppliers by name
   */
  static async searchSuppliers(searchTerm: string, limit: number = 10): Promise<Supplier[]> {
    return SupplierRepository.searchByName(searchTerm, limit);
  }

  /**
   * Find or create supplier by name
   */
  static async findOrCreate(name: string): Promise<{ supplier: Supplier; created: boolean }> {
    const normalizedName = normalizeText(name);
    
    // Try to find existing
    const existing = await SupplierRepository.findByNormalizedName(normalizedName);
    if (existing) {
      return { supplier: existing, created: false };
    }

    // Create new
    const supplier = await SupplierRepository.create({
      name,
      normalizedName,
    });

    return { supplier, created: true };
  }
}

