import { BasePage } from './BasePage';

/**
 * Page Object del formulario de Login (/login).
 * La app define id="email" e id="password" — localizadores estables.
 */
export class LoginPage extends BasePage {
  elementos = {
    titulo: () => cy.get('h1'),
    correo: () => cy.get('#email'),
    contrasena: () => cy.get('#password'),
    botonEntrar: () => cy.get('form button[type="submit"]'),
    bannerError: () => cy.get('div.bg-red-50'),
  };

  visitar(): this {
    cy.visit('/login');
    this.elementos.titulo().should('be.visible');
    return this;
  }

  escribirCorreo(valor: string): this {
    this.elementos.correo().clear().type(valor);
    return this;
  }

  escribirContrasena(valor: string): this {
    this.elementos.contrasena().clear().type(valor);
    return this;
  }

  enviar(): this {
    this.elementos.botonEntrar().click();
    return this;
  }

  iniciarSesion(correo: string, clave: string): this {
    return this.escribirCorreo(correo).escribirContrasena(clave).enviar();
  }

  /** El banner de error muestra el texto indicado. */
  debeMostrarError(texto: string): this {
    this.elementos.bannerError().should('be.visible').and('contain.text', texto);
    return this;
  }

  /** Botón en estado de carga: deshabilitado y con el texto "Ingresando...". */
  debeEstarCargando(): this {
    this.elementos
      .botonEntrar()
      .should('be.disabled')
      .and('contain.text', 'Ingresando...');
    return this;
  }
}

export const loginPage = new LoginPage();
