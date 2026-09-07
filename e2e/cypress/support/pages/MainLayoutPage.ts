import { BasePage } from './BasePage';

/**
 * Page Object del layout principal (TopNavbar + Sidebar):
 * menú de usuario, cierre de sesión y conmutador de idioma.
 */
export class MainLayoutPage extends BasePage {
  elementos = {
    topbar: () => cy.get('header'),
    /** Chip de empresa del TopNavbar (solo se muestra si el usuario tiene empresa). */
    chipEmpresa: () => cy.get('header .bg-primary-50 span'),
    /** Disparador del menú de usuario (contiene el email del usuario). */
    botonMenuUsuario: (correo: string) => cy.get('header').contains('button', correo),
    botonSalir: () => cy.contains('button', 'Salir'),
    /** Botón del conmutador de idioma (Globe + código de idioma en mayúsculas). */
    botonIdioma: () => cy.get('header button[title]').first(),
    opcionIdiomaIngles: () => cy.contains('button', '🇺🇸'),
    sidebar: () => cy.get('nav'),
    enlaceDashboard: () => cy.get('nav').contains('button', 'Dashboard'),
  };

  /** Abre el menú de usuario del TopNavbar. */
  abrirMenuUsuario(correo: string): this {
    this.elementos.botonMenuUsuario(correo).should('be.visible').click();
    return this;
  }

  /** Cierra la sesión desde el menú de usuario y espera la llamada real. */
  cerrarSesion(correo: string): this {
    this.abrirMenuUsuario(correo);
    this.elementos.botonSalir().should('be.visible').click();
    // La espera de red (@logout) se hace en el spec con cy.wait.
    return this;
  }

  /** Cambia el idioma de la app a inglés. */
  cambiarIdiomaAIngles(): this {
    this.elementos.botonIdioma().should('be.visible').click();
    this.elementos.opcionIdiomaIngles().should('be.visible').click();
    return this;
  }

  /** Navega al Dashboard desde el Sidebar. */
  irAlDashboard(): this {
    this.elementos.enlaceDashboard().should('be.visible').click();
    return this;
  }
}

export const mainLayoutPage = new MainLayoutPage();
