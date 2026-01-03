/**
 * User entity for admin management
 */
export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company: string | null;
  role: 'user' | 'admin';
  created_at: string;
  last_login: string | null;
}

/**
 * User list query parameters
 */
export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  sortBy?: 'email' | 'created_at' | 'last_login';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Paginated user list response
 */
export interface UserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * System statistics
 */
export interface SystemStats {
  totalUsers: number;
  totalInvoices: number;
  totalProducts: number;
  totalSuppliers: number;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

