/**
 * Módulo: Navegación general y resiliencia ante errores
 * App: fleet-frontend (rama enzonaIntegration)
 *
 * Cubre: Dashboard, ruta inexistente (wildcard → /), CRUD genérico de
 * catálogos (CrudPage), errores de servidor con toast y conmutador de idioma.
 */
import { TablaCrudPage } from '../../support/pages/TablaCrudPage';
import { mainLayoutPage } from '../../support/pages/MainLayoutPage';
import { interceptarSesion } from '../../support/api/interceptores';

// El componente <CrudPage/> es idéntico para todos los catálogos: se prueba
// a través de Marcas como representante (config genérica, misma estructura DOM).
const marcasPage = new TablaCrudPage('Marcas');

describe('Navegación y errores', () => {
  beforeEach(() => {
    interceptarSesion();
    cy.loginPorApi();
  });

  it('NAV-01 @smoke · El Dashboard ejecutivo carga tras autenticarse', () => {
    cy.visit('/');
    cy.wait('@me').its('response.statusCode').should('eq', 200);

    cy.location('pathname').should('eq', '/');
    cy.get('h1').should('be.visible');
    cy.get('header').should('be.visible');
  });

  it('NAV-02 · Redirige las rutas inexistentes al Dashboard (wildcard)', () => {
    cy.visit('/esta-ruta-no-existe-xyz');
    cy.location('pathname').should('eq', '/');
    cy.get('h1').should('be.visible');
  });

  it('NAV-03 @smoke · El CRUD genérico de catálogo abre el formulario de creación', () => {
    cy.visit('/marcas');
    marcasPage.debeEstarCargada();

    marcasPage.abrirFormularioNuevo();
    marcasPage.escribirCampo('nombre', `Marca QA ${Date.now()}`);
    marcasPage.cancelarFormulario();

    // Al cancelar no se persiste nada y volvemos al listado
    cy.get('form').should('not.exist');
    marcasPage.elementos.botonNuevo().should('be.visible');
  });

  it('NAV-04 · Informa el fallo del servidor (500) al cargar un catálogo', () => {
    cy.intercept('GET', '**/marcas*', {
      statusCode: 500,
      body: { message: 'Error 500 simulado por la prueba' },
    }).as('errorServidor');

    cy.visit('/marcas');
    cy.wait('@errorServidor');

    // useCrud propaga el error como toast global del CrudPage
    cy.toastVisible('error', 'Error 500 simulado por la prueba');
    marcasPage.elementos.tituloPagina().should('be.visible');
  });

  it('NAV-05 · Navega al Dashboard desde el Sidebar', () => {
    cy.visit('/marcas');
    marcasPage.debeEstarCargada();

    mainLayoutPage.irAlDashboard();
    cy.location('pathname').should('eq', '/');
    cy.get('h1').should('be.visible');
  });

  it('NAV-06 @regression · El conmutador cambia el idioma de la interfaz a inglés', () => {
    cy.visit('/');
    cy.esperarAppCargada();

    mainLayoutPage.cambiarIdiomaAIngles();

    // El botón activo muestra el código del idioma seleccionado
    mainLayoutPage.elementos.botonIdioma().should('contain.text', 'EN');

    // El título del Sidebar cambia a la traducción inglesa (sin recargar)
    cy.contains('Fleet Management').should('be.visible');
  });
});
