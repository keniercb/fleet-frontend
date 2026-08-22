import type { AxiosResponse } from 'axios';
import apiClient from './client';
import type {
  LoginRequestDto,
  AuthResponseDto,
  CambiarPasswordRequest,
  UserResponse,
  UserRequest,
  RoleResponse,
  RoleRequest,
  PermissionResponse,
  PermissionRequest,
  VehiculoResponse,
  VehiculoRequest,
  TipoVehiculoResponse,
  TipoVehiculoRequest,
  TipoCombustibleResponse,
  TipoCombustibleRequest,
  MarcaResponse,
  MarcaRequest,
  EmpresaResponse,
  EmpresaRequest,
  ChoferResponse,
  ChoferRequest,
  CategoriaLicenciaResponse,
  CategoriaLicenciaRequest,
  ChoferCategoriaResponse,
  ChoferCategoriaRequest,
  RecorridoResponse,
  RecorridoRequest,
  ReporteMovimientoMensualResponse,
  CurrencyResponse,
  CurrencyRequest,
  TarjetaCombustibleResponse,
  TarjetaCombustibleRequest,
  PageParams,
  PageResponse,
} from '@/types';

// ---- Auth ----

export const authApi = {
  login: (credentials: LoginRequestDto): Promise<AxiosResponse<AuthResponseDto>> =>
    apiClient.post<AuthResponseDto>('/auth/login', credentials),

  logout: (): Promise<AxiosResponse<void>> =>
    apiClient.post<void>('/auth/logout'),

  getCurrentUser: (): Promise<AxiosResponse<UserResponse>> =>
    apiClient.get<UserResponse>('/auth/me'),

  cambiarPassword: (data: CambiarPasswordRequest): Promise<AxiosResponse<void>> =>
    apiClient.put<void>('/auth/cambiar-password', data),
};

// ---- Users ----

export const usersApi = {
  findAll: (params?: PageParams): Promise<AxiosResponse<PageResponse<UserResponse>>> =>
    apiClient.get<PageResponse<UserResponse>>('/users', { params }),

  findById: (id: number): Promise<AxiosResponse<UserResponse>> =>
    apiClient.get<UserResponse>(`/users/${id}`),

  create: (data: UserRequest): Promise<AxiosResponse<UserResponse>> =>
    apiClient.post<UserResponse>('/users', data),

  update: (id: number, data: UserRequest): Promise<AxiosResponse<UserResponse>> =>
    apiClient.put<UserResponse>(`/users/${id}`, data),

  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete<void>(`/users/${id}`),

  findByEmail: (email: string): Promise<AxiosResponse<UserResponse>> =>
    apiClient.get<UserResponse>(`/users/email/${email}`),

  findByEmpresaId: (empresaId: number, params?: PageParams): Promise<AxiosResponse<PageResponse<UserResponse>>> =>
    apiClient.get<PageResponse<UserResponse>>(`/users/empresa/${empresaId}`, { params }),
};

// ---- Roles ----

export const rolesApi = {
  findAll: (params?: PageParams): Promise<AxiosResponse<PageResponse<RoleResponse>>> =>
    apiClient.get<PageResponse<RoleResponse>>('/roles', { params }),

  findById: (id: number): Promise<AxiosResponse<RoleResponse>> =>
    apiClient.get<RoleResponse>(`/roles/${id}`),

  create: (data: RoleRequest): Promise<AxiosResponse<RoleResponse>> =>
    apiClient.post<RoleResponse>('/roles', data),

  update: (id: number, data: RoleRequest): Promise<AxiosResponse<RoleResponse>> =>
    apiClient.put<RoleResponse>(`/roles/${id}`, data),

  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete<void>(`/roles/${id}`),

  findByPermissionId: (permissionId: number, params?: PageParams): Promise<AxiosResponse<PageResponse<RoleResponse>>> =>
    apiClient.get<PageResponse<RoleResponse>>(`/roles/permission/${permissionId}`, { params }),

  findByName: (name: string): Promise<AxiosResponse<RoleResponse>> =>
    apiClient.get<RoleResponse>(`/roles/name/${name}`),
};

