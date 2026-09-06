import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import './types'; // strong typing for i18n keys (autocompletion + compile-time validation)

import commonEs from '../../public/locales/es/common.json';
import navigationEs from '../../public/locales/es/navigation.json';
import authEs from '../../public/locales/es/auth.json';
import dashboardEs from '../../public/locales/es/dashboard.json';
import crudEs from '../../public/locales/es/crud.json';
import catalogsEs from '../../public/locales/es/catalogs.json';
import vehiculosEs from '../../public/locales/es/vehiculos.json';
import choferesEs from '../../public/locales/es/choferes.json';
import recorridosEs from '../../public/locales/es/recorridos.json';
import adminEs from '../../public/locales/es/admin.json';
import reportesEs from '../../public/locales/es/reportes.json';
import errorsEs from '../../public/locales/es/errors.json';

import commonEn from '../../public/locales/en/common.json';
import navigationEn from '../../public/locales/en/navigation.json';
import authEn from '../../public/locales/en/auth.json';
import dashboardEn from '../../public/locales/en/dashboard.json';
import crudEn from '../../public/locales/en/crud.json';
import catalogsEn from '../../public/locales/en/catalogs.json';
import vehiculosEn from '../../public/locales/en/vehiculos.json';
import choferesEn from '../../public/locales/en/choferes.json';
import recorridosEn from '../../public/locales/en/recorridos.json';
import adminEn from '../../public/locales/en/admin.json';
import reportesEn from '../../public/locales/en/reportes.json';
import errorsEn from '../../public/locales/en/errors.json';

export const NAMESPACES = [
  'common', 'navigation', 'auth', 'dashboard', 'crud',
  'catalogs', 'vehiculos', 'choferes', 'recorridos',
  'admin', 'reportes', 'errors',
] as const;

export type Namespace = (typeof NAMESPACES)[number];

export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

void i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources: {
      es: {
        common: commonEs,
        navigation: navigationEs,
        auth: authEs,
        dashboard: dashboardEs,
        crud: crudEs,
        catalogs: catalogsEs,
        vehiculos: vehiculosEs,
        choferes: choferesEs,
        recorridos: recorridosEs,
        admin: adminEs,
        reportes: reportesEs,
        errors: errorsEs,
      },
      en: {
        common: commonEn,
        navigation: navigationEn,
        auth: authEn,
        dashboard: dashboardEn,
        crud: crudEn,
        catalogs: catalogsEn,
        vehiculos: vehiculosEn,
        choferes: choferesEn,
        recorridos: recorridosEn,
        admin: adminEn,
        reportes: reportesEn,
        errors: errorsEn,
      },
    },
    fallbackLng: 'es',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    defaultNS: 'common',
    ns: NAMESPACES as unknown as string[],
    react: {
      useSuspense: false,
    },
  });

export default i18n;
