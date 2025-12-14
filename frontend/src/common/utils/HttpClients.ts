import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios';
import { Token } from '../services/token.service';
import { ErrorHandler } from '../services/error-handler.service';
import { Config } from '../config/app.config';

export interface ApiError {
  message: string;
  status: number;
  data?: any;
  timestamp?: string;
}

export interface RequestConfig extends InternalAxiosRequestConfig {
  skipAuth?: boolean;
  _retry?: boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

class ClientFactory {
  static create(baseURL: string): AxiosInstance {
    const instance = axios.create({
      baseURL,
      timeout: Config.REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      withCredentials: false,
    });

    this.setupRequest(instance);
    this.setupResponse(instance);

    return instance;
  }

  private static setupRequest(instance: AxiosInstance): void {
    instance.interceptors.request.use(
      (config: RequestConfig) => {
        const requestStartTime = Date.now();
        (config as any).metadata = { requestStartTime };

        if (!config.skipAuth && Token.has()) {
          const token = Token.get();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        config.headers['X-Request-ID'] = this.generateRequestId();

        if (Config.ENABLE_LOGGING) {
          console.group(
            `[HTTP Client] 🚀 ${config.method?.toUpperCase()} ${config.url}`
          );
          console.log('Headers:', config.headers);
          if (config.data) console.log('Body:', config.data);
          if (config.params) console.log('Params:', config.params);
          console.groupEnd();
        }

        return config;
      },
      (error: AxiosError) => {
        console.error('[HTTP Client] Request error:', error);
        return Promise.reject(error);
      }
    );
  }

  private static setupResponse(instance: AxiosInstance): void {
    instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const requestStartTime = (response.config as any).metadata
          ?.requestStartTime;
        const duration = requestStartTime ? Date.now() - requestStartTime : 0;

        if (Config.ENABLE_LOGGING) {
          console.group(
            `[HTTP Client] ✅ ${response.status} ${response.config.url} (${duration}ms)`
          );
          console.log('Data:', response.data);
          console.log('Headers:', response.headers);
          console.groupEnd();
        }

        return response;
      },
      (error: AxiosError) => {
        const requestStartTime = (error.config as any)?.metadata
          ?.requestStartTime;
        const duration = requestStartTime ? Date.now() - requestStartTime : 0;

        if (Config.ENABLE_LOGGING && duration > 0) {
          console.error(
            `[HTTP Client] ❌ Request failed after ${duration}ms`
          );
        }

        return ErrorHandler.handle(error);
      }
    );
  }

  private static generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

const client = ClientFactory.create(Config.API_BASE_URL);
export default client;