// ---- Permissions ----

export const permissionsApi = {
  findAll: (params?: PageParams): Promise<AxiosResponse<PageResponse<PermissionResponse>>> =>
    apiClient.get<PageResponse<PermissionResponse>>('/permissions', { params }),

  findById: (id: number): Promise<AxiosResponse<PermissionResponse>> =>
    apiClient.get<PermissionResponse>(`/permissions/${id}`),

  create: (data: PermissionRequest): Promise<AxiosResponse<PermissionResponse>> =>
    apiClient.post<PermissionResponse>('/permissions', data),

  update: (id: number, data: PermissionRequest): Promise<AxiosResponse<PermissionResponse>> =>
    apiClient.put<PermissionResponse>(`/permissions/${id}`, data),

  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete<void>(`/permissions/${id}`),

  findByName: (name: string): Promise<AxiosResponse<PermissionResponse>> =>
    apiClient.get<PermissionResponse>(`/permissions/name/${name}`),
};

// ---- Vehiculos ----

export const vehiculosApi = {
  findAll: (params?: PageParams): Promise<AxiosResponse<PageResponse<VehiculoResponse>>> =>
    apiClient.get<PageResponse<VehiculoResponse>>('/vehiculos', { params }),

  findById: (id: number): Promise<AxiosResponse<VehiculoResponse>> =>
    apiClient.get<VehiculoResponse>(`/vehiculos/${id}`),

  create: (data: VehiculoRequest): Promise<AxiosResponse<VehiculoResponse>> =>
    apiClient.post<VehiculoResponse>('/vehiculos', data),

  update: (id: number, data: VehiculoRequest): Promise<AxiosResponse<VehiculoResponse>> =>
    apiClient.put<VehiculoResponse>(`/vehiculos/${id}`, data),

  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete<void>(`/vehiculos/${id}`),

  findByTipoVehiculoId: (tipoVehiculoId: number, params?: PageParams): Promise<AxiosResponse<PageResponse<VehiculoResponse>>> =>
    apiClient.get<PageResponse<VehiculoResponse>>(`/vehiculos/tipo-vehiculo/${tipoVehiculoId}`, { params }),

  findByTipoCombustibleId: (tipoCombustibleId: number, params?: PageParams): Promise<AxiosResponse<PageResponse<VehiculoResponse>>> =>
    apiClient.get<PageResponse<VehiculoResponse>>(`/vehiculos/tipo-combustible/${tipoCombustibleId}`, { params }),

  findSinChoferAsignado: (params?: PageParams): Promise<AxiosResponse<PageResponse<VehiculoResponse>>> =>
    apiClient.get<PageResponse<VehiculoResponse>>('/vehiculos/sin-chofer', { params }),

  findByChoferId: (choferId: number, params?: PageParams): Promise<AxiosResponse<PageResponse<VehiculoResponse>>> =>
    apiClient.get<PageResponse<VehiculoResponse>>(`/vehiculos/chofer/${choferId}`, { params }),

  reporteMovimientoMensual: (vehiculoId: number, mes: number, anio: number): Promise<AxiosResponse<ReporteMovimientoMensualResponse>> =>
    apiClient.get<ReporteMovimientoMensualResponse>(`/vehiculos/reporte-movimiento-mensual/${vehiculoId}`, { params: { mes, anio } }),

  findByEmpresaId: (empresaId: number, params?: PageParams): Promise<AxiosResponse<PageResponse<VehiculoResponse>>> =>
    apiClient.get<PageResponse<VehiculoResponse>>(`/vehiculos/empresa/${empresaId}`, { params }),
};

// ---- Tipos Vehiculo ----

