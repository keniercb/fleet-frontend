import 'i18next';
import type common from '../../public/locales/es/common.json';
import type navigation from '../../public/locales/es/navigation.json';
import type auth from '../../public/locales/es/auth.json';
import type dashboard from '../../public/locales/es/dashboard.json';
import type crud from '../../public/locales/es/crud.json';
import type catalogs from '../../public/locales/es/catalogs.json';
import type vehiculos from '../../public/locales/es/vehiculos.json';
import type choferes from '../../public/locales/es/choferes.json';
import type recorridos from '../../public/locales/es/recorridos.json';
import type admin from '../../public/locales/es/admin.json';
import type reportes from '../../public/locales/es/reportes.json';
import type errors from '../../public/locales/es/errors.json';

/**
 * Tipado fuerte de claves i18n para autocompletado en VSCode y validación
 * en tiempo de compilación. Si una clave no existe en el JSON, TypeScript
 * marcará error al usarla con `t('namespace:clave.subclave')`.
 *
 * Para que esto funcione en VSCode, asegúrate de que `resolveJsonModule: true`
 * esté habilitado en `tsconfig.app.json`.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      navigation: typeof navigation;
      auth: typeof auth;
      dashboard: typeof dashboard;
      crud: typeof crud;
      catalogs: typeof catalogs;
      vehiculos: typeof vehiculos;
      choferes: typeof choferes;
      recorridos: typeof recorridos;
      admin: typeof admin;
      reportes: typeof reportes;
      errors: typeof errors;
    };
  }
}
