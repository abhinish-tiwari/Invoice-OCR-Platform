/**
 * Product Service
 * Business logic for product operations
 */

import ProductRepository, { 
  Product, 
  CreateProductData, 
  UpdateProductData, 
  ProductListParams 
} from './product.repository';
import { normalizeText } from '../../utils/text-utils';
import { logger } from '../../utils/logger';

export default class ProductService {
  /**
   * Create a new product
   */
  static async createProduct(data: Omit<CreateProductData, 'normalizedName'>): Promise<Product> {
    // Auto-generate normalized name if not provided
    const normalizedName = normalizeText(data.name);

    // Check if product with same normalized name exists
    const existing = await ProductRepository.findByNormalizedName(normalizedName);
    if (existing) {
      throw new Error('Product with similar name already exists');
    }

    return ProductRepository.create({
      ...data,
      normalizedName,
    });
  }

  /**
   * Get product by ID
   */
  static async getProductById(id: string): Promise<Product> {
    const product = await ProductRepository.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  /**
   * Get products with pagination and filters
   */
  static async getProducts(params: ProductListParams): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { products, total } = await ProductRepository.findAll(params);
    const page = params.page || 1;
    const limit = params.limit || 50;

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update a product
   */
  static async updateProduct(id: string, data: Omit<UpdateProductData, 'normalizedName'> & { name?: string }): Promise<Product> {
    // Verify product exists
    await this.getProductById(id);

    const updateData: UpdateProductData = { ...data };

    // Auto-update normalized name if name is changed
    if (data.name) {
      updateData.normalizedName = normalizeText(data.name);
      
      // Check if another product has this normalized name
      const existing = await ProductRepository.findByNormalizedName(updateData.normalizedName);
      if (existing && existing.id !== id) {
        throw new Error('Product with similar name already exists');
      }
    }

    const updated = await ProductRepository.update(id, updateData);
    if (!updated) {
      throw new Error('Failed to update product');
    }

    return updated;
  }

  /**
   * Delete a product
   */
  static async deleteProduct(id: string): Promise<void> {
    // Verify product exists
    await this.getProductById(id);

    const deleted = await ProductRepository.delete(id);
    if (!deleted) {
      throw new Error('Failed to delete product');
    }

    logger.info('Product deleted', { productId: id });
  }

  /**
   * Get all categories
   */
  static async getCategories(): Promise<string[]> {
    return ProductRepository.getCategories();
  }

  /**
   * Search products by name
   */
  static async searchProducts(searchTerm: string, limit: number = 10): Promise<Product[]> {
    return ProductRepository.searchByName(searchTerm, limit);
  }

  /**
   * Bulk create products
   */
  static async bulkCreate(products: Array<Omit<CreateProductData, 'normalizedName'>>): Promise<{
    created: Product[];
    skipped: string[];
  }> {
    const created: Product[] = [];
    const skipped: string[] = [];

    for (const productData of products) {
      try {
        const product = await this.createProduct(productData);
        created.push(product);
      } catch (error) {
        skipped.push(productData.name);
        logger.warn('Skipped product during bulk create', { name: productData.name, error });
      }
    }

    return { created, skipped };
  }
}