export const tiposVehiculoApi = {
  findAll: (params?: PageParams): Promise<AxiosResponse<PageResponse<TipoVehiculoResponse>>> =>
    apiClient.get<PageResponse<TipoVehiculoResponse>>('/tipos-vehiculo', { params }),

  findById: (id: number): Promise<AxiosResponse<TipoVehiculoResponse>> =>
    apiClient.get<TipoVehiculoResponse>(`/tipos-vehiculo/${id}`),

  create: (data: TipoVehiculoRequest): Promise<AxiosResponse<TipoVehiculoResponse>> =>
    apiClient.post<TipoVehiculoResponse>('/tipos-vehiculo', data),

  update: (id: number, data: TipoVehiculoRequest): Promise<AxiosResponse<TipoVehiculoResponse>> =>
    apiClient.put<TipoVehiculoResponse>(`/tipos-vehiculo/${id}`, data),

  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete<void>(`/tipos-vehiculo/${id}`),
};

// ---- Tipos Combustible ----

export const tiposCombustibleApi = {
  findAll: (params?: PageParams): Promise<AxiosResponse<PageResponse<TipoCombustibleResponse>>> =>
    apiClient.get<PageResponse<TipoCombustibleResponse>>('/tipos-combustible', { params }),

  findById: (id: number): Promise<AxiosResponse<TipoCombustibleResponse>> =>
    apiClient.get<TipoCombustibleResponse>(`/tipos-combustible/${id}`),

  create: (data: TipoCombustibleRequest): Promise<AxiosResponse<TipoCombustibleResponse>> =>
    apiClient.post<TipoCombustibleResponse>('/tipos-combustible', data),

  update: (id: number, data: TipoCombustibleRequest): Promise<AxiosResponse<TipoCombustibleResponse>> =>
    apiClient.put<TipoCombustibleResponse>(`/tipos-combustible/${id}`, data),

  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete<void>(`/tipos-combustible/${id}`),

  findByCodigo: (codigo: string): Promise<AxiosResponse<TipoCombustibleResponse>> =>
    apiClient.get<TipoCombustibleResponse>(`/tipos-combustible/codigo/${codigo}`),
};

// ---- Marcas ----

export const marcasApi = {
  findAll: (params?: PageParams): Promise<AxiosResponse<PageResponse<MarcaResponse>>> =>
    apiClient.get<PageResponse<MarcaResponse>>('/marcas', { params }),

  findById: (id: number): Promise<AxiosResponse<MarcaResponse>> =>
    apiClient.get<MarcaResponse>(`/marcas/${id}`),

  create: (data: MarcaRequest): Promise<AxiosResponse<MarcaResponse>> =>
    apiClient.post<MarcaResponse>('/marcas', data),

  update: (id: number, data: MarcaRequest): Promise<AxiosResponse<MarcaResponse>> =>
    apiClient.put<MarcaResponse>(`/marcas/${id}`, data),

  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete<void>(`/marcas/${id}`),
};

// ---- Empresas ----

export const empresasApi = {
  findAll: (params?: PageParams): Promise<AxiosResponse<PageResponse<EmpresaResponse>>> =>
    apiClient.get<PageResponse<EmpresaResponse>>('/empresas', { params }),

  findById: (id: number): Promise<AxiosResponse<EmpresaResponse>> =>
    apiClient.get<EmpresaResponse>(`/empresas/${id}`),

  create: (data: EmpresaRequest): Promise<AxiosResponse<EmpresaResponse>> =>
    apiClient.post<EmpresaResponse>('/empresas', data),

  update: (id: number, data: EmpresaRequest): Promise<AxiosResponse<EmpresaResponse>> =>
    apiClient.put<EmpresaResponse>(`/empresas/${id}`, data),

  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete<void>(`/empresas/${id}`),

  findByCodigo: (codigo: string): Promise<AxiosResponse<EmpresaResponse>> =>
    apiClient.get<EmpresaResponse>(`/empresas/codigo/${codigo}`),
};

