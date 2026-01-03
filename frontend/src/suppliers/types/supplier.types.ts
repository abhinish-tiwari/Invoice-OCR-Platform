/**
 * Supplier entity matching backend response
 */
export interface Supplier {
  id: string;
  name: string;
  normalizedName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create supplier request
 */
export interface CreateSupplierData {
  name: string;
  contactEmail?: string;
  contactPhone?: string;
}

/**
 * Update supplier request
 */
export interface UpdateSupplierData {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
}

/**
 * Supplier list query parameters
 */
export interface SupplierListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Paginated supplier list response
 */
export interface SupplierListResponse {
  data: Supplier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: {
    message: string;
    statusCode: number;
  };
}

