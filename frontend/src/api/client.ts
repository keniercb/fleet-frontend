import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { PageResponse } from '@/types';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Typed generic query helper for paginated endpoints
export async function fetchPage<T>(url: string, params?: Record<string, unknown>): Promise<PageResponse<T>> {
  const response = await apiClient.get<PageResponse<T>>(url, { params });
  return response.data;
}

// Typed generic fetch for single entities
export async function fetchOne<T>(url: string): Promise<T> {
  const response = await apiClient.get<T>(url);
  return response.data;
}

// Typed generic post
export async function createOne<TReq, TRes>(url: string, data: TReq): Promise<TRes> {
  const response = await apiClient.post<TRes>(url, data);
  return response.data;
}

// Typed generic put
export async function updateOne<TReq, TRes>(url: string, data: TReq): Promise<TRes> {
  const response = await apiClient.put<TRes>(url, data);
  return response.data;
}

// Typed generic delete
export async function deleteOne(url: string): Promise<void> {
  await apiClient.delete(url);
}

export default apiClient;
