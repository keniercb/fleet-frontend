/**
 * Helpers de red (cy.intercept) reutilizables.
 *
 * Reglas de oro:
 *  - NUNCA se usa cy.wait(milisegundos) fijos: toda espera es sobre un alias
 *    de red o sobre la retry-ability de las aserciones.
 *  - Con "backend real" los interceptores son ESPÍAS (observan sin alterar),
 *    salvo en los escenarios de transición de pago Enzona y de errores
 *    simulados (500), donde se stubbean endpoints acotados y justificados.
 */
import type { PaymentResponse } from '../types';

/** Base de la API: <apiUrl> si está definida, si no <baseUrl>/api (proxy de Vite). */
export function apiBase(): string {
  const explícita = Cypress.env('apiUrl') as string | undefined;
  return explícita && explícita.length > 0
    ? explícita
    : `${Cypress.config('baseUrl') as string}/api`;
}

/** ¿Están activos los mocks de transición de pago? (CYPRESS_mockEstadosPago) */
export function mockEstadosPagoActivos(): boolean {
  const valor = Cypress.env('mockEstadosPago');
  return valor !== false && String(valor) !== 'false';
}

/** Alias de red del ciclo de sesión: login, /auth/me y logout. */
export function interceptarSesion(): void {
  cy.intercept('POST', `${apiBase()}/auth/login`).as('login');
  cy.intercept('GET', `${apiBase()}/auth/me`).as('me');
  cy.intercept('POST', `${apiBase()}/auth/logout`).as('logout');
}

/** Alias para los GET de planes y cálculo de importe (página Comprar Planes). */
export function interceptarPlanes(): void {
  // GET /plans?page=0&perPage=500 — regex para no chocar con /plans/{id}/...
  cy.intercept('GET', /\/plans\?/).as('planes');
  cy.intercept('GET', /\/plans\/\d+\/calcular-importe/).as('importe');
  cy.intercept('GET', `${apiBase()}/subscriptions/my-company`).as('suscripcion');
}

/** Alias para el ciclo de vida de pagos (crear / cancelar / reintentar). */
export function interceptarPagos(): void {
  cy.intercept('POST', `${apiBase()}/payments`).as('crearPago');
  cy.intercept('POST', /\/payments\/\d+\/cancel/).as('cancelarPago');
  cy.intercept('POST', /\/payments\/\d+\/retry/).as('reintentarPago');
}

/**
 * Fija el estado que devolverá GET /payments/{id}/status.
 * El `id` del pago se toma de la URL real (el pago se crea contra el backend real).
 */
export function interceptarEstadoPagoFijo(estado: PaymentResponse): void {
  cy.intercept('GET', /\/payments\/\d+\/status/, (req) => {
    const id = Number(req.url.match(/payments\/(\d+)\/status/)?.[1]);
    req.reply({ statusCode: 200, body: { ...estado, id } });
  }).as('estadoPago');
}

/**
 * Secuencia de estados para el polling automático (cada 5 s la app consulta
 * GET /payments/{id}/status): responde `estados[i]` en la i-ésima llamada y
 * mantiene el último estado al agotarse la lista.
 */
export function interceptarEstadoPagoSecuencial(estados: PaymentResponse[]): void {
  let indice = 0;
  cy.intercept('GET', /\/payments\/\d+\/status/, (req) => {
    const id = Number(req.url.match(/payments\/(\d+)\/status/)?.[1]);
    const estado = estados[Math.min(indice, estados.length - 1)];
    indice += 1;
    req.reply({ statusCode: 200, body: { ...estado, id } });
  }).as('estadoPago');
}

/**
 * Simula un fallo del servidor (por defecto 500) en un endpoint,
 * con cuerpo coherente con el formato de error del backend ({ message }).
 */
export function interceptarErrorServidor(
  metodo: 'GET' | 'POST' | 'PUT' | 'DELETE',
  patron: RegExp | string,
  codigo = 500,
): void {
  cy.intercept(metodo, patron, {
    statusCode: codigo,
    body: { message: `Error ${codigo} simulado por la prueba` },
  }).as('errorServidor');
}
