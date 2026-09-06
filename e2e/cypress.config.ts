import { defineConfig } from 'cypress';
import { createRequire } from 'node:module';
// El proyecto es ESM ("type": "module"): creamos un require para el plugin CJS de grep
const requireCjs = createRequire(import.meta.url);
const grep = requireCjs('@cypress/grep/src/plugin');

/**
 * Configuración E2E — fleet-frontend (rama enzonaIntegration)
 *
 * Las variables CYPRESS_* (entorno/CI) tienen prioridad sobre los valores
 * por defecto definidos aquí. Ver .env.example para el catálogo completo.
 */
export default defineConfig({
  e2e: {
    // URL del frontend (vite dev server o build desplegado en staging)
    baseUrl: process.env.CYPRESS_baseUrl ?? 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',

    // Vista de escritorio: el layout (sidebar fijo + topbar) es estable
    viewportWidth: 1440,
    viewportHeight: 900,

    // Reintentos automáticos: amortiguan la inestabilidad en modo headless/CI
    retries: {
      runMode: 2,
      openMode: 0,
    },

    // Evidencias
    screenshotOnRunFailure: true,
    video: false,

    // Timeouts generosos para backends reales (latencia de staging / Enzona)
    defaultCommandTimeout: 10_000,
    requestTimeout: 15_000,
    responseTimeout: 30_000,
    pageLoadTimeout: 60_000,

    // No cancelamos tests hermanos: un fallo no debe ocultar el estado del resto

    setupNodeEvents(on, config) {
      // Etiquetas @smoke / @regression vía --env grepTags
      return grep(config);
    },

    env: {
      /**
       * API del backend. Vacío ⇒ se deriva como `<baseUrl>/api`
       * (igual que el proxy de Vite en desarrollo).
       */
      apiUrl: process.env.CYPRESS_apiUrl ?? '',
      /** Credenciales del usuario ADMIN de pruebas (backend real). */
      usuario: process.env.CYPRESS_usuario ?? '',
      password: process.env.CYPRESS_password ?? '',
      /** Credenciales de un usuario SIN permisos (opcional, para 403). */
      usuarioSinPermisos: process.env.CYPRESS_usuarioSinPermisos ?? '',
      passwordSinPermisos: process.env.CYPRESS_passwordSinPermisos ?? '',
      /**
       * true  ⇒ se interceptan SOLO los endpoints de transición de estado
       *          del pago (GET /payments/{id}/status, POST /payments/{id}/retry),
       *          porque exigen que un humano escanee el QR de Enzona.
       * false ⇒ nada se intercepta: integración pura contra el backend
       *          (solo se ejecutan los escenarios seguros: crear + cancelar).
       */
      mockEstadosPago: true,
    },
  },
});
