/**
 * Módulo: Autenticación — Ciclo de sesión y control de acceso
 * App: fleet-frontend (rama enzonaIntegration)
 *
 * Cubre: logout, guards de rutas protegidas, token inválido/expirado (401),
 * persistencia de sesión tras recarga y pantalla de Acceso Denegado (403).
 */
import { mainLayoutPage } from '../../support/pages/MainLayoutPage';
import { interceptarSesion } from '../../support/api/interceptores';

describe('Autenticación — Sesión y guards', () => {
  beforeEach(() => {
    interceptarSesion();
  });

  it('SES-01 @smoke · Cierra sesión desde el menú de usuario y limpia el almacenamiento', () => {
    cy.loginPorApi();
    cy.visit('/');
    cy.esperarAppCargada();

    mainLayoutPage.cerrarSesion(Cypress.env('usuario'));

    // La app invoca el endpoint real de logout antes de redirigir
    cy.wait('@logout');
    cy.location('pathname').should('eq', '/login');
    cy.get('h1').should('be.visible');

    // El almacenamiento debe quedar limpio (sin token ni usuario)
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null;
      expect(win.localStorage.getItem('user')).to.be.null;
    });
  });

  it('SES-02 · Redirige a /login al intentar entrar a una ruta protegida sin sesión', () => {
    // Sin loginPorApi: navegador limpio
    cy.visit('/vehiculos');

    // ProtectedRoute manda a /login cuando no hay usuario autenticado
    cy.location('pathname').should('eq', '/login');
    cy.get('#email').should('be.visible');

    // Ruta protegida de super admin también queda bloqueada
    cy.visit('/planes');
    cy.location('pathname').should('eq', '/login');
  });

  it('SES-03 · Invalida la sesión ante un token expirado (401 en /auth/me)', () => {
    cy.visit('/login');

    // Simulamos un token previo inválido (p. ej. sesión expirada en otro equipo)
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'token-expirado-o-falsificado');
      win.localStorage.setItem('user', JSON.stringify({ id: 999999, email: 'fantasma@correo.cu' }));
    });

    cy.visit('/');

    // El backend rechaza el token al cargar /auth/me
    cy.wait('@me').its('response.statusCode').should('eq', 401);

    // La app limpia credenciales y redirige al login (Navigate o interceptor 401)
    cy.location('pathname').should('eq', '/login');
    cy.get('#email').should('be.visible');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null;
      expect(win.localStorage.getItem('user')).to.be.null;
    });
  });

  it('SES-04 @regression · La sesión persiste tras recargar la página (F5)', () => {
    cy.loginPorApi();
    cy.visit('/');
    cy.esperarAppCargada();

    // Recarga completa: el AuthContext revalida contra /auth/me
    cy.reload();
    cy.wait('@me').its('response.statusCode').should('eq', 200);

    cy.location('pathname').should('eq', '/');
    cy.get('header').should('be.visible');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.not.be.null;
    });
  });

  // Solo se ejecuta si CYPRESS_usuarioSinPermisos está configurado
  it('SES-05 · Muestra "Acceso Denegado" a un usuario sin el permiso requerido', function () {
    const correo = Cypress.env('usuarioSinPermisos') as string | undefined;
    const clave = Cypress.env('passwordSinPermisos') as string | undefined;
    if (!correo || !clave) {
      cy.log('CYPRESS_usuarioSinPermisos no configurado — test omitido');
      return this.skip();
    }

    cy.loginPorApi(correo, clave);
    cy.visit('/vehiculos');
    cy.wait('@me').its('response.statusCode').should('eq', 200);

    cy.contains('h2', 'Acceso Denegado').should('be.visible');
    cy.contains('No tiene permisos para acceder a esta sección.').should('be.visible');
  });
});
