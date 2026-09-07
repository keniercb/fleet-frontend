import { BasePage } from './BasePage';

/**
 * Page Object genérico para las páginas de catálogo construidas con el
 * componente <CrudPage/> (Marcas, Provincias, Empresas, Permisos, etc.).
 * La estructura del DOM (tabla, botones "Nuevo", modal con campos id=clave,
 * ConfirmModal con botón .btn-danger) es idéntica para todos los catálogos.
 */
export class TablaCrudPage extends BasePage {
  private readonly titulo: string;

  constructor(titulo: string) {
    super();
    this.titulo = titulo;
  }

  elementos = {
    tituloPagina: () => cy.get('h1').contains(this.titulo),
    /** Caja de búsqueda del CrudPage (placeholder "Buscar..."). */
    buscar: () => cy.get('input[placeholder="Buscar..."]'),
    botonNuevo: () => cy.contains('button', 'Nuevo'),
    tabla: () => cy.get('table'),
    filas: () => cy.get('table tbody tr'),
    /** Botón de envío del formulario dentro del modal abierto. */
    botonEnviarFormulario: () => cy.get('form button[type="submit"]'),
    botonCancelar: () => cy.contains('button', 'Cancelar'),
    /** Botón rojo del ConfirmModal de borrado. */
    botonConfirmarEliminar: () => cy.get('.btn-danger'),
    /** Título del ConfirmModal (h3). */
    tituloConfirmarEliminar: () => cy.get('h3').last(),
  };

  debeEstarCargada(): this {
    this.elementos.tituloPagina().should('be.visible');
    this.elementos.botonNuevo().should('be.visible');
    return this;
  }

  abrirFormularioNuevo(): this {
    this.elementos.botonNuevo().click();
    this.elementos.botonEnviarFormulario().should('be.visible');
    return this;
  }

  escribirCampo(id: string, valor: string): this {
    cy.get(`#${id}`).should('be.visible').clear().type(valor);
    return this;
  }

  enviarFormulario(): this {
    this.elementos.botonEnviarFormulario().click();
    return this;
  }

  cancelarFormulario(): this {
    this.elementos.botonCancelar().click();
    return this;
  }

  /**
   * Busca un valor: si la tabla tiene datos y no coincide ninguna fila,
   * el CrudPage muestra el estado "No se encontraron resultados".
   */
  buscarSinCoincidencias(texto: string): this {
    this.elementos.buscar().should('be.visible').type(texto);
    cy.contains('No se encontraron resultados').should('be.visible');
    return this;
  }

  limpiarBusqueda(): this {
    this.elementos.buscar().clear();
    return this;
  }

  /** Abre el ConfirmModal del registro indicado y confirma el borrado. */
  eliminarRegistro(textoIdentificador: string): this {
    cy.contains('td', textoIdentificador)
      .parent('tr')
      .find('button[title="Eliminar"]')
      .click();
    this.elementos.tituloConfirmarEliminar().should('be.visible');
    this.elementos.botonConfirmarEliminar().should('be.visible').click();
    return this;
  }
}
