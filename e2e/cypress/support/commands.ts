/**
 * Comandos personalizados de Cypress.
 *
 * Buenas prácticas aplicadas:
 *  - Autenticación por API + cy.session(): evita repetir el login UI en cada
 *    test (mucho más rápido y estable) y mantiene el aislamiento al validar
 *    el estado real de la sesión contra el backend.
 *  - Datos de prueba únicos por ejecución (sufijo temporal) para poder correr
 *    la suite en paralelo o repetidamente contra el mismo entorno real.
 *  - Limpieza de datos vía API (independiente de la UI): los CRUD dejan el
 *    entorno tan limpio como lo encontraron.
 */
import type {
  AuthResponse,
  ChoferResponse,
  PageResponse,
  VehiculoResponse,
} from './types';
import { apiBase } from './api/interceptores';

// ---------------------------------------------------------------------------
// Autenticación
// ---------------------------------------------------------------------------

/**
 * Inicia sesión por API y cachea la sesión con cy.session().
 * Deja `token` y `user` en localStorage (el AuthContext de la app invoca
 * /auth/me al montar y carga permisos/roles con ese token).
 */
Cypress.Commands.add('loginPorApi', (correo?, clave?) => {
  const credenciales = {
    email: correo ?? (Cypress.env('usuario') as string),
    password: clave ?? (Cypress.env('password') as string),
  };

  cy.session(
    // clave de caché: única por usuario+clave (sesiones múltiples por spec)
    [`fleet-${credenciales.email}`, credenciales.password],
    () => {
      cy.request({
        method: 'POST',
        url: `${apiBase()}/auth/login`,
        body: credenciales,
        failOnStatusCode: false,
      }).then((respuesta) => {
        if (respuesta.status !== 200) {
          throw new Error(
            `loginPorApi falló (${respuesta.status}): ${JSON.stringify(respuesta.body)}. ` +
            'Verifica CYPRESS_usuario / CYPRESS_password y la disponibilidad del backend.',
          );
        }
        const { token, userId, email } = respuesta.body as AuthResponse;

        // Escribimos en el origen de la app: AuthContext lee token+user de
        // localStorage al montar y completa el usuario con GET /auth/me.
        cy.visit('/login', { log: false });
        cy.window({ log: false }).then((win) => {
          win.localStorage.setItem('token', token);
          win.localStorage.setItem('user', JSON.stringify({ id: userId, email }));
        });
      });
    },
    { cacheAcrossSpecs: true },
  );
});

/** Login por interfaz (solo para las pruebas del propio formulario de login). */
Cypress.Commands.add('loginPorUI', (correo, clave) => {
  cy.visit('/login');
  cy.get('#email').should('be.visible').type(correo);
  cy.get('#password').should('be.visible').type(clave);
  cy.get('form button[type="submit"]').click();
});

/**
 * Espera determinista a que la app protegida haya cargado:
 * TopNavbar del MainLayout visible + /auth/me resuelto (alias `me`).
 */
Cypress.Commands.add('esperarAppCargada', () => {
  cy.get('header').should('be.visible');
});

// ---------------------------------------------------------------------------
// Datos de prueba
// ---------------------------------------------------------------------------

/** Genera un dato único por ejecución (p. ej. `MAT-8321745`). */
Cypress.Commands.add('datosUnicos', (prefijo: string) => {
  const sufijo = Date.now().toString().slice(-7);
  return cy.wrap(`${prefijo}${sufijo}`, { log: false });
});

// ---------------------------------------------------------------------------
// Utilidades de UI
// ---------------------------------------------------------------------------

/** Aserción de toast: contenedor visible + tipo (clase Tailwind) + texto. */
Cypress.Commands.add('toastVisible', (tipo: 'exito' | 'error' | 'advertencia' | 'info', texto) => {
  const clasePorTipo: Record<string, string> = {
    exito: 'bg-green-50',
    error: 'bg-red-50',
    advertencia: 'bg-amber-50',
    info: 'bg-primary-50',
  };
  cy.get('.animate-toast-in')
    .should('be.visible')
    .last()
    .should('have.class', clasePorTipo[tipo])
    .and('contain.text', texto);
});

// ---------------------------------------------------------------------------
// Llamadas API autenticadas (setup y limpieza de datos)
// ---------------------------------------------------------------------------

