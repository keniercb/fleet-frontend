/**
 * Tipos compartidos de las pruebas E2E.
 * Espejan los DTOs del backend que consume fleet-frontend (src/types/index.ts).
 */

// ---- Auth ----

export interface Credenciales {
  email: string;
  password: string;
}

/** Respuesta de POST /auth/login */
export interface AuthResponse {
  token: string;
  type: string;
  userId: number;
  email: string;
}

/** Página estándar del backend (Spring-style) */
export interface PageResponse<T> {
  totalPages: number;
  totalElements: number;
  size: number;
  content: T[];
  number: number;
  empty: boolean;
}

// ---- Entidades de flota (campos mínimos usados por las pruebas) ----

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
}

export interface VehiculoResponse {
  id: number;
  matricula: string;
  modelo: string;
  odometro: number;
  activo: boolean;
}

export interface ChoferRequest {
  empresaId: number;
  nombre: string;
  apellidos: string;
  carneIdentidad: string;
  numeroLicencia: string;
  fechaNacimiento: string;
}

export interface ChoferResponse {
  id: number;
  nombre: string;
  apellidos: string;
  carneIdentidad: string;
  numeroLicencia: string;
  activo: boolean;
}

// ---- Pagos Enzona ----

export type PaymentStatus =
  | 'PENDIENTE'
  | 'QR_GENERADO'
  | 'PAGADO'
  | 'FALLIDO'
  | 'EXPIRADO'
  | 'CANCELADO';

export type PaymentType = 'NUEVA_SUSCRIPCION' | 'RENOVACION' | 'UPGRADE';

export interface PaymentCreateRequest {
  planId: number;
  type: PaymentType;
  subscriptionId?: number;
  facturarAnual?: boolean;
}

/** Respuesta de POST /payments y GET /payments/{id}/status */
export interface PaymentResponse {
  id: number;
  plan: { nombre: string };
  amount: number;
  currency: string;
  status: PaymentStatus;
  type: PaymentType;
  qrCode?: string;
  qrImageBase64?: string;
  externalTransactionId?: string;
  errorMessage?: string;
  expiresAt?: string;
  retryCount: number;
  confirmed: boolean;
}

/** GET /plans/{id}/calcular-importe */
export interface CalcularImporteResponse {
  importe: number;
}

// ---- Fixtures tipados ----

export interface FixturePago extends PaymentResponse {
  _nota?: string;
}
