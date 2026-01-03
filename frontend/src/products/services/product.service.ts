import { ApiService } from '../../common/services/api.service';
import type {
  Product,
  ProductListResponse,
  ProductListParams,
  CreateProductData,
  UpdateProductData,
  ApiResponse,
} from '../types/product.types';

const ENDPOINTS = {
  LIST: '/products',
  CATEGORIES: '/products/categories',
  SEARCH: '/products/search',
  DETAIL: (id: string) => `/products/${id}`,
};

/**
 * Product API Service
 * Handles all product-related API calls
 */
export class ProductService {
  /**
   * Get paginated list of products with optional filters
   */
  static async getProducts(params?: ProductListParams): Promise<ApiResponse<ProductListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const query = queryParams.toString();
    const url = query ? `${ENDPOINTS.LIST}?${query}` : ENDPOINTS.LIST;
    
    return ApiService.get<ApiResponse<ProductListResponse>>(url);
  }

  /**
   * Search products by query
   */
  static async searchProducts(query: string, limit?: number): Promise<ApiResponse<{ products: Product[] }>> {
    const queryParams = new URLSearchParams({ q: query });
    if (limit) queryParams.append('limit', limit.toString());
    
    return ApiService.get<ApiResponse<{ products: Product[] }>>(
      `${ENDPOINTS.SEARCH}?${queryParams.toString()}`
    );
  }

  /**
   * Get all product categories
   */
  static async getCategories(): Promise<ApiResponse<{ categories: string[] }>> {
    return ApiService.get<ApiResponse<{ categories: string[] }>>(ENDPOINTS.CATEGORIES);
  }

  /**
   * Get a single product by ID
   */
  static async getProductById(id: string): Promise<ApiResponse<{ product: Product }>> {
    return ApiService.get<ApiResponse<{ product: Product }>>(ENDPOINTS.DETAIL(id));
  }

  /**
   * Create a new product
   */
  static async createProduct(data: CreateProductData): Promise<ApiResponse<{ product: Product }>> {
    return ApiService.post<ApiResponse<{ product: Product }>>(ENDPOINTS.LIST, data);
  }

  /**
   * Update a product
   */
  static async updateProduct(
    id: string,
    data: UpdateProductData
  ): Promise<ApiResponse<{ product: Product }>> {
    return ApiService.put<ApiResponse<{ product: Product }>>(ENDPOINTS.DETAIL(id), data);
  }

  /**
   * Delete a product
   */
  static async deleteProduct(id: string): Promise<ApiResponse<null>> {
    return ApiService.delete<ApiResponse<null>>(ENDPOINTS.DETAIL(id));
  }
}

export default ProductService;