// ---- Choferes ----

export const choferesApi = {
  findAll: (params?: PageParams): Promise<AxiosResponse<PageResponse<ChoferResponse>>> =>
    apiClient.get<PageResponse<ChoferResponse>>('/choferes', { params }),

  findById: (id: number): Promise<AxiosResponse<ChoferResponse>> =>
    apiClient.get<ChoferResponse>(`/choferes/${id}`),

  create: (data: ChoferRequest): Promise<AxiosResponse<ChoferResponse>> =>
    apiClient.post<ChoferResponse>('/choferes', data),

  update: (id: number, data: ChoferRequest): Promise<AxiosResponse<ChoferResponse>> =>
    apiClient.put<ChoferResponse>(`/choferes/${id}`, data),

  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete<void>(`/choferes/${id}`),

  findByEmpresaId: (empresaId: number, params?: PageParams): Promise<AxiosResponse<PageResponse<ChoferResponse>>> =>
    apiClient.get<PageResponse<ChoferResponse>>(`/choferes/empresa/${empresaId}`, { params }),
};

// ---- Categorias Licencia ----

export const categoriasLicenciaApi = {
  findAll: (params?: PageParams): Promise<AxiosResponse<PageResponse<CategoriaLicenciaResponse>>> =>
    apiClient.get<PageResponse<CategoriaLicenciaResponse>>('/categorias-licencia', { params }),

  findById: (id: number): Promise<AxiosResponse<CategoriaLicenciaResponse>> =>
    apiClient.get<CategoriaLicenciaResponse>(`/categorias-licencia/${id}`),

  create: (data: CategoriaLicenciaRequest): Promise<AxiosResponse<CategoriaLicenciaResponse>> =>
    apiClient.post<CategoriaLicenciaResponse>('/categorias-licencia', data),

  update: (id: number, data: CategoriaLicenciaRequest): Promise<AxiosResponse<CategoriaLicenciaResponse>> =>
    apiClient.put<CategoriaLicenciaResponse>(`/categorias-licencia/${id}`, data),

  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete<void>(`/categorias-licencia/${id}`),

  findByCodigo: (codigo: string): Promise<AxiosResponse<CategoriaLicenciaResponse>> =>
    apiClient.get<CategoriaLicenciaResponse>(`/categorias-licencia/codigo/${codigo}`),
};

// ---- Choferes Categorias ----

export const choferesCategoriasApi = {
  findAll: (params?: PageParams): Promise<AxiosResponse<PageResponse<ChoferCategoriaResponse>>> =>
    apiClient.get<PageResponse<ChoferCategoriaResponse>>('/choferes-categorias', { params }),

  findById: (id: number): Promise<AxiosResponse<ChoferCategoriaResponse>> =>
    apiClient.get<ChoferCategoriaResponse>(`/choferes-categorias/${id}`),

  create: (data: ChoferCategoriaRequest): Promise<AxiosResponse<ChoferCategoriaResponse>> =>
    apiClient.post<ChoferCategoriaResponse>('/choferes-categorias', data),

  update: (id: number, data: ChoferCategoriaRequest): Promise<AxiosResponse<ChoferCategoriaResponse>> =>
    apiClient.put<ChoferCategoriaResponse>(`/choferes-categorias/${id}`, data),

  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete<void>(`/choferes-categorias/${id}`),

  findByChoferId: (choferId: number, params?: PageParams): Promise<AxiosResponse<PageResponse<ChoferCategoriaResponse>>> =>
    apiClient.get<PageResponse<ChoferCategoriaResponse>>(`/choferes-categorias/chofer/${choferId}`, { params }),

  findByCategoriaLicenciaId: (categoriaLicenciaId: number, params?: PageParams): Promise<AxiosResponse<PageResponse<ChoferCategoriaResponse>>> =>
    apiClient.get<PageResponse<ChoferCategoriaResponse>>(`/choferes-categorias/categoria/${categoriaLicenciaId}`, { params }),
};

