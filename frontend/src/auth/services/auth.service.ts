import { ApiService } from '../../common/services/api.service';
import { ApiResponse } from '../../common/utils/HttpClients';
import { LoginCredentials, RegisterData, AuthResponse } from '../types/auth.types';
import { Token } from '../../common/services/token.service';

export interface AuthResult {
  success: boolean;
  error?: string;
}

export class AuthService {
  private static async loginApi(credentials: LoginCredentials): Promise<AuthResponse> {
    return await ApiService.post<AuthResponse>('/auth/login', credentials, { skipAuth: true } as any);
  }

  private static async registerApi(data: RegisterData): Promise<AuthResponse> {
    return await ApiService.post<AuthResponse>('/auth/register', data, { skipAuth: true } as any);
  }

  private static async logoutApi(): Promise<void> {
    await ApiService.post('/auth/logout');
  }

  static async getCurrentUser(): Promise<ApiResponse> {
    return await ApiService.get<ApiResponse>('/auth/me');
  }

  static async login(email: string, password: string, rememberMe?: boolean): Promise<AuthResult> {
    try {
      const response = await this.loginApi({ email, password, rememberMe });
      if (response.success && response.data?.token) {
        Token.set(response.data.token);
        return { success: true };
      }
      return { success: false, error: response.message || 'Login failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed. Please try again.' };
    }
  }

  static async register(data: RegisterData): Promise<AuthResult> {
    try {
      const response = await this.registerApi(data);
      if (response.success && response.data?.token) {
        Token.set(response.data.token);
        return { success: true };
      }
      return { success: false, error: response.message || 'Registration failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed. Please try again.' };
    }
  }

  static async logout(): Promise<void> {
    try {
      await this.logoutApi();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      Token.remove();
    }
  }

  static isAuthenticated(): boolean {
    return Token.get() !== null;
  }
}

