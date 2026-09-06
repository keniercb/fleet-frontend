/**
 * Módulo: Autenticación — Formulario de Login
 * App: fleet-frontend (rama enzonaIntegration) · Página: /login
 *
 * Estrategia: pruebas por UI del propio formulario de login, con alias de
 * red para esperar respuestas reales del backend (nunca esperas fijas).
 */
import { loginPage } from '../../support/pages/LoginPage';
import { interceptarSesion } from '../../support/api/interceptores';

describe('Autenticación — Login', () => {
  beforeEach(() => {
    interceptarSesion();
  });

  it('UI-LOGIN-01 @smoke · Realiza login exitoso con credenciales válidas y accede al Dashboard', () => {
    loginPage
      .visitar()
      .iniciarSesion(Cypress.env('usuario'), Cypress.env('password'));

    // Espera de red real: el POST /auth/login responde 200 con el token
    cy.wait('@login').its('response.statusCode').should('eq', 200);

    // AuthContext completa el perfil con GET /auth/me antes de mostrar rutas protegidas
    cy.wait('@me').its('response.statusCode').should('eq', 200);

    // Redirección al Dashboard (ruta index) y layout privado renderizado
    cy.location('pathname').should('eq', '/');
    cy.get('header').should('be.visible');

    // El token quedó persistido para la sesión del navegador
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.not.be.null;
      expect(win.localStorage.getItem('user')).to.not.be.null;
    });
  });

  it('UI-LOGIN-02 · Rechaza credenciales inválidas y mantiene al usuario en /login', () => {
    loginPage
      .visitar()
      .escribirCorreo('usuario.inexistente@correo.cu')
      .escribirContrasena('ClaveIncorrecta123')
      .enviar();

    cy.wait('@login').its('response.statusCode').should('eq', 401);

    // Nota (hallazgo de calidad): el interceptor 401 del cliente HTTP recarga
    // la página hacia /login, por lo que el mensaje de error es efímero.
    // La aserción estable es: el usuario NUNCA accede a rutas privadas.
    cy.location('pathname').should('eq', '/login');
    cy.get('header').should('not.exist');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null;
    });
  });

  it('UI-LOGIN-03 · Muestra el mensaje de error del servidor ante un fallo 500', () => {
    // 500 simulado: NO provoca el hard-redirect del 401, así el banner es estable
    cy.intercept('POST', '**/auth/login', {
      statusCode: 500,
      body: { message: 'Error interno simulado por la prueba' },
    }).as('login500');

    loginPage
      .visitar()
      .escribirCorreo(Cypress.env('usuario'))
      .escribirContrasena('CualquierClave123')
      .enviar();

    cy.wait('@login500');
    loginPage.debeMostrarError('Error interno simulado por la prueba');
    cy.location('pathname').should('eq', '/login');
  });

  it('UI-LOGIN-04 · No envía la petición si faltan campos obligatorios (validación HTML5)', () => {
    loginPage.visitar();

    // Ambos inputs son required en el DOM
    loginPage.elementos.correo().should('have.attr', 'required');
    loginPage.elementos.contrasena().should('have.attr', 'required');

    // Envío con el formulario vacío: el navegador bloquea el submit
    loginPage.enviar();

    // Ninguna petición de login debe haberse emitido
    cy.get('@login.all').should('have.length', 0);
    cy.location('pathname').should('eq', '/login');
  });

  it('UI-LOGIN-05 @regression · Deshabilita el botón mientras la petición está en curso', () => {
    // Respuesta exitosa retardada 2 s para poder observar el estado de carga
    cy.intercept('POST', '**/auth/login', (req) => {
      req.reply({
        statusCode: 200,
        delay: 2000,
        body: { token: 'token-de-prueba', type: 'Bearer', userId: 1, email: Cypress.env('usuario') },
      });
    }).as('loginLento');

    loginPage.visitar().iniciarSesion(Cypress.env('usuario'), 'CualquierClave123');

    // Durante la espera el botón está deshabilitado con el texto de carga
    loginPage.debeEstarCargando();

    cy.wait('@loginLento');
  });

  it('UI-LOGIN-06 @regression · Redirige al Dashboard si un usuario autenticado visita /login', () => {
    // PublicOnlyRoute: si hay sesión activa, /login redirige a "/"
    cy.loginPorApi();
    cy.visit('/login');

    cy.wait('@me').its('response.statusCode').should('eq', 200);
    cy.location('pathname').should('eq', '/');
    cy.get('header').should('be.visible');
  });
});
