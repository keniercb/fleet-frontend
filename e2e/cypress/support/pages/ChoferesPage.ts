import { BasePage } from './BasePage';

/**
 * Page Object de Gestión de Choferes (/choferes).
 * Formulario personalizado con campos id estables y sub-formulario opcional
 * de categorías de licencia (no se usa en las pruebas E2E básicas).
 */
export class ChoferesPage extends BasePage {
  elementos = {
    tituloPagina: () => cy.get('h1').contains('Choferes'),
    botonNuevo: () => cy.contains('button', 'Nuevo'),
    buscar: () => cy.get('input[placeholder="Buscar..."]'),
    tabla: () => cy.get('table'),
    filas: () => cy.get('table tbody tr'),

    campoNombre: () => cy.get('#nombre'),
    campoApellidos: () => cy.get('#apellidos'),
    campoCarneIdentidad: () => cy.get('#carneIdentidad'),
    campoNumeroLicencia: () => cy.get('#numeroLicencia'),
    campoFechaNacimiento: () => cy.get('#fechaNacimiento'),

    botonEnviarFormulario: () => cy.get('form button[type="submit"]'),
    botonCancelar: () => cy.contains('button', 'Cancelar'),
    botonConfirmarEliminar: () => cy.get('.btn-danger'),
    mensajeConfirmarEliminar: () => cy.contains(
      'p',
      '¿Está seguro que desea eliminar este registro?',
    ),
  };

  debeEstarCargada(): this {
    this.elementos.tituloPagina().should('be.visible');
    this.elementos.botonNuevo().should('be.visible');
    this.elementos.tabla().should('exist');
    return this;
  }

  abrirFormularioNuevo(): this {
    this.elementos.botonNuevo().click();
    this.elementos.campoNombre().should('be.visible');
    return this;
  }

  llenarFormulario(datos: {
    nombre: string;
    apellidos: string;
    carneIdentidad: string;
    numeroLicencia: string;
    fechaNacimiento: string;
  }): this {
    this.elementos.campoNombre().clear().type(datos.nombre);
    this.elementos.campoApellidos().clear().type(datos.apellidos);
    this.elementos.campoCarneIdentidad().clear().type(datos.carneIdentidad);
    this.elementos.campoNumeroLicencia().clear().type(datos.numeroLicencia);
    this.elementos.campoFechaNacimiento().clear().type(datos.fechaNacimiento);
    return this;
  }

  enviarFormulario(): this {
    this.elementos.botonEnviarFormulario().click();
    return this;
  }

  abrirEdicion(identificador: string): this {
    cy.contains('td', identificador)
      .parent('tr')
      .find('button[title="Editar"]')
      .click();
    this.elementos.campoNombre().should('be.visible');
    return this;
  }

  eliminarRegistro(identificador: string): this {
    cy.contains('td', identificador)
      .parent('tr')
      .find('button[title="Eliminar"]')
      .click();
    this.elementos.mensajeConfirmarEliminar().should('be.visible');
    this.elementos.botonConfirmarEliminar().should('be.visible').click();
    return this;
  }

  filaVisible(identificador: string): this {
    cy.contains('td', identificador).should('be.visible');
    return this;
  }

  filaNoVisible(identificador: string): this {
    cy.contains('td', identificador).should('not.exist');
    return this;
  }
}

export const choferesPage = new ChoferesPage();
