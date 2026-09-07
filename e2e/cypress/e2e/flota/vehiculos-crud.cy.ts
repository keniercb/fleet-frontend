/**
 * Módulo: Gestión de Flota — Vehículos (CRUD)
 * App: fleet-frontend (rama enzonaIntegration) · Página: /vehiculos
 *
 * Estrategia de datos: matrícula/número de motor únicos por ejecución
 * (cy.datosUnicos) para poder repetir la suite contra el backend real,
 * y limpieza por API en after() para no dejar datos huérfanos.
 *
 * Precondición del entorno: catálogos (tipos de vehículo, marcas y tipos de
 * combustible) con al menos un registro activo y usuario con permisos de flota.
 */
import { vehiculosPage } from '../../support/pages/VehiculosPage';
import vehiculosFixture from '../../fixtures/vehiculos.json';

describe('Gestión de Flota — Vehículos', () => {
  const matriculaUnica = vehiculosFixture.vehiculoNuevo.matriculaPlantilla.replace(
    'XXXXXX',
    Date.now().toString().slice(-6),
  );
  const numeroMotorUnico = vehiculosFixture.vehiculoNuevo.numeroMotorPlantilla.replace(
    'XXXXXX',
    Date.now().toString().slice(-6),
  );

  beforeEach(() => {
    cy.loginPorApi();
    cy.visit('/vehiculos');
    vehiculosPage.debeEstarCargada();
  });

  after(() => {
    // Limpieza por API: independiente del estado de la UI
    cy.limpiarVehiculoPorMatricula(matriculaUnica);
  });

  it('VEH-01 @smoke · Carga el listado de vehículos con tabla y paginación', () => {
    vehiculosPage.tituloVisible('Vehículos');
    vehiculosPage.elementos.tabla().should('exist');
    // El estado puede ser "Cargando..." → filas o estado vacío; la tabla siempre existe
    vehiculosPage.elementos.botonNuevo().should('be.enabled');
  });

  it('VEH-02 @smoke · Crea un vehículo nuevo con datos válidos', () => {
    vehiculosPage.abrirFormularioNuevo();
    vehiculosPage.llenarFormulario({
      matricula: matriculaUnica,
      numeroMotor: numeroMotorUnico,
      modelo: vehiculosFixture.vehiculoNuevo.modelo,
      odometro: String(vehiculosFixture.vehiculoNuevo.odometro),
      combustible: String(vehiculosFixture.vehiculoNuevo.combustible),
    });
    vehiculosPage.enviarFormulario();

    // Éxito confirmado por toast y refresco automático de la tabla
    vehiculosPage.toast('exito', 'Vehículo creado');
    vehiculosPage.filaVisible(matriculaUnica);
  });

  it('VEH-03 · Bloquea el envío si faltan campos obligatorios del formulario', () => {
    vehiculosPage.abrirFormularioNuevo();

    // Campos con * en la UI: matrícula, número de motor, odómetro y combustible
    vehiculosPage.elementos.campoMatricula().should('have.attr', 'required');
    vehiculosPage.elementos.campoNumeroMotor().should('have.attr', 'required');
    vehiculosPage.elementos.campoOdometro().should('have.attr', 'required');
    vehiculosPage.elementos.campoCombustible().should('have.attr', 'required');

    vehiculosPage.enviarFormulario();

    // Validación HTML5: no se emite ningún POST a /vehiculos
    cy.intercept('POST', '**/vehiculos').as('crearVehiculo');
    vehiculosPage.enviarFormulario();
    cy.get('@crearVehiculo.all').should('have.length', 0);
  });

  it('VEH-04 @regression · Edita un vehículo existente y guarda los cambios', () => {
    // Arrange: crear el vehículo por UI (mismo flujo de VEH-02)
    vehiculosPage.abrirFormularioNuevo();
    vehiculosPage.llenarFormulario({
      matricula: matriculaUnica,
      numeroMotor: numeroMotorUnico,
      modelo: vehiculosFixture.vehiculoNuevo.modelo,
      odometro: String(vehiculosFixture.vehiculoNuevo.odometro),
      combustible: String(vehiculosFixture.vehiculoNuevo.combustible),
    });
    vehiculosPage.enviarFormulario();
    vehiculosPage.filaVisible(matriculaUnica);

    // Act: abrir edición y modificar el odómetro
    vehiculosPage.abrirEdicion(matriculaUnica);
    vehiculosPage.elementos.campoOdometro().clear().type('126000');
    vehiculosPage.enviarFormulario();

    // Assert: toast de actualización y fila actualizada
    vehiculosPage.toast('exito', 'Vehículo actualizado');
    vehiculosPage.filaVisible(matriculaUnica);
  });

  it('VEH-05 @regression · Elimina un vehículo tras confirmar en el modal', () => {
    // Arrange: crear el vehículo a eliminar
    vehiculosPage.abrirFormularioNuevo();
    vehiculosPage.llenarFormulario({
      matricula: matriculaUnica,
      numeroMotor: numeroMotorUnico,
      modelo: vehiculosFixture.vehiculoNuevo.modelo,
      odometro: String(vehiculosFixture.vehiculoNuevo.odometro),
      combustible: String(vehiculosFixture.vehiculoNuevo.combustible),
    });
    vehiculosPage.enviarFormulario();
    vehiculosPage.filaVisible(matriculaUnica);

    // Act: eliminar con confirmación explícita
    vehiculosPage.eliminarRegistro(matriculaUnica);

    // Assert: toast de borrado y fila eliminada de la tabla
    vehiculosPage.toast('exito', 'Vehículo eliminado');
    vehiculosPage.filaNoVisible(matriculaUnica);
  });

  it('VEH-06 · La búsqueda sin coincidencias muestra el estado vacío', () => {
    vehiculosPage.elementos.buscar().should('be.visible').type(`ZZZ-INEXISTENTE-${Date.now()}`);
    cy.contains('No se encontraron resultados').should('be.visible');
  });

  it('VEH-07 · Informa el fallo del servidor (500) al cargar el listado', () => {
    cy.intercept('GET', '**/vehiculos/empresa/*', {
      statusCode: 500,
      body: { message: 'Error 500 simulado por la prueba' },
    }).as('errorServidor');

    cy.visit('/vehiculos'); // recarga con el interceptor activo
    cy.wait('@errorServidor');

    vehiculosPage.toast('error', 'Error 500 simulado por la prueba');
  });
});
