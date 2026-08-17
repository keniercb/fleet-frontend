import { useState, useEffect, useCallback } from 'react';
import type { PageResponse, PageParams } from '@/types';
import type { AxiosResponse } from 'axios';

interface CrudApi<TReq, TRes> {
  findAll: (params?: PageParams) => Promise<AxiosResponse<PageResponse<TRes>>>;
  create: (data: TReq) => Promise<AxiosResponse<TRes>>;
  update: (id: number, data: TReq) => Promise<AxiosResponse<TRes>>;
  delete: (id: number) => Promise<AxiosResponse<void>>;
}

interface UseCrudReturn<TReq, TRes> {
  data: TRes[];
  loading: boolean;
  saving: boolean;
  totalPages: number;
  totalElements: number;
  page: number;
  size: number;
  error: string;
  fetchData: (params?: PageParams) => Promise<void>;
  setPage: (page: number) => void;
  setSize: (size: number) => void;
  createItem: (data: TReq) => Promise<TRes>;
  updateItem: (id: number, data: TReq) => Promise<TRes>;
  deleteItem: (id: number) => Promise<void>;
  clearError: () => void;
}

export function useCrud<TReq, TRes>(
  api: CrudApi<TReq, TRes>,
  defaultParams?: Partial<PageParams>
): UseCrudReturn<TReq, TRes> {
  const [data, setData] = useState<TRes[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(defaultParams?.perPage ?? 10);
  const [error, setError] = useState('');

  const fetchData = useCallback(
    async (params?: PageParams) => {
      setLoading(true);
      setError('');
      try {
        const response = await api.findAll({
          page: params?.page ?? page,
          perPage: params?.perPage ?? size,
          sort: params?.sort ?? defaultParams?.sort,
          sortOrder: params?.sortOrder ?? defaultParams?.sortOrder,
        });
        const pageData: PageResponse<TRes> = response.data;
        setData(pageData.content);
        setTotalPages(pageData.totalPages);
        setTotalElements(pageData.totalElements);
        setSize(pageData.size);
      } catch (err) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Error al cargar los datos';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [api, page, size, defaultParams]
  );

  useEffect(() => {
    fetchData();
  }, [page, size]);

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleSetSize = useCallback((newSize: number) => {
    setSize(newSize);
    setPage(0);
  }, []);

  const createItem = async (formData: TReq): Promise<TRes> => {
    setSaving(true);
    setError('');
    try {
      const response = await api.create(formData);
      await fetchData();
      return response.data;
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error al crear';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const updateItem = async (id: number, formData: TReq): Promise<TRes> => {
    setSaving(true);
    setError('');
    try {
      const response = await api.update(id, formData);
      await fetchData();
      return response.data;
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error al actualizar';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: number) => {
    setSaving(true);
    setError('');
    try {
      await api.delete(id);
      await fetchData();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error al eliminar';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const clearError = useCallback(() => setError(''), []);

  return {
    data,
    loading,
    saving,
    totalPages,
    totalElements,
    page,
    size,
    error,
    fetchData,
    setPage: handleSetPage,
    setSize: handleSetSize,
    createItem,
    updateItem,
    deleteItem,
    clearError,
  };
}
