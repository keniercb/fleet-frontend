import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { PageResponse } from '@/types';
import { showToastFromInterceptor } from './toastBridge';

// Extender el tipo de error de Axios para incluir la bandera __toastShown
declare module 'axios' {
  export interface AxiosError {
    __toastShown?: boolean;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Tipos de mensaje segun el codigo HTTP
interface BackendMessage {
  message?: string;
  error?: string;
}

function getToastTypeForStatus(status: number): 'success' | 'info' | 'warning' | 'error' {
  if (status >= 200 && status < 300) return 'success';
  if (status === 401 || status === 403) return 'warning';
  if (status >= 400 && status < 500) return 'warning';
  if (status >= 500) return 'error';
  return 'info';
}

function getTitleForStatus(status: number): string {
  if (status >= 200 && status < 300) return 'Operación exitosa';
  if (status === 400) return 'Solicitud incorrecta';
  if (status === 401) return 'No autorizado';
  if (status === 403) return 'Acceso denegado';
  if (status === 404) return 'No encontrado';
  if (status === 409) return 'Conflicto';
  if (status === 422) return 'Datos inválidos';
  if (status >= 500) return 'Error del servidor';
  return 'Información';
}

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
  (response: AxiosResponse) => {
    // No mostrar toast si la peticion incluye el header X-Skip-Toast
    const skipToast = response.config?.headers?.['X-Skip-Toast'] === 'true';
    if (skipToast) return response;

    // Mostrar toast si la respuesta exitosa contiene un mensaje del backend
    const data = response.data as BackendMessage;
    if (data && typeof data.message === 'string' && data.message.trim()) {
      const toastType = getToastTypeForStatus(response.status);
      const title = getTitleForStatus(response.status);
      showToastFromInterceptor(toastType, title, data.message);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // No mostrar toast si la peticion incluye el header X-Skip-Toast
    const skipToast = error.config?.headers?.['X-Skip-Toast'] === 'true';

    // Mostrar toast si el error contiene un mensaje del backend
    const errorData = error?.response?.data as BackendMessage;
    let toastShown = false;
    if (!skipToast && errorData && typeof errorData.message === 'string' && errorData.message.trim()) {
      const status = error.response?.status ?? 500;
      const toastType = getToastTypeForStatus(status);
      const title = getTitleForStatus(status);
      showToastFromInterceptor(toastType, title, errorData.message);
      toastShown = true;
    } else if (!skipToast && errorData && typeof errorData.error === 'string' && errorData.error.trim()) {
      const status = error.response?.status ?? 500;
      const toastType = getToastTypeForStatus(status);
      const title = getTitleForStatus(status);
      showToastFromInterceptor(toastType, title, errorData.error);
      toastShown = true;
    }

    // Marcar el error para que los componentes sepan que el toast ya fue mostrado
    if (toastShown) {
      error.__toastShown = true;
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
