/**
 * Product entity matching backend response
 */
export interface Product {
  id: string;
  name: string;
  normalizedName: string;
  packSize: string | null;
  category: string | null;
  unit: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create product request
 */
export interface CreateProductData {
  name: string;
  packSize?: string;
  category?: string;
  unit?: string;
}

/**
 * Update product request
 */
export interface UpdateProductData {
  name?: string;
  packSize?: string;
  category?: string;
  unit?: string;
}

/**
 * Product list query parameters
 */
export interface ProductListParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sortBy?: 'name' | 'category' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Paginated product list response
 */
export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Product alias (learned mappings)
 */
export interface ProductAlias {
  id: string;
  productId: string;
  rawText: string;
  normalizedText: string;
  matchCount: number;
  createdAt: string;
}

/**
 * Product match result
 */
export interface ProductMatch {
  product: Product | null;
  confidence: number;
  matchType: 'EXACT' | 'ALIAS' | 'FUZZY' | 'NONE';
  suggestions?: Product[];
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

