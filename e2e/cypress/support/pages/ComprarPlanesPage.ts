import { BasePage } from './BasePage';

/**
 * Page Object de "Comprar Planes" (/comprar-plan) — integración de pagos Enzona.
 * Flujo: seleccionar plan → (opcional) facturación anual → Comprar →
 * modal "Pago Enzona" con QR + polling de estado cada 5 s.
 */
export class ComprarPlanesPage extends BasePage {
  elementos = {
    tituloPagina: () => cy.get('h1').contains('Comprar Planes'),

    /** Suscripción actual (card superior). */
    bloqueSuscripcion: () => cy.contains('h3', 'Suscripción Actual'),
    suscripcionSinPlan: () => cy.contains('no tiene una suscripción activa'),

    /** Selección de plan. */
    selectPlan: () => cy.get('#plan-select'),
    chkFacturacionAnual: () => cy.get('#facturacion-anual'),
    etiquetaFacturacionAnual: () => cy.get('label[for="facturacion-anual"]'),

    /** Detalles del plan seleccionado. */
    costoAPagar: () => cy.contains('label', 'Costo a Pagar').next('p'),
    duracionSuscripcion: () => cy.contains('label', 'Duración de la Suscripción').next('p'),

    /** Botón principal de compra (texto exacto "Comprar"). */
    botonComprar: () => cy.contains('button', /^Comprar$/),

    // ---- Modal de pago Enzona ----
    tituloModal: () => cy.contains('h2', 'Pago Enzona'),
    imagenQr: () => cy.get('img[alt="QR Enzona"]'),
    codigoQrTexto: () => cy.get('span.font-mono'),
    /** Badge de estado dentro del modal (span.rounded-full). */
    badgeEstado: () => cy.contains('h2', 'Pago Enzona')
      .closest('div.relative')
      .find('span.rounded-full'),
    montoEnModal: () => cy.contains('p', 'Importe').next('p'),
    planEnModal: () => cy.contains('p', 'Plan').next('p'),

    botonVerificarEstado: () => cy.contains('button', 'Verificar estado'),
    botonReintentar: () => cy.contains('button', 'Reintentar pago'),
    botonCancelarPago: () => cy.contains('button', 'Cancelar pago'),
    botonCerrarModal: () => cy.contains('button', 'Cerrar'),
  };

  debeEstarCargada(): this {
    this.elementos.tituloPagina().should('be.visible');
    this.elementos.bloqueSuscripcion().should('be.visible');
    this.elementos.selectPlan().should('be.visible');
    return this;
  }

  /** El select tiene al menos un plan activo con precio (precondición del backend). */
  hayPlanesDisponibles(): Cypress.Chainable<boolean> {
    return this.elementos
      .selectPlan()
      .find('option')
      .then(($opciones) => $opciones.length > 1); // opción 0 = "Seleccionar..."
  }

  seleccionarPlanPorNombre(nombrePlan: string): this {
    this.elementos.selectPlan().select(nombrePlan);
    return this;
  }

  marcarFacturacionAnual(marcar: boolean): this {
    this.elementos.chkFacturacionAnual().should('exist');
    // cy.check()/uncheck() son idempotentes y toleran el estado actual
    if (marcar) this.elementos.chkFacturacionAnual().check();
    else this.elementos.chkFacturacionAnual().uncheck();
    return this;
  }

  pulsarComprar(): this {
    this.elementos.botonComprar().should('be.visible').and('not.be.disabled').click();
    return this;
  }

  /** El modal "Pago Enzona" está abierto. */
  modalPagoVisible(): this {
    this.elementos.tituloModal().should('be.visible');
    return this;
  }

  /** El QR está renderizado (imagen base64 o código textual). */
  qrVisible(): this {
    this.elementos.imagenQr().should('be.visible');
    return this;
  }

  /** El badge del modal muestra el estado indicado. */
  badgeMuestra(textoEstado: string): this {
    this.elementos.badgeEstado().should('be.visible').and('contain.text', textoEstado);
    return this;
  }

  /** El mensaje de error del pago (payment.errorMessage) se muestra en el modal. */
  errorDePagoVisible(texto: string): this {
    cy.contains('h2', 'Pago Enzona')
      .closest('div.relative')
      .find('.bg-red-50')
      .should('be.visible')
      .and('contain.text', texto);
    return this;
  }

  verificarEstado(): this {
    this.elementos.botonVerificarEstado().should('be.visible').click();
    return this;
  }

  reintentarPago(): this {
    this.elementos.botonReintentar().should('be.visible').click();
    return this;
  }

  cancelarPago(): this {
    this.elementos.botonCancelarPago().should('be.visible').click();
    return this;
  }

  cerrarModal(): this {
    this.elementos.botonCerrarModal().should('be.visible').click();
    return this;
  }

  /** Tras cancelar, el QR ya no debe existir (regresión del fix de "clear QR on cancel"). */
  qrRemovido(): this {
    this.elementos.imagenQr().should('not.exist');
    return this;
  }

  /** El modal se cerró y volvemos a la página de compra. */
  modalCerrado(): this {
    this.elementos.tituloModal().should('not.exist');
    return this;
  }
}

export const comprarPlanesPage = new ComprarPlanesPage();
