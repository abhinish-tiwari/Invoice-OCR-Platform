import { AxiosError } from 'axios';
import { ApiError } from '../utils/HttpClients';
import { Token } from './token.service';
import { Config } from '../config/app.config';

export class ErrorHandler {
  private static readonly RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];
  private static readonly MAX_RETRIES = 3;

  static handle(error: AxiosError): Promise<never> {
    if (error.response) {
      return this.handleResponse(error);
    } else if (error.request) {
      return this.handleNetwork();
    } else {
      return this.handleUnknown(error);
    }
  }

  private static handleResponse(error: AxiosError): Promise<never> {
    const status = error.response?.status || 0;
    const data = error.response?.data as any;
    const message = data?.message || data?.error || error.message || 'An error occurred';

    if (Config.ENABLE_LOGGING) {
      console.group(`[HTTP Client] Error ${status}`);
      console.error('Message:', message);
      console.error('URL:', error.config?.url);
      console.error('Method:', error.config?.method?.toUpperCase());
      console.error('Data:', data);
      console.groupEnd();
    }

    switch (status) {
      case 401:
        this.handleUnauthorized();
        break;
      case 403:
        console.warn('[HTTP Client] Access forbidden:', message);
        break;
      case 404:
        console.warn('[HTTP Client] Resource not found:', message);
        break;
      case 422:
        console.warn('[HTTP Client] Validation error:', data);
        break;
      case 429:
        console.warn('[HTTP Client] Too many requests - rate limited');
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        console.error('[HTTP Client] Server error:', status, message);
        break;
      default:
        console.error('[HTTP Client] Error:', status, message);
    }

    return Promise.reject<never>({
      message,
      status,
      data,
      timestamp: new Date().toISOString(),
    } as ApiError);
  }

  private static handleNetwork(): Promise<never> {
    const error: ApiError = {
      message: 'Network error - please check your internet connection',
      status: 0,
      timestamp: new Date().toISOString(),
    };
    console.error('[HTTP Client] Network error');
    return Promise.reject<never>(error);
  }

  private static handleUnknown(error: AxiosError): Promise<never> {
    const apiError: ApiError = {
      message: error.message || 'An unexpected error occurred',
      status: 0,
      timestamp: new Date().toISOString(),
    };
    console.error('[HTTP Client] Unknown error:', error);
    return Promise.reject<never>(apiError);
  }

  private static handleUnauthorized(): void {
    console.warn('[HTTP Client] Unauthorized - clearing tokens and redirecting to login');
    Token.clear();

    const authPages = ['/login', '/register', '/forgot-password'];
    const isAuthPage = authPages.some((page) => window.location.pathname.includes(page));

    if (!isAuthPage) {
      window.location.href = '/login';
    }
  }

  static shouldRetry(error: AxiosError, retryCount: number = 0): boolean {
    if (retryCount >= this.MAX_RETRIES) return false;

    const status = error.response?.status;
    if (!status) return true;

    return this.RETRY_STATUS_CODES.includes(status);
  }

  static extractMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}
