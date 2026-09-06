// ***********************************************************
// Punto de entrada del soporte de Cypress.
// Se ejecuta antes de cada spec.
// ***********************************************************

import './commands';
// Etiquetas @smoke / @regression (runtime filtering)
import '@cypress/grep';

// ---------------------------------------------------------------
// Idioma determinista: el detector de i18next (localStorage →
// navigator → htmlTag) elige el idioma del navegador si no hay
// preferencia guardada; en los navegadores de Cypress eso es
// `en-US`, lo que haría la UI inglesa y rompería los selectores
// de texto. Forzamos `es` ANTES de que la app se inicialice.
// ---------------------------------------------------------------
Cypress.on('window:before:load', (win) => {
  try {
    win.localStorage.setItem('i18nextLng', 'es');
  } catch {
    // about:blank u orígenes opacos no permiten localStorage: ignorar.
  }
});

// ---------------------------------------------------------------
// Excepciones no capturadas: filtramos ruido conocido que no es
// defecto de la app; cualquier otro error SÍ hace fallar el test.
// ---------------------------------------------------------------
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('ResizeObserver loop')) {
    return false;
  }
  return true;
});

// Evidencias adicionales en modo interactivo
Cypress.Screenshot.defaults({
  capture: 'viewport',
  overwrite: true,
});
