import { ApiService } from '../../common/services/api.service';
import type {
  AdminUser,
  UserListResponse,
  UserListParams,
  SystemStats,
  ApiResponse,
} from '../types/admin.types';

const ENDPOINTS = {
  STATS: '/admin/stats',
  USERS: '/admin/users',
  USER_DETAIL: (id: string) => `/admin/users/${id}`,
  USER_ROLE: (id: string) => `/admin/users/${id}/role`,
};

/**
 * Admin API Service
 * Handles all admin-related API calls
 */
export class AdminService {
  /**
   * Get system statistics
   */
  static async getSystemStats(): Promise<ApiResponse<SystemStats>> {
    return ApiService.get<ApiResponse<SystemStats>>(ENDPOINTS.STATS);
  }

  /**
   * Get paginated list of users
   */
  static async getUsers(params?: UserListParams): Promise<ApiResponse<UserListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const query = queryParams.toString();
    const url = query ? `${ENDPOINTS.USERS}?${query}` : ENDPOINTS.USERS;
    
    return ApiService.get<ApiResponse<UserListResponse>>(url);
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<ApiResponse<{ user: AdminUser }>> {
    return ApiService.get<ApiResponse<{ user: AdminUser }>>(ENDPOINTS.USER_DETAIL(id));
  }

  /**
   * Update user role
   */
  static async updateUserRole(id: string, role: string): Promise<ApiResponse<{ user: AdminUser }>> {
    return ApiService.put<ApiResponse<{ user: AdminUser }>>(ENDPOINTS.USER_ROLE(id), { role });
  }

  /**
   * Delete user
   */
  static async deleteUser(id: string): Promise<ApiResponse<null>> {
    return ApiService.delete<ApiResponse<null>>(ENDPOINTS.USER_DETAIL(id));
  }
}

export default AdminService;

