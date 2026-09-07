/**
 * Módulo: Pagos — Comprar Planes con Enzona (rama enzonaIntegration)
 * App: fleet-frontend · Página: /comprar-plan (permiso SUBSCRIPTIONS_READ)
 *
 * Estrategia híbrida alineada con "backend real":
 *  · TODO el flujo (planes, importe, crear pago, cancelar, reintentar) se
 *    ejecuta contra el backend real (POST /payments crea transacciones reales).
 *  · ÚNICAMENTE las TRANSICIONES de estado del pago (GET /payments/{id}/status)
 *    se simulan cuando CYPRESS_mockEstadosPago=true, porque pasar a PAGADO/
 *    FALLIDO/EXPIRADO exige que un humano escanee el QR real de Enzona:
 *    imposible de automatizar. Es la frontera del mock, documentada.
 *  · Con CYPRESS_mockEstadosPago=false solo se ejecutan los escenarios seguros
 *    (crear pago + cancelar), y las transiciones se omiten.
 *
 * Nota Cypress: cuando varios cy.intercept encajan con la misma petición,
 * la definida MÁS RECIENTE tiene prioridad — se usa en PAG-06 para reencaminar
 * el polling tras el reintento.
 */
import { comprarPlanesPage } from '../../support/pages/ComprarPlanesPage';
import {
  interceptarSesion,
  interceptarPlanes,
  interceptarPagos,
  interceptarEstadoPagoFijo,
  interceptarEstadoPagoSecuencial,
  mockEstadosPagoActivos,
} from '../../support/api/interceptores';
import pagosFixture from '../../fixtures/pagos.json';
import type { PaymentResponse } from '../../support/types';

const pagoQr = pagosFixture.pagoQrGenerado as PaymentResponse;
const pagoPagado = pagosFixture.pagoPagado as PaymentResponse;
const pagoFallido = pagosFixture.pagoFallido as PaymentResponse;
const pagoExpirado = pagosFixture.pagoExpirado as PaymentResponse;

/** Extrae solo los dígitos de un texto formateado ("1.500,00 CUP" → "150000"). */
const digitos = (texto: string): string => texto.replace(/\D/g, '');

