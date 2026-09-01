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
  empresaId?: number;
}

export interface UserResponse {
  id: number;
  email: string;
  roles: RoleResponse[];
  empresa: EmpresaResponse | null;
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
  provinciaId?: number;
  municipioId?: number;
}

export interface EmpresaResponse {
  id: number;
  codigo: string;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  provincia: ProvinciaResponse | null;
  municipio: MunicipioResponse | null;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: UserAuditResponse;
  modificadoPor: UserAuditResponse;
}

// --- Provincias ---
export interface ProvinciaRequest {
  codigo: number;
  nombre: string;
}

export interface ProvinciaResponse {
  id: number;
  codigo: number;
  nombre: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: UserAuditResponse;
  modificadoPor: UserAuditResponse;
}

// --- Municipios ---
export interface MunicipioRequest {
  provinciaId: number;
  codigo: number;
  nombre: string;
}

export interface MunicipioResponse {
  id: number;
  provincia: ProvinciaResponse;
  codigo: number;
  nombre: string;
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

// --- Currency ---
export interface CurrencyRequest {
  isoCode: string;
  descripcion: string;
}

export interface CurrencyResponse {
  id: number;
  isoCode: string;
  descripcion: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: UserAuditResponse;
  modificadoPor: UserAuditResponse;
}

// --- Tarjeta Combustible (Fuel Card) ---
export interface TarjetaCombustibleRequest {
  numero: string;
  saldo: number;
  currencyId: number;
  empresaId: number;
}

export interface TarjetaCombustibleResponse {
  id: number;
  numero: string;
  saldo: number;
  currency: CurrencyResponse;
  empresa: EmpresaResponse;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: UserAuditResponse;
  modificadoPor: UserAuditResponse;
}

// --- Recorridos (Trips) ---
export interface RecorridoRequest {
  vehiculoId: number;
  choferId?: number;
  fecha: string;
  kilometros: number;
  litrosAbastecidos?: number;
  numeroChip?: string;
  lugarAbastecimiento?: string;
  tarjetaCombustibleId?: number;
  importeAbastecido?: number;
}

export interface RecorridoResponse {
  id: number;
  vehiculo: VehiculoResponse;
  chofer: ChoferResponse | null;
  fecha: string;
  kilometros: number;
  odometroInicial: number;
  combustibleInicial: number;
  consumo: number;
  litrosAbastecidos: number;
  numeroChip: string;
  lugarAbastecimiento: string;
  tarjetaCombustible: TarjetaCombustibleResponse | null;
  importeAbastecido: number;
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
  kilometrosRecorridos: number;
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


// --- Features ---
export interface FeatureRequest {
  name: string;
  descripcion?: string;
}

export interface FeatureResponse {
  id: number;
  name: string;
  descripcion: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: UserAuditResponse;
  modificadoPor: UserAuditResponse;
}

// --- Plans ---
export interface PlanRequest {
  nombre: string;
  precioMensual?: number;
  porcientoDescuentoAnual?: number;
  maxUsuarios?: number;
  maxVehiculos?: number;
  duracion?: number;
  featureIds?: number[];
}

export interface PlanResumidoResponse {
  id: number;
  nombre: string;
  precioMensual: number;
  maxUsuarios: number;
  maxVehiculos: number;
  duracion: number;
  porcientoDescuentoAnual: number;
  activo: boolean;
}

export interface PlanResponse {
  id: number;
  nombre: string;
  precioMensual: number;
  maxUsuarios: number;
  maxVehiculos: number;
  duracion: number;
  porcientoDescuentoAnual: number;
  features: FeatureResponse[];
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: UserAuditResponse;
  modificadoPor: UserAuditResponse;
}

// --- Subscriptions ---
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';

export interface SubscriptionRequest {
  empresaId?: number;
  planId: number;
  status?: SubscriptionStatus;
}

export interface EmpresaResumidaResponse {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface SubscriptionResponse {
  id: number;
  empresa: EmpresaResumidaResponse;
  plan: PlanResumidoResponse;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  currentVehicleCount: number;
  currentUserCount: number;
  version: number;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: UserAuditResponse;
  modificadoPor: UserAuditResponse;
}

export interface CalcularImporteResponse {
  planId: number;
  importe: number;
  facturarAnual: boolean;
}

// --- Menu / App Types ---
export interface DashboardEjecutivoResponse {
  periodo: string;
  costoTotalCombustible: number;
  consumoPromedioFlota: number;
  kmTotalesFlota: number;
  tasaUtilizacionFlota: number;
  eficienciaPromedioChoferes: number;
  vehiculosAlertaMantenimiento: number;
  variacionCostoVsMesAnterior: number;
  desviacionConsumoPromedio: number;
}
export interface MenuItem {
  label: string;
  icon: string;
  path: string;
  permission?: string;
  children?: MenuItem[];
}

// --- Reportes ---

export interface VehiculoConsumoReporteDTO {
  vehiculoId: number;
  matricula: string;
  modelo: string;
  marcaNombre: string;
  tipoCombustibleCodigo: string;
  empresaNombre: string;
  kilometrosTotales: number;
  consumoTeorico: number;
  consumoReal: number;
  desviacionLitros: number;
  desviacionPorcentaje: number;
  eficiencia: number;
}

// --- Reporte Mantenimiento ---

export interface VehiculoResumidoDTO {
  id: number;
  matricula: string;
  modelo: string;
  marcaNombre: string;
  tipoVehiculoNombre: string;
}

export interface EmpresaResumidoDTO {
  id: number;
  codigo: string;
  nombre: string;
}

export interface MantenimientoReporteResponse {
  vehiculoResumido: VehiculoResumidoDTO;
  empresaResumida: EmpresaResumidoDTO;
  fechaUltimoMantenimiento: string;
  odometroUltimoMantenimiento: number;
  odometroActual: number;
  kmDesdeMantenimiento: number;
  umbralKm: number;
  estado: string;
  diasTranscurridos: number;
}

// --- Reporte Abastecimiento ---

export interface AbastecimientoReporteResponse {
  vehiculoResumido: VehiculoResumidoDTO;
  totalAbastecimientos: number;
  totalLitros: number;
  promedioLitrosPorCarga: number;
  frecuenciaDias: number;
  lugarMasFrecuente: string;
  periodo: string;
}

// --- Reporte Consumo por Combustible ---

export interface ResumenEjecutivo {
  periodo: string;
  totalTiposCombustible: number;
  volumenConsumidoTotal: number;
  volumenAbastecidoTotal: number;
  costoEstimadoTotal: number;
  totalRecorridos: number;
  costoPromedioPorLitro: number;
}

export interface DetalleTipoCombustible {
  tipoCombustible: string;
  volumenConsumido: number;
  volumenAbastecido: number;
  costoEstimado: number;
  porcentajeDelTotal: number;
  variacionVsPeriodoAnterior: number;
  cantidadRecorridos: number;
  costoPromedioPorLitro: number;
}

export interface ConsumoCombustibleResponse {
  resumenEjecutivo: ResumenEjecutivo;
  detalle: DetalleTipoCombustible[];
}
