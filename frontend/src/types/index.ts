// ============================================
// API Entity Types - Fleet Management System
// ============================================

// --- Audit ---
export interface UserAuditResponse {
  id: number;
  email: string;
}

// --- Auth ---
export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  token: string;
  type: string;
  userId: number;
  email: string;
}

export interface CambiarPasswordRequest {
  userId: number;
  passwordAnterior: string;
  nuevaPassword: string;
  confirmacionPassword: string;
}

// --- Pagination ---
export interface SortObject {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface PageableObject {
  offset: number;
  unpaged: boolean;
  paged: boolean;
  sort: SortObject;
  pageNumber: number;
  pageSize: number;
}

export interface PageParams {
  page?: number;
  perPage?: number;
  sort?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PageResponse<T> {
  totalPages: number;
  totalElements: number;
  size: number;
  content: T[];
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  sort: SortObject;
  pageable: PageableObject;
  empty: boolean;
}

// --- Users ---
export interface UserRequest {
  email: string;
  password: string;
  roleIds?: number[];
}

export interface UserResponse {
  id: number;
  email: string;
  roles: RoleResponse[];
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: UserAuditResponse;
  modificadoPor: UserAuditResponse;
}

// --- Roles ---
export interface RoleRequest {
  name: string;
  description?: string;
  permissionIds?: number[];
}

export interface RoleResponse {
  id: number;
  name: string;
  description: string;
  permissions: PermissionResponse[];
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: UserAuditResponse;
  modificadoPor: UserAuditResponse;
}

// --- Permissions ---
export interface PermissionRequest {
  name: string;
  description?: string;
}

export interface PermissionResponse {
  id: number;
  name: string;
  description: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: UserAuditResponse;
  modificadoPor: UserAuditResponse;
}

// --- Empresas (Companies) ---
export interface EmpresaRequest {
  codigo: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

export interface EmpresaResponse {
  id: number;
  codigo: string;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: UserAuditResponse;
  modificadoPor: UserAuditResponse;
}

// --- Marcas (Brands) ---
export interface MarcaRequest {
  nombre: string;
  descripcion?: string;
  paisOrigen?: string;
}

export interface MarcaResponse {
  id: number;
  nombre: string;
  descripcion: string;
  paisOrigen: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: UserAuditResponse;
  modificadoPor: UserAuditResponse;
}

// --- Tipo Vehiculo (Vehicle Type) ---
export interface TipoVehiculoRequest {
  nombre: string;
  descripcion?: string;
}

export interface TipoVehiculoResponse {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: UserAuditResponse;
  modificadoPor: UserAuditResponse;
}

// --- Tipo Combustible (Fuel Type) ---
export interface TipoCombustibleRequest {
  codigo: string;
  denominacion: string;
  descripcion?: string;
}

export interface TipoCombustibleResponse {
  id: number;
  codigo: string;
  denominacion: string;
  descripcion: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: UserAuditResponse;
  modificadoPor: UserAuditResponse;
}

// --- Vehiculos (Vehicles) ---
export interface VehiculoRequest {
  empresaId: number;
  tipoVehiculoId: number;
  marcaId: number;
  choferId?: number;
  tipoCombustibleId: number;
  modelo?: string;
  matricula: string;
  numeroMotor: string;
  odometro: number;
  combustible: number;
  ultimoMantenimiento?: string;
  odometroUltimoMantenimiento?: number;
  indiceConsumo?: number;
}

export interface VehiculoResponse {
  id: number;
  empresa: EmpresaResponse;
  tipoVehiculo: TipoVehiculoResponse;
  marca: MarcaResponse;
  chofer: ChoferResponse | null;
  tipoCombustible: TipoCombustibleResponse;
  modelo: string;
  matricula: string;
  numeroMotor: string;
  odometro: number;
  combustible: number;
  ultimoMantenimiento: string;
  odometroUltimoMantenimiento: number;
  indiceConsumo: number;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: UserAuditResponse;
  modificadoPor: UserAuditResponse;
}

// --- Choferes (Drivers) ---
export interface ChoferRequest {
  empresaId: number;
  nombre: string;
  apellidos: string;
  carneIdentidad: string;
  numeroLicencia: string;
  fechaNacimiento: string;
  categorias?: CategoriaConFechaRequest[];
}

export interface ChoferResponse {
  id: number;
  empresa: EmpresaResponse;
  nombre: string;
  apellidos: string;
  carneIdentidad: string;
  numeroLicencia: string;
  fechaNacimiento: string;
  categorias: ChoferCategoriaEmbeddedResponse[];
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: UserAuditResponse;
  modificadoPor: UserAuditResponse;
}

// --- Choferes Categorias ---
export interface CategoriaConFechaRequest {
  categoriaLicenciaId: number;
  fechaEmision: string;
}

export interface ChoferCategoriaRequest {
  choferId: number;
  categoriaLicenciaId: number;
  fechaEmision: string;
}

export interface ChoferCategoriaResponse {
  id: number;
  chofer: ChoferResponse;
  categoriaLicencia: CategoriaLicenciaResponse;
  fechaEmision: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: UserAuditResponse;
  modificadoPor: UserAuditResponse;
}

export interface ChoferCategoriaEmbeddedResponse {
  id: number;
  categoriaLicencia: CategoriaLicenciaResponse;
  fechaEmision: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: UserAuditResponse;
  modificadoPor: UserAuditResponse;
}

// --- Categorias Licencia (License Categories) ---
export interface CategoriaLicenciaRequest {
  codigo: string;
  denominacion: string;
  descripcion?: string;
}

export interface CategoriaLicenciaResponse {
  id: number;
  codigo: string;
  denominacion: string;
  descripcion: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: UserAuditResponse;
  modificadoPor: UserAuditResponse;
}

// --- Recorridos (Trips) ---
export interface RecorridoRequest {
  vehiculoId: number;
  fecha: string;
  kilometros: number;
  litrosAbastecidos?: number;
  numeroChip?: string;
  lugarAbastecimiento: string;
}

export interface RecorridoResponse {
  id: number;
  vehiculo: VehiculoResponse;
  fecha: string;
  kilometros: number;
  odometroInicial: number;
  consumo: number;
  litrosAbastecidos: number;
  numeroChip: string;
  lugarAbastecimiento: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: UserAuditResponse;
  modificadoPor: UserAuditResponse;
}

// --- Reporte Movimiento Mensual ---
export interface VehiculoReporteData {
  marca: string;
  numeroMotor: string;
  tipoCombustible: string;
  normaConsumo: number;
  matricula: string;
  chofer: ChoferResponse | null;
}

export interface LecturaDiariaResponse {
  dia: number;
  odometro: number;
  combustibleEnDeposito: number;
  combustibleConsumido: number;
  combustibleAbastecido: number;
  saldoCombustible: number;
}

export interface AnalisisConsumoResponse {
  combustibleInicial: number;
  combustibleRecibido: number;
  combustibleConsumido: number;
  existenciaFinal: number;
  kilometrosRecorridos: number;
  consumidoSegunNorma: number;
}

export interface ReporteMovimientoMensualResponse {
  vehiculo: VehiculoReporteData;
  lecturas: LecturaDiariaResponse[];
  analisis: AnalisisConsumoResponse;
}

// --- Menu / App Types ---
export interface MenuItem {
  label: string;
  icon: string;
  path: string;
  permission?: string;
  children?: MenuItem[];
}