// ---- Currencies ----

export const currenciesApi = {
  findAll: (params?: PageParams): Promise<AxiosResponse<PageResponse<CurrencyResponse>>> =>
    apiClient.get<PageResponse<CurrencyResponse>>('/currencies', { params }),

  findById: (id: number): Promise<AxiosResponse<CurrencyResponse>> =>
    apiClient.get<CurrencyResponse>(`/currencies/${id}`),

  create: (data: CurrencyRequest): Promise<AxiosResponse<CurrencyResponse>> =>
    apiClient.post<CurrencyResponse>('/currencies', data),

  update: (id: number, data: CurrencyRequest): Promise<AxiosResponse<CurrencyResponse>> =>
    apiClient.put<CurrencyResponse>(`/currencies/${id}`, data),

  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete<void>(`/currencies/${id}`),

  findByIsoCode: (isoCode: string): Promise<AxiosResponse<CurrencyResponse>> =>
    apiClient.get<CurrencyResponse>(`/currencies/iso-code/${isoCode}`),
};

// ---- Tarjetas Combustible ----

export const tarjetasCombustibleApi = {
  findAll: (params?: PageParams): Promise<AxiosResponse<PageResponse<TarjetaCombustibleResponse>>> =>
    apiClient.get<PageResponse<TarjetaCombustibleResponse>>('/tarjetas-combustible', { params }),

  findById: (id: number): Promise<AxiosResponse<TarjetaCombustibleResponse>> =>
    apiClient.get<TarjetaCombustibleResponse>(`/tarjetas-combustible/${id}`),

  create: (data: TarjetaCombustibleRequest): Promise<AxiosResponse<TarjetaCombustibleResponse>> =>
    apiClient.post<TarjetaCombustibleResponse>('/tarjetas-combustible', data),

  update: (id: number, data: TarjetaCombustibleRequest): Promise<AxiosResponse<TarjetaCombustibleResponse>> =>
    apiClient.put<TarjetaCombustibleResponse>(`/tarjetas-combustible/${id}`, data),

  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete<void>(`/tarjetas-combustible/${id}`),

  findByNumero: (numero: string): Promise<AxiosResponse<TarjetaCombustibleResponse>> =>
    apiClient.get<TarjetaCombustibleResponse>(`/tarjetas-combustible/numero/${numero}`),

  findByEmpresaId: (empresaId: number, params?: PageParams): Promise<AxiosResponse<PageResponse<TarjetaCombustibleResponse>>> =>
    apiClient.get<PageResponse<TarjetaCombustibleResponse>>(`/tarjetas-combustible/empresa/${empresaId}`, { params }),
};

// ---- Recorridos ----

export const recorridosApi = {
  findAll: (params?: PageParams): Promise<AxiosResponse<PageResponse<RecorridoResponse>>> =>
    apiClient.get<PageResponse<RecorridoResponse>>('/recorridos', { params }),

  findById: (id: number): Promise<AxiosResponse<RecorridoResponse>> =>
    apiClient.get<RecorridoResponse>(`/recorridos/${id}`),

  create: (data: RecorridoRequest): Promise<AxiosResponse<RecorridoResponse>> =>
    apiClient.post<RecorridoResponse>('/recorridos', data),

  update: (id: number, data: RecorridoRequest): Promise<AxiosResponse<RecorridoResponse>> =>
    apiClient.put<RecorridoResponse>(`/recorridos/${id}`, data),

  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete<void>(`/recorridos/${id}`),

  findByVehiculoId: (vehiculoId: number, params?: PageParams & { from?: string; to?: string }): Promise<AxiosResponse<PageResponse<RecorridoResponse>>> =>
    apiClient.get<PageResponse<RecorridoResponse>>(`/recorridos/vehiculo/${vehiculoId}`, { params }),
};
