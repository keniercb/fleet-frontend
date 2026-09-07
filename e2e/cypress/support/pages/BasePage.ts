/**
 * Page Object base: utilidades comunes a todas las páginas.
 * Cada POM expone LOCALIZADORES centralizados — si cambia el DOM de la app,
 * solo se corrige aquí, no en los specs.
 */
export class BasePage {
  /**
   * Panel del modal abierto localizado por su título (el componente <Modal/>
   * de la app renderiza el título en un <h2> dentro del panel).
   */
  panelDeModal(titulo: string) {
    return cy.contains('h2', titulo).closest('div.relative');
  }

  /** Página cargada: el <h1> del PageHeader es visible con el título dado. */
  tituloVisible(texto: string): this {
    cy.get('h1').should('be.visible').and('contain.text', texto);
    return this;
  }

  /** Aserción de toast (delegado en el comando personalizado). */
  toast(tipo: 'exito' | 'error' | 'advertencia' | 'info', texto: string): this {
    cy.toastVisible(tipo, texto);
    return this;
  }
}
