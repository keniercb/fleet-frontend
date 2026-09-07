import { BasePage } from './BasePage';

/**
 * Page Object de Gestión de Vehículos (/vehiculos).
 * Formulario personalizado (no CrudPage) con selects dependientes de catálogos.
 * Todos los campos tienen id estable (#modelo, #matricula, #numeroMotor, ...).
 */
export class VehiculosPage extends BasePage {
  elementos = {
    tituloPagina: () => cy.get('h1').contains('Vehículos'),
    botonNuevo: () => cy.contains('button', 'Nuevo'),
    buscar: () => cy.get('input[placeholder="Buscar..."]'),
    tabla: () => cy.get('table'),
    filas: () => cy.get('table tbody tr'),

    // ---- Campos del formulario ----
    campoTipoVehiculo: () => cy.get('#tipoVehiculoId'),
    campoMarca: () => cy.get('#marcaId'),
    campoChofer: () => cy.get('#choferId'),
    campoTipoCombustible: () => cy.get('#tipoCombustibleId'),
    campoModelo: () => cy.get('#modelo'),
    campoMatricula: () => cy.get('#matricula'),
    campoNumeroMotor: () => cy.get('#numeroMotor'),
    campoOdometro: () => cy.get('#odometro'),
    campoCombustible: () => cy.get('#combustible'),
    campoIndiceConsumo: () => cy.get('#indiceConsumo'),
    campoUltimoMantenimiento: () => cy.get('#ultimoMantenimiento'),
    campoOdometroUltimoMantenimiento: () => cy.get('#odometroUltimoMantenimiento'),

    botonEnviarFormulario: () => cy.get('form button[type="submit"]'),
    botonCancelar: () => cy.contains('button', 'Cancelar'),
    botonConfirmarEliminar: () => cy.get('.btn-danger'),
    mensajeConfirmarEliminar: () => cy.contains(
      'p',
      '¿Está seguro que desea eliminar este registro?',
    ),
  };

  /** La página terminó de cargar: título, botón Nuevo y tabla presentes. */
  debeEstarCargada(): this {
    this.elementos.tituloPagina().should('be.visible');
    this.elementos.botonNuevo().should('be.visible');
    this.elementos.tabla().should('exist');
    return this;
  }

  abrirFormularioNuevo(): this {
    this.elementos.botonNuevo().click();
    this.elementos.campoMatricula().should('be.visible');
    return this;
  }

  /**
   * Selecciona la primera opción real (índice 1: la 0 es "Seleccionar...")
   * de un select cuyo valor es un id numérico.
   */
  seleccionarPrimeraOpcion(
    campo: () => Cypress.Chainable<JQuery<HTMLElement>>,
  ): this {
    campo()
      .should('be.visible')
      .find('option')
      .eq(1)
      .then(($opcion) => {
        campo().select($opcion.val() as string);
      });
    return this;
  }

  llenarFormulario(datos: {
    matricula: string;
    numeroMotor: string;
    modelo: string;
    odometro: string;
    combustible: string;
  }): this {
    // Selects de catálogo (obligatorios en el payload del backend)
    this.seleccionarPrimeraOpcion(this.elementos.campoTipoVehiculo);
    this.seleccionarPrimeraOpcion(this.elementos.campoMarca);
    this.seleccionarPrimeraOpcion(this.elementos.campoTipoCombustible);

    this.elementos.campoModelo().clear().type(datos.modelo);
    this.elementos.campoMatricula().clear().type(datos.matricula);
    this.elementos.campoNumeroMotor().clear().type(datos.numeroMotor);
    this.elementos.campoOdometro().clear().type(datos.odometro);
    this.elementos.campoCombustible().clear().type(datos.combustible);
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
    this.elementos.campoMatricula().should('be.visible');
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

  /** La fila con la matrícula dada es visible en la tabla. */
  filaVisible(identificador: string): this {
    cy.contains('td', identificador).should('be.visible');
    return this;
  }

  /** La fila con la matrícula dada ya no existe. */
  filaNoVisible(identificador: string): this {
    cy.contains('td', identificador).should('not.exist');
    return this;
  }
}

export const vehiculosPage = new VehiculosPage();
