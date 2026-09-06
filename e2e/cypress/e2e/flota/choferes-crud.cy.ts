/**
 * Módulo: Gestión de Flota — Choferes (CRUD)
 * App: fleet-frontend (rama enzonaIntegration) · Página: /choferes
 *
 * Estrategia: carné de identidad y licencia únicos por ejecución,
 * limpieza por API en after(). El sub-formulario de categorías es opcional
 * (la app solo envía categorías con categoría+fecha completas), así que se
 * crea el chofer sin categorías.
 */
import { choferesPage } from '../../support/pages/ChoferesPage';
import choferesFixture from '../../fixtures/choferes.json';

describe('Gestión de Flota — Choferes', () => {
  const carneUnico = Date.now().toString().slice(-11); // 11 dígitos, formato cubano
  const licenciaUnica = choferesFixture.choferNuevo.numeroLicenciaPlantilla.replace(
    'XXXXXX',
    Date.now().toString().slice(-6),
  );
  const apellidosUnicos = `${choferesFixture.choferNuevo.apellidos} ${carneUnico.slice(-4)}`;

  beforeEach(() => {
    cy.loginPorApi();
    cy.visit('/choferes');
    choferesPage.debeEstarCargada();
  });

  after(() => {
    cy.limpiarChoferPorCarne(carneUnico);
  });

  it('CHO-01 @smoke · Carga el listado de choferes', () => {
    choferesPage.tituloVisible('Choferes');
    choferesPage.elementos.tabla().should('exist');
    choferesPage.elementos.botonNuevo().should('be.enabled');
  });

  it('CHO-02 @smoke · Crea un chofer nuevo con datos válidos', () => {
    choferesPage.abrirFormularioNuevo();
    choferesPage.llenarFormulario({
      nombre: choferesFixture.choferNuevo.nombre,
      apellidos: apellidosUnicos,
      carneIdentidad: carneUnico,
      numeroLicencia: licenciaUnica,
      fechaNacimiento: choferesFixture.choferNuevo.fechaNacimiento,
    });
    choferesPage.enviarFormulario();

    choferesPage.toast('exito', 'Chofer creado');
    choferesPage.filaVisible(carneUnico);
  });

  it('CHO-03 · Bloquea el envío si faltan campos obligatorios', () => {
    choferesPage.abrirFormularioNuevo();

    choferesPage.elementos.campoNombre().should('have.attr', 'required');
    choferesPage.elementos.campoApellidos().should('have.attr', 'required');
    choferesPage.elementos.campoCarneIdentidad().should('have.attr', 'required');
    choferesPage.elementos.campoNumeroLicencia().should('have.attr', 'required');
    choferesPage.elementos.campoFechaNacimiento().should('have.attr', 'required');

    // El click no dispara ninguna petición de creación
    choferesPage.enviarFormulario();
    cy.get('form button[type="submit"]').should('be.visible'); // sigue en el modal
  });

  it('CHO-04 @regression · Edita un chofer y guarda los cambios', () => {
    // Arrange
    choferesPage.abrirFormularioNuevo();
    choferesPage.llenarFormulario({
      nombre: choferesFixture.choferNuevo.nombre,
      apellidos: apellidosUnicos,
      carneIdentidad: carneUnico,
      numeroLicencia: licenciaUnica,
      fechaNacimiento: choferesFixture.choferNuevo.fechaNacimiento,
    });
    choferesPage.enviarFormulario();
    choferesPage.filaVisible(carneUnico);

    // Act: cambiar el nombre
    choferesPage.abrirEdicion(carneUnico);
    choferesPage.elementos.campoNombre().clear().type('Joaquín');
    choferesPage.enviarFormulario();

    // Assert
    choferesPage.toast('exito', 'Chofer actualizado');
    choferesPage.filaVisible(carneUnico);
  });

  it('CHO-05 @regression · Elimina un chofer tras confirmar en el modal', () => {
    // Arrange
    choferesPage.abrirFormularioNuevo();
    choferesPage.llenarFormulario({
      nombre: choferesFixture.choferNuevo.nombre,
      apellidos: apellidosUnicos,
      carneIdentidad: carneUnico,
      numeroLicencia: licenciaUnica,
      fechaNacimiento: choferesFixture.choferNuevo.fechaNacimiento,
    });
    choferesPage.enviarFormulario();
    choferesPage.filaVisible(carneUnico);

    // Act
    choferesPage.eliminarRegistro(carneUnico);

    // Assert
    choferesPage.toast('exito', 'Chofer eliminado');
    choferesPage.filaNoVisible(carneUnico);
  });
});
