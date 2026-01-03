import { ApiService } from '../../common/services/api.service';
import type {
  Supplier,
  SupplierListResponse,
  SupplierListParams,
  CreateSupplierData,
  UpdateSupplierData,
  ApiResponse,
} from '../types/supplier.types';

const ENDPOINTS = {
  LIST: '/suppliers',
  SEARCH: '/suppliers/search',
  DETAIL: (id: string) => `/suppliers/${id}`,
};

/**
 * Supplier API Service
 * Handles all supplier-related API calls
 */
export class SupplierService {
  /**
   * Get paginated list of suppliers with optional filters
   */
  static async getSuppliers(params?: SupplierListParams): Promise<ApiResponse<SupplierListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const query = queryParams.toString();
    const url = query ? `${ENDPOINTS.LIST}?${query}` : ENDPOINTS.LIST;
    
    return ApiService.get<ApiResponse<SupplierListResponse>>(url);
  }

  /**
   * Search suppliers by query
   */
  static async searchSuppliers(query: string, limit?: number): Promise<ApiResponse<{ suppliers: Supplier[] }>> {
    const queryParams = new URLSearchParams({ q: query });
    if (limit) queryParams.append('limit', limit.toString());
    
    return ApiService.get<ApiResponse<{ suppliers: Supplier[] }>>(
      `${ENDPOINTS.SEARCH}?${queryParams.toString()}`
    );
  }

  /**
   * Get a single supplier by ID
   */
  static async getSupplierById(id: string): Promise<ApiResponse<{ supplier: Supplier }>> {
    return ApiService.get<ApiResponse<{ supplier: Supplier }>>(ENDPOINTS.DETAIL(id));
  }

  /**
   * Create a new supplier
   */
  static async createSupplier(data: CreateSupplierData): Promise<ApiResponse<{ supplier: Supplier }>> {
    return ApiService.post<ApiResponse<{ supplier: Supplier }>>(ENDPOINTS.LIST, data);
  }

  /**
   * Update a supplier
   */
  static async updateSupplier(
    id: string,
    data: UpdateSupplierData
  ): Promise<ApiResponse<{ supplier: Supplier }>> {
    return ApiService.put<ApiResponse<{ supplier: Supplier }>>(ENDPOINTS.DETAIL(id), data);
  }

  /**
   * Delete a supplier
   */
  static async deleteSupplier(id: string): Promise<ApiResponse<null>> {
    return ApiService.delete<ApiResponse<null>>(ENDPOINTS.DETAIL(id));
  }
}

export default SupplierService;

