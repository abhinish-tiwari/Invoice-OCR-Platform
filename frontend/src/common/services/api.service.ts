import client from '../utils/HttpClients';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

export class ApiService {

	static async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
		const response: AxiosResponse<T> = await client.get(url, config);
		return response.data;
	}

	static async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
		const response: AxiosResponse<T> = await client.post(url, data, config);
		return response.data;
	}

	static async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
		const response: AxiosResponse<T> = await client.put(url, data, config);
		return response.data;
	}

	static async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
		const response: AxiosResponse<T> = await client.patch(url, data, config);
		return response.data;
	}

	static async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
		const response: AxiosResponse<T> = await client.delete(url, config);
		return response.data;
	}

	static cancelRequest(request: { abortController?: AbortController }) {
		request.abortController?.abort();
	}

	static cancelAllRequests(requests: Array<{ abortController?: AbortController }>) {
		requests.forEach((req) => req.abortController?.abort());
	}

	static createAbortController(): AbortController {
		return new AbortController();
	}
}

export default ApiService;