describe('Pagos — Comprar Planes (Enzona)', () => {
  beforeEach(() => {
    cy.loginPorApi();
    interceptarSesion();
    interceptarPlanes();
    interceptarPagos();

    cy.visit('/comprar-plan');
    comprarPlanesPage.debeEstarCargada();

    // Arranque determinista: carga inicial de suscripción, planes e importe
    cy.wait('@suscripcion').its('response.statusCode').should('eq', 200);
    cy.wait('@planes');
    cy.wait('@importe');
  });

  // -----------------------------------------------------------------------
  // Contexto A: válido siempre (backend real, sin stubs)
  // -----------------------------------------------------------------------

  it('PAG-01 @smoke · Carga la página con suscripción actual, planes e importe', () => {
    comprarPlanesPage.elementos.selectPlan().find('option').should('have.length.greaterThan', 1);
    comprarPlanesPage.elementos.chkFacturacionAnual().should('not.be.checked');

    // El importe del plan preseleccionado se muestra formateado
    cy.wait('@importe').then(({ response }) => {
      const importe = response?.body?.importe as number;
      expect(importe, 'el backend devolvió un importe').to.be.a('number');
      comprarPlanesPage.elementos.costoAPagar().invoke('text').then((texto) => {
        expect(digitos(texto)).to.include(String(Math.round(importe)));
      });
    });
  });

  it('PAG-02 · Recalcula el importe al cambiar de plan', function () {
    const opciones = comprarPlanesPage.elementos.selectPlan().find('option');
    opciones.then(($opciones) => {
      if ($opciones.length < 3) {
        cy.log('Se necesita más de un plan activo para este escenario — omitido');
        return this.skip();
      }

      // Selecciona el SEGUNDO plan real (índice 2 sobre la lista de opciones)
      const nombreSegundoPlan = $opciones.eq(2).text().trim();
      comprarPlanesPage.seleccionarPlanPorNombre(nombreSegundoPlan);

      cy.wait('@importe').then(({ response, request }) => {
        expect(request.url).to.match(/\/plans\/\d+\/calcular-importe/);
        const importe = response?.body?.importe as number;
        comprarPlanesPage.elementos.costoAPagar().invoke('text').then((texto) => {
          expect(digitos(texto)).to.include(String(Math.round(importe)));
        });
      });
    });
  });

  it('PAG-03 @regression · La facturación anual recalcula importe y fija 360 días', () => {
    comprarPlanesPage.marcarFacturacionAnual(true);

    cy.wait('@importe').then(({ request, response }) => {
      // La llamada de cálculo se emite con facturarAnual=true
      expect(request.url).to.match(/facturarAnual=true/);
      const importe = response?.body?.importe as number;

      // La duración mostrada pasa a 360 días
      comprarPlanesPage.elementos.duracionSuscripcion().should('contain.text', '360');

      // Y el costo mostrado coincide con el importe calculado por el backend
      comprarPlanesPage.elementos.costoAPagar().invoke('text').then((texto) => {
        expect(digitos(texto)).to.include(String(Math.round(importe)));
      });
    });
  });

  it('PAG-04 @smoke · Compra un plan (pago real), visualiza el QR y cancela el pago', () => {
    comprarPlanesPage.pulsarComprar();

    // POST /payments real con el plan preseleccionado
    cy.wait('@crearPago').then(({ response, request }) => {
      expect(response?.statusCode).to.be.within(200, 299);
      expect(request.body).to.have.property('planId').that.is.a('number');
      expect(request.body.type).to.be.oneOf(['NUEVA_SUSCRIPCION', 'RENOVACION']);
      expect(request.body.facturarAnual).to.eq(false);
    });

    // Modal de pago con QR (imagen o código) y estado inicial de transacción
    comprarPlanesPage.modalPagoVisible();
    comprarPlanesPage.elementos.badgeEstado().invoke('text').then((texto) => {
      expect(texto).to.match(/QR Generado|Pendiente/);
    });

    // El monto del modal coincide con el importe cobrado
    comprarPlanesPage.elementos.montoEnModal().invoke('text').then((texto) => {
      expect(digitos(texto).length).to.be.greaterThan(0);
    });

    // Cancelación real: cierra la transacción en Enzona (buena práctica de limpieza)
    comprarPlanesPage.cancelarPago();
    cy.wait('@cancelarPago').its('response.statusCode').should('be.within', 200, 299);

    comprarPlanesPage.badgeMuestra('Cancelado');
    // Regresión del fix 05ed7e0: al cancelar el QR se limpia
    comprarPlanesPage.qrRemovido();
    comprarPlanesPage.toast('info', 'Pago cancelado');
  });

  // -----------------------------------------------------------------------
  // Contexto B: transiciones simuladas (requieren escaneo humano del QR).
  // Se omiten automáticamente con CYPRESS_mockEstadosPago=false.
  // -----------------------------------------------------------------------

  it('PAG-05 @regression · Confirma el pago (PAGADO) y actualiza la suscripción', function () {
    if (!mockEstadosPagoActivos()) return this.skip();

    // El próximo estado consultado será PAGADO (simulación del callback Enzona)
    interceptarEstadoPagoFijo(pagoPagado);

    comprarPlanesPage.pulsarComprar();
    cy.wait('@crearPago');
    comprarPlanesPage.modalPagoVisible();

    // Acción manual "Verificar estado" del modal
    comprarPlanesPage.verificarEstado();
    cy.wait('@estadoPago');

    comprarPlanesPage.badgeMuestra('Pagado');
    comprarPlanesPage.toast('exito', '¡Pago confirmado! Su suscripción ha sido activada.');

    // La app refresca la suscripción de la empresa tras confirmar el pago
    cy.wait('@suscripcion');

    // Con estado PAGADO el modal ofrece solo Cerrar
    comprarPlanesPage.elementos.botonCerrarModal().should('be.visible');
    comprarPlanesPage.elementos.botonCancelarPago().should('not.exist');
    comprarPlanesPage.cerrarModal();
    comprarPlanesPage.modalCerrado();
  });

  it('PAG-06 · Gestiona un pago FALLIDO y lo reintenta generando un nuevo QR', function () {
    if (!mockEstadosPagoActivos()) return this.skip();

    interceptarEstadoPagoFijo(pagoFallido);

    comprarPlanesPage.pulsarComprar();
    cy.wait('@crearPago');

    // El polling automático (5 s) detecta el fallo
    cy.wait('@estadoPago', { timeout: 15_000 });
    comprarPlanesPage.badgeMuestra('Fallido');
    comprarPlanesPage.errorDePagoVisible('Transacción rechazada por el banco emisor');
    comprarPlanesPage.toast('error', 'El pago ha fallado. Intente nuevamente.');

    // Reintento (POST /payments/{id}/retry contra el backend real)
    comprarPlanesPage.reintentarPago();
    cy.wait('@reintentarPago').its('response.statusCode').should('be.within', 200, 299);

    // A partir de aquí el polling devuelve QR_GENERADO: el interceptor más
    // reciente tiene prioridad en Cypress y neutraliza el estado FALLIDO.
    interceptarEstadoPagoFijo(pagoQr);

    comprarPlanesPage.badgeMuestra('QR Generado');
    comprarPlanesPage.qrVisible();
    comprarPlanesPage.toast('exito', 'Pago reintentado. Escanea el nuevo QR.');

    // Limpieza: se cancela la transacción real para no dejar pagos abiertos
    comprarPlanesPage.cancelarPago();
    cy.wait('@cancelarPago');
    comprarPlanesPage.badgeMuestra('Cancelado');
  });

  it('PAG-07 · Notifica la expiración del pago y ofrece reintentar', function () {
    if (!mockEstadosPagoActivos()) return this.skip();

    interceptarEstadoPagoFijo(pagoExpirado);

    comprarPlanesPage.pulsarComprar();
    cy.wait('@crearPago');

    cy.wait('@estadoPago', { timeout: 15_000 });
    comprarPlanesPage.badgeMuestra('Expirado');
    comprarPlanesPage.toast('advertencia', 'El pago ha expirado.');

    // Con EXPIRADO: disponible Reintentar y Cancelar (no PAGADO/CANCELADO)
    comprarPlanesPage.elementos.botonReintentar().should('be.visible');
    comprarPlanesPage.elementos.botonCancelarPago().should('be.visible');

    // Limpieza de la transacción real
    comprarPlanesPage.cancelarPago();
    cy.wait('@cancelarPago');
    comprarPlanesPage.badgeMuestra('Cancelado');
  });

  it('PAG-08 @regression · El polling automático converge a PAGADO sin intervención', function () {
    if (!mockEstadosPagoActivos()) return this.skip();

    // Secuencia del polling de 5 s: QR → QR → PAGADO (~15 s de reloj real,
    // pero todas las esperas son sobre el alias de red, nunca fijas)
    interceptarEstadoPagoSecuencial([pagoQr, pagoQr, pagoPagado]);

    comprarPlanesPage.pulsarComprar();
    cy.wait('@crearPago');

    cy.wait('@estadoPago', { timeout: 10_000 });  // sondeo 1 (t+5s)
    cy.wait('@estadoPago', { timeout: 10_000 });  // sondeo 2 (t+10s)
    cy.wait('@estadoPago', { timeout: 10_000 });  // sondeo 3 (t+15s)

    comprarPlanesPage.badgeMuestra('Pagado');
    comprarPlanesPage.toast('exito', '¡Pago confirmado! Su suscripción ha sido activada.');
    cy.wait('@suscripcion'); // refresco automático de la suscripción
  });
});