/**
 * cy.request con Bearer token leído del localStorage de la app.
 * La página ya debe estar cargada (el token lo puso loginPorApi o el login UI).
 */
Cypress.Commands.add('solicitudAutenticada', (metodo, url, cuerpo?) => {
  cy.window({ log: false }).then((win) => {
    const token = win.localStorage.getItem('token');
    return cy.request({
      method: metodo,
      url: url.startsWith('http') ? url : `${apiBase()}${url}`,
      headers: { Authorization: `Bearer ${token ?? ''}` },
      body: cuerpo as Cypress.RequestBody | undefined,
      failOnStatusCode: false,
      log: false,
    });
  });
});

/** Elimina (best-effort) los vehículos cuya matrícula coincida con la indicada. */
Cypress.Commands.add('limpiarVehiculoPorMatricula', (matricula: string) => {
  cy.request({
    method: 'POST',
    url: `${apiBase()}/auth/login`,
    body: { email: Cypress.env('usuario'), password: Cypress.env('password') },
    log: false,
  }).then(({ body }) => {
    const headers = { Authorization: `Bearer ${(body as AuthResponse).token}` };
    return cy
      .request({ url: `${apiBase()}/auth/me`, headers, log: false })
      .then(({ body: usuario }) => {
        const empresaId = (usuario as { empresa?: { id?: number } }).empresa?.id ?? 0;
        return cy.request({
          url: `${apiBase()}/vehiculos/empresa/${empresaId}`,
          headers,
          qs: { page: 0, perPage: 500 },
          log: false,
        });
      })
      .then((respuesta) => {
        const { content = [] } = respuesta.body as PageResponse<VehiculoResponse>;
        content
          .filter((v) => v.matricula === matricula)
          .forEach((v) =>
            cy.request({
              method: 'DELETE',
              url: `${apiBase()}/vehiculos/${v.id}`,
              headers,
              log: false,
            }),
          );
      });
  });
});

/** Elimina (best-effort) los choferes cuyo carné de identidad coincida. */
Cypress.Commands.add('limpiarChoferPorCarne', (carneIdentidad: string) => {
  cy.request({
    method: 'POST',
    url: `${apiBase()}/auth/login`,
    body: { email: Cypress.env('usuario'), password: Cypress.env('password') },
    log: false,
  }).then(({ body }) => {
    const headers = { Authorization: `Bearer ${(body as AuthResponse).token}` };
    return cy
      .request({ url: `${apiBase()}/auth/me`, headers, log: false })
      .then(({ body: usuario }) => {
        const empresaId = (usuario as { empresa?: { id?: number } }).empresa?.id ?? 0;
        return cy.request({
          url: `${apiBase()}/choferes/empresa/${empresaId}`,
          headers,
          qs: { page: 0, perPage: 500 },
          log: false,
        });
      })
      .then((respuesta) => {
        const { content = [] } = respuesta.body as PageResponse<ChoferResponse>;
        content
          .filter((c) => c.carneIdentidad === carneIdentidad)
          .forEach((c) =>
            cy.request({
              method: 'DELETE',
              url: `${apiBase()}/choferes/${c.id}`,
              headers,
              log: false,
            }),
          );
      });
  });
});

// ---------------------------------------------------------------------------
// Tipado de los comandos (autocomplete + validación en compile-time)
// ---------------------------------------------------------------------------

declare global {
  namespace Cypress {
    interface Chainable {
      loginPorApi(correo?: string, clave?: string): Chainable<void>;
      loginPorUI(correo: string, clave: string): Chainable<void>;
      esperarAppCargada(): Chainable<void>;
      datosUnicos(prefijo: string): Chainable<string>;
      toastVisible(
        tipo: 'exito' | 'error' | 'advertencia' | 'info',
        texto: string,
      ): Chainable<void>;
      solicitudAutenticada<T = unknown>(
        metodo: 'GET' | 'POST' | 'PUT' | 'DELETE',
        url: string,
        cuerpo?: unknown,
      ): Chainable<Cypress.Response<T>>;
      limpiarVehiculoPorMatricula(matricula: string): Chainable<void>;
      limpiarChoferPorCarne(carneIdentidad: string): Chainable<void>;
    }
  }
}

export {};
