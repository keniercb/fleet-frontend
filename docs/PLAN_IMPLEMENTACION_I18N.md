# Plan de Implementacion i18n — Fleet Management Frontend

> **Proyecto:** fleet-frontend
> **Branch:** `developSuscription`
> **Version del plan:** 1.0.0
> **Fecha:** 2026-09-05
> **Autor:** Analista Senior React/TypeScript
> **Estado:** Listo para ejecucion

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Estado Actual del Proyecto](#2-estado-actual-del-proyecto)
3. [Objetivos y Alcance](#3-objetivos-y-alcance)
4. [Decisiones Tecnicas](#4-decisiones-tecnicas)
5. [Arquitectura i18n Propuesta](#5-arquitectura-i18n-propuesta)
6. [Estrategia de Namespaces](#6-estrategia-de-namespaces)
7. [Helpers Centralizados](#7-helpers-centralizados)
8. [Convenciones de Claves](#8-convenciones-de-claves)
9. [Casos Especiales](#9-casos-especiales)
10. [Plan de Migracion por Fases](#10-plan-de-migracion-por-fases)
11. [Instalacion y Configuracion Inicial](#11-instalacion-y-configuracion-inicial)
12. [Testing y Validacion](#12-testing-y-validacion)
13. [Estimacion de Esfuerzo](#13-estimacion-de-esfuerzo)
14. [Riesgos y Mitigaciones](#14-riesgos-y-mitigaciones)
15. [Criterios de Aceptacion](#15-criterios-de-aceptacion)
16. [Checklist de Entrega](#16-checklist-de-entrega)

---

## 1. Resumen Ejecutivo

El frontend de Fleet Management (React 19 + Vite 8 + TypeScript 5.7) actualmente **no cuenta con internacionalizacion**. Todos los textos visibles al usuario estan hardcodeados en espanol en aproximadamente **30 archivos `.tsx`** con un volumen estimado de **1.000 a 1.100 strings UI** distribuidos en 25 paginas, 15 componentes compartidos, 1 hook (`useCrud`) y 1 archivo de configuracion de navegacion (`utils/navigation.ts`).

El presente plan propone implementar **react-i18next** (la solucion estandar de facto para React) sobre la arquitectura ya centralizada del proyecto, aprovechando el componente generico `CrudPage<TReq, TRes>` y el objeto `navigationConfig` como puntos de maximo leverage: migrar estos dos archivos beneficia inmediatamente a mas de 10 paginas y a la totalidad del menu lateral.

La estrategia adoptada es **incremental por fases**: primero se instalan las dependencias y se monta la infraestructura (`i18n/config.ts`, helpers de formato, helpers de status), despues se migran los archivos de maximo leverage (CrudPage, navigation, layout), y finalmente se migran las paginas en orden de complejidad ascendente (catalogos config-only -> paginas custom -> reportes). El plan estima **6 fases en aproximadamente 8-10 dias ingeniero** y entrega criterios de aceptacion verificables.

Como parte del analisis tambien se detectaron **inconsistencias ortograficas** en el espanol actual del codigo (uso inconsistente de tildes: `Gestion` vs `Gestión`, `Direccion` vs `Dirección`, `Vehiculo` vs `Vehículo`) y **duplicacion de mapas de estado** (`statusLabels` de SubscriptionStatus repetido en 3 archivos con discrepancias — `SubscriptionsPage` muestra `'Trial'` mientras `ProfileModal` y `ComprarPlanesPage` muestran `'Prueba'`). Estas inconsistencias se normalizaran durante la migracion.

---

## 2. Estado Actual del Proyecto

### 2.1 Stack tecnologico (verificado en `package.json`)

| Dependencia | Version | Rol |
|---|---|---|
| react | ^19.2.8 | Framework UI |
| react-dom | ^19.2.8 | Renderer |
| react-router-dom | ^6.28.0 | Enrutado SPA |
| axios | ^1.19.0 | HTTP client |
| tailwindcss + @tailwindcss/vite | ^4.3.3 | Estilos |
| lucide-react | ^1.31.0 | Iconos |
| vite | ^8.2.0 | Bundler |
| typescript | ~5.7.0 | Tipado |

> **i18next / react-i18next NO estan instalados.** Se trata de una implementacion greenfield.

### 2.2 Estructura de carpetas (relevante para i18n)

```
frontend/src/
├── App.tsx                         (260 lineas) - rutas + providers
├── main.tsx                        (13 lineas)  - entry point
├── api/
│   ├── client.ts                                 - instancia axios
│   └── endpoints.ts                              - 24 objetos API
├── components/
│   ├── common/
│   │   ├── CrudPage.tsx            (382 lineas) - CRUD generico
│   │   ├── PageHeader.tsx
│   │   ├── Pagination.tsx
│   │   ├── ComingSoon.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── SuperAdminRoute.tsx
│   ├── layout/
│   │   ├── MainLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── TopNavbar.tsx
│   └── ui/
│       ├── Modal.tsx
│       ├── ConfirmModal.tsx
│       ├── ToastContainer.tsx
│       ├── ProfileModal.tsx        (~30 strings)
│       ├── ChangePasswordModal.tsx (~15 strings)
│       └── SearchableDropdown.tsx  (~3 strings)
├── contexts/
│   ├── AuthContext.tsx
│   └── ToastContext.tsx
├── hooks/
│   └── useCrud.ts                  (4 mensajes fallback)
├── pages/                          (25 archivos)
│   ├── auth/        (1)
│   ├── dashboard/   (1)
│   ├── catalogs/    (11)
│   ├── admin/       (5)
│   ├── vehiculos/   (1)
│   ├── choferes/    (1)
│   ├── recorridos/  (1)
│   └── reportes/    (4)
├── types/index.ts                  (~400+ lineas, 65 interfaces)
└── utils/navigation.ts            (~30 strings de menu)
```

### 2.3 Inventario de textos a migrar

| Categoria | Archivos | Strings aprox. | Observacion |
|---|---:|---:|---|
| `CrudPage.tsx` (nucleo) | 1 | ~22 | Afecta a 10+ paginas |
| Paginas "config-only" | 10 | ~140 | Solo cambian `title/singular/description/placeholder/label` |
| Paginas custom | 15 | ~825 | Tablas, modales, toasts, filtros, badges |
| `utils/navigation.ts` | 1 | ~30 | Menu lateral completo |
| `components/ui/*` | 3 | ~48 | Modales y dropdown |
| `components/layout/*` | 2 | ~10 | Sidebar + TopNavbar |
| `components/common/*` (resto) | 4 | ~6 | Rutas + paginacion + coming soon |
| `hooks/useCrud.ts` | 1 | ~4 | Fallbacks de error |
| **TOTAL** | **~30** | **~1.000–1.100** | |

### 2.4 Hallazgos relevantes para i18n

1. **Patron arquitecturico centralizado**: el 100% de las paginas CRUD delegan en `CrudPage<TReq, TRes>`. Migrar este componente una sola vez propaga el cambio a todas las paginas que lo usan.
2. **Helpers de formato duplicados y con locales inconsistentes**: se detectaron **4 funciones `formatDate` distintas** (locales `es-ES`, `es-CU`, `undefined`), **3 funciones `formatCurrency`** (una fija a CUP, otra sin locale, otra sin `style: 'currency'`), y **4 funciones `formatNumber`** dispersas.
3. **Arrays `MESES` duplicados**: `DashboardPage.tsx` y `VehiculosPage.tsx` definen cada uno su propio array de nombres de meses en espanol.
4. **Mapas `statusLabels` duplicados para `SubscriptionStatus`**: 3 archivos (`ProfileModal`, `SubscriptionsPage`, `ComprarPlanesPage`) definen su propio mapa `TRIAL/ACTIVE/PAST_DUE/CANCELED/EXPIRED` -> label espanol, con **discrepancia** (`SubscriptionsPage` muestra `'Trial'`, los otros dos `'Prueba'`).
5. **Estados de mantenimiento no tipados**: `ReporteMantenimientoPage` usa un mapa de badges para `VENCIDO/PROXIMO/VIGENTE` pero estos valores son `string` en `types/index.ts` (no tipados).
6. **Mensajes del backend en espanol**: `useCrud.ts` y `LoginPage.tsx` consumen `error.response.data.message` y lo muestran al usuario. Si el backend no retorna codigos de error estables, los mensajes del backend no son traducibles en el front.
7. **Pluralizacion manual**: 4 lugares usan el patron `{n} item{es}` (`ReporteMantenimiento`, `ReporteAbastecimiento`, `RolesPage`, `UsuariosPage`). Suficiente para es/en pero no para idiomas con mas de 2 formas plurales.
8. **Inconsistencia ortografica**: mezcla de tildes (`Direccion`/`Dirección`, `Gestion`/`Gestión`, `Vehiculo`/`Vehículo`). Se normalizara al migrar.
9. **Permisos y roles como strings tecnicos**: `RolesPage` y `PermisosPage` muestran `role.name` (`ADMIN`, `SUPER_ADMIN`) y `perm.name` (`USUARIOS_CREATE`) directamente. Son identificadores tecnicos que probablemente NO deben traducirse — se mantiene la politica de mostrarlos crudos.
10. **Convencion de variacion contra-intuitiva**: en los reportes y dashboard, **variacion positiva = malo = rojo** (porque representa mayor consumo/costo), y **negativa = bueno = verde**. Es convencion opuesta a finanzas. Los textos acompanantes (`'vs mes anterior'`) si se traducen; los signos `+`/`-`/`%` son universales.

### 2.5 Punto de inyeccion del provider

```tsx
// main.tsx (actual)
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// App.tsx (jerarquia actual)
<BrowserRouter>
  <ToastProvider>
    <AuthProvider>
      <Routes>...</Routes>
      <ToastContainer />
    </AuthProvider>
  </ToastProvider>
</BrowserRouter>
```

**Conclusion**: `react-i18next` no requiere un `<I18nextProvider>` explicito si se inicializa con `initReactI18next`. Basta con importar `src/i18n/index.ts` como side-effect en `main.tsx` antes del render.

---

## 3. Objetivos y Alcance

### 3.1 Objetivos generales

1. **Internacionalizar el 100% de los textos visibles al usuario** en las paginas, componentes, modales, toasts, placeholders, encabezados de tabla, mensajes de estado, etc.
2. **Soportar dos idiomas en la version inicial**: Espanol (`es` - por defecto) e Ingles (`en`). La arquitectura debe permitir agregar nuevos idiomas con costo minimo.
3. **Persistir el idioma seleccionado** en `localStorage` (clave sugerida: `i18nextLng`) y respetar el idioma del navegador en primera visita.
4. **Centralizar el formateo de fechas, numeros y moneda** en un helper unico sensible al locale activo.
5. **Eliminar la duplicacion** de mapas de status labels y arrays `MESES` identificados en el analisis.
6. **Mantener la ortografia canonica espanola** consistente (es-ES con tildes) al migrar las claves.
7. **No romper funcionalidad existente**: ningun RF-01..RF-14 debe regresar como resultado de la migracion.

### 3.2 Alcance (IN)

- Instalacion y configuracion de `react-i18next` + dependencias auxiliares.
- Creacion de estructura de carpetas `src/i18n/` y archivos de traduccion `public/locales/{es,en}/`.
- Migracion de los ~30 archivos con strings hardcoded.
- Centralizacion de helpers de formato (`formatDate`, `formatNumber`, `formatCurrency`) y de mapas de status.
- Refactor de arrays `MESES` a `Intl.DateTimeFormat`.
- Integracion de pluralizacion i18next en los 4 lugares detectados.
- Selector de idioma en el `TopNavbar` (con persistencia).
- Documentacion del proceso de adicion de nuevas claves y nuevos idiomas (seccion "Guia de extension" en `README.md` del frontend).

### 3.3 Fuera de alcance (OUT)

- Traduccion del backend Spring Boot (los mensajes `error.response.data.message` siguen viniendo en espanol del backend).
- Soporte de idiomas con direccion RTL (arabe, hebreo) — fuera del alcance inicial.
- traduccion dinamica del contenido que proviene de la API (nombres de empresas, descripciones de planes, etc.) — son datos del usuario y se muestran como vienen.
- Refactor arquitectonico mayor (migracion a React Query, code splitting, etc.) — se documenta como tarea separada.

### 3.4 Criterios de no regresion

- Todos los RF-01..RF-14 siguen funcionando identicamente.
- El rendimiento del bundle inicial no se degrada mas de 30 KB gzipados (peso combinado de `i18next` + `react-i18next` + `i18next-browser-languagedetector`).
- El LCP del dashboard no se degrada mas de 100 ms (verificado con Lighthouse).

---

## 4. Decisiones Tecnicas

### AD-i18n-01: `react-i18next` sobre alternativas

**Decision:** adoptar `react-i18next` (`i18next` core + `react-i18next` binding).

**Rationale:**
- Estandar de facto en el ecosistema React (>5M descargas/semana).
- Soporta namespaces, interpolacion, pluralizacion, formato, lazy loading, deteccion de idioma, fallback.
- API con hook `useTranslation()` compatible con React 19 y functional components.
- Active maintenance, documentacion extensa, ejemplos en produccion.

**Alternativas descartadas:**
- `react-intl` (FormatJS): mas pesado, API mas verbosa, mejor para apps con ICU MessageFormat complejo (no es el caso).
- `lingui`: requiere compilacion macro/babel, curva de aprendizaje mayor.
- `next-intl`: vinculado al ecosistema Next.js (no aplica — este es Vite SPA).

### AD-i18n-02: Carga sincrona (bundle) sobre lazy loading por namespace

**Decision:** los archivos JSON de traduccion se importan como modulos ES en el bundle inicial, no se cargan via HTTP backend.

**Rationale:**
- La app tiene ~1.000 strings; los JSON pesaran ~30-40 KB por idioma (~10 KB gzipados).
- Evitar peticiones HTTP adicionales que retrasen el primer render con texto (FOUC — "flash of untranslated content").
- Simplifica la configuracion (no se necesita `i18next-http-backend`).
- Si en el futuro el volumen de strings crece >5.000, se puede migrar a lazy loading por namespace sin tocar el codigo de las paginas.

### AD-i18n-03: Deteccion de idioma con persistencia

**Decision:** usar `i18next-browser-languagedetector` con orden: `localStorage -> navigator -> htmlTag -> fallback`.

**Rationale:**
- Respeta la eleccion del usuario (localStorage con clave `i18nextLng`).
- En primera visita usa el idioma del navegador.
- Como fallback usa el `lang` del `<html>` y, finalmente, `es`.

### AD-i18n-04: Estrategia de namespaces por modulo

**Decision:** dividir las traducciones en namespaces funcionales y no uno gigante.

**Rationale:**
- Mejor organizacion del codigo (~1.000 strings en un solo archivo seria inmanejable).
- Permite rastrear autoría y ownership por modulo.
- Permite lazy loading futuro si se requiere.

**Namespaces adoptados** (ver seccion 6 para detalle):
- `common` — textos transversales (botones, estados, validaciones genericas).
- `navigation` — menu lateral y breadcrumbs.
- `auth` — login, cambio de contrasena, perfil.
- `dashboard` — dashboard ejecutivo.
- `crud` — strings del componente `CrudPage` (compartidos por 10+ paginas).
- `catalogs` — catalogos genericos (Provincia, Municipio, Marca, etc.).
- `vehiculos` — gestion de vehiculos.
- `choferes` — gestion de choferes.
- `recorridos` — registro de recorridos.
- `admin` — usuarios, roles, permisos, planes, features, suscripciones, comprar planes.
- `reportes` — 4 reportes operacionales.
- `errors` — mensajes de error del front (fallbacks de `useCrud` y de `LoginPage`).

### AD-i18n-05: Locale principal espanol = `es` (no `es-ES` ni `es-CU`)

**Decision:** usar el codigo ISO 639-1 `es` (sin region) como locale principal.

**Rationale:**
- Simplifica la deteccion: el navegador envia `es`, `es-ES`, `es-MX`, `es-AR`, etc. i18next con `load: 'languageOnly'` los normaliza a `es`.
- La ortografia canonica es-ES (con tildes) es universalmente comprensible en hispanoamerica.
- Si en el futuro se requiere diferenciar variantes regionales (e.g., `es-CU` para Cuba), se agrega como sub-locale sin tocar el resto.

### AD-i18n-06: Formato de numeros/fechas via `Intl` con locale activo

**Decision:** centralizar todo el formateo en `src/utils/format.ts` que lee `i18next.language` y usa `Intl.NumberFormat` / `Intl.DateTimeFormat`.

**Rationale:**
- Elimina las 11 funciones duplicadas detectadas (4 formatDate, 3 formatCurrency, 4 formatNumber).
- Garantiza que al cambiar de idioma, los numeros/fechas se reformatean consistentemente.
- `Intl` es nativo del navegador (sin dependencias adicionales).

### AD-i18n-07: Politica de mensajes del backend

**Decision:** los mensajes del backend (`error.response.data.message`) **no se traducen** en el front; se muestran crudos como vienen. Solo se traducen los fallbacks del front (`'Error al cargar los datos'`, etc.).

**Rationale:**
- Sin un campo `errorCode` estable en la API, mapear mensajes del backend a claves i18n es frágil (cualquier cambio de texto en el backend rompe la traduccion).
- El 80% de los mensajes de error visibles al usuario son fallbacks del front, no del backend.
- Como trabajo futuro (fuera de este plan) se propondra al equipo backend agregar `errorCode` en las respuestas de error; cuando eso ocurra, el front podra traducir los errores del backend via un mapa `errorCode -> i18n key`.

### AD-i18n-08: Permisos y nombres de roles no se traducen

**Decision:** los strings `ADMIN`, `SUPER_ADMIN`, `USUARIOS_CREATE`, etc. se muestran crudos en `RolesPage` y `PermisosPage`.

**Rationale:** son identificadores tecnicos usados para coincidir con permisos en el backend. Traducirlos romperia el contrato RBAC.

### AD-i18n-09: Sin `I18nextProvider` explicito

**Decision:** inicializar i18next con `initReactI18next` y dejar que su contexto se propague globalmente. No agregar `<I18nextProvider>` al arbol de React.

**Rationale:** react-i18next expone el contexto por defecto una vez inicializado. Agregar un provider extra es redundante y ensucia `App.tsx`.

---

## 5. Arquitectura i18n Propuesta

### 5.1 Estructura de carpetas

```
frontend/
├── public/
│   └── locales/
│       ├── es/
│       │   ├── common.json
│       │   ├── navigation.json
│       │   ├── auth.json
│       │   ├── dashboard.json
│       │   ├── crud.json
│       │   ├── catalogs.json
│       │   ├── vehiculos.json
│       │   ├── choferes.json
│       │   ├── recorridos.json
│       │   ├── admin.json
│       │   ├── reportes.json
│       │   └── errors.json
│       └── en/
│           ├── common.json
│           ├── navigation.json
│           ├── auth.json
│           ├── dashboard.json
│           ├── crud.json
│           ├── catalogs.json
│           ├── vehiculos.json
│           ├── choferes.json
│           ├── recorridos.json
│           ├── admin.json
│           ├── reportes.json
│           └── errors.json
├── src/
│   ├── i18n/
│   │   ├── index.ts            # inicializacion de i18next
│   │   ├── config.ts           # configuracion (supportedLngs, fallback, detection)
│   │   ├── resources.ts        # importacion de todos los JSON como modulos
│   │   └── types.ts           # tipos TypeScript para claves (opcional, ver 5.4)
│   ├── utils/
│   │   ├── navigation.ts       # (existente — se migra a usar t())
│   │   ├── format.ts           # NUEVO — formatDate/formatNumber/formatCurrency
│   │   └── statusLabels.ts    # NUEVO — getSubscriptionStatusInfo, getMantenimientoStatusInfo
│   └── ...
```

### 5.2 Diagrama de flujo

```
1. main.tsx  →  import './i18n'  (side-effect: inicializa i18next)
2. i18next.use(initReactI18next)
            .use(LanguageDetector)
            .init({ resources, fallbackLng, supportedLngs, detection })
3. <App /> se renderiza con i18next listo
4. Cualquier componente llama a:
   const { t, i18n } = useTranslation(['crud', 'common']);
   t('crud:actions.new')
   i18n.language  // 'es' | 'en'
5. utils/format.ts y utils/statusLabels.ts leen i18n.language y exponen helpers
6. TopNavbar expone un <LanguageSwitcher /> que llama a i18n.changeLanguage('en')
7. i18next-browser-languagedetector persiste la eleccion en localStorage
```

### 5.3 Inicializacion (`src/i18n/index.ts`)

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resources from './resources';

void i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    nonExplicitSupportedLngs: true, // acepta es-ES, es-CU, es-MX -> es
    load: 'languageOnly',
    interpolation: {
      escapeValue: false, // React ya escapa por defecto
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    defaultNS: 'common',
    ns: [
      'common', 'navigation', 'auth', 'dashboard', 'crud',
      'catalogs', 'vehiculos', 'choferes', 'recorridos',
      'admin', 'reportes', 'errors',
    ],
  });

export default i18n;
```

### 5.4 Tipado opcional de claves (bonus)

Para prevenir claves inexistentes en compilacion, se puede agregar un modulo de tipos:

```typescript
// src/i18n/types.ts
import 'i18next';
import type common from '../../public/locales/es/common.json';
import type navigation from '../../public/locales/es/navigation.json';
// ... resto de namespaces

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      navigation: typeof navigation;
      // ...
    };
  }
}
```

Esto habilita autocompletado y validacion de claves en VSCode. Recomendado pero opcional — puede agregarse en una fase posterior.

---

## 6. Estrategia de Namespaces

### 6.1 Mapa de namespaces y contenidos

| Namespace | Cubre | Strings aprox. |
|---|---|---:|
| `common` | Botones (`Cancelar`, `Guardar`, `Eliminar`, `Editar`, `Nuevo`, `Buscar`, `Limpiar`), estados (`Activo`, `Inactivo`), mensajes vacios (`No hay registros`, `Cargando...`, `No se encontraron resultados`), unidades (`km`, `L`, `días`, `%`), validaciones genericas | ~80 |
| `navigation` | Secciones y items del menu lateral (`Administración`, `Catálogos`, `Reportes`, `Control de Transporte`, y los 23 items) | ~30 |
| `auth` | LoginPage, ChangePasswordModal, ProfileModal | ~50 |
| `dashboard` | KPIs, meses, variacion, tooltip de variacion | ~40 |
| `crud` | Botones y modales de `CrudPage.tsx` (`Buscar...`, `Nuevo`, `Estado`, `Acciones`, `Activo`, `Inactivo`, `Editar`, `Eliminar`, `Cancelar`, `Crear`, `Actualizar`, `Guardando...`, `Seleccionar...`, `¿Está seguro que desea eliminar este registro?...`, toasts de exito) | ~22 |
| `catalogs` | Configs de las 11 paginas CRUD (`title`, `singular`, `description`, `placeholder`, `label`) | ~140 |
| `vehiculos` | VehiculosPage (110 strings) | ~110 |
| `choferes` | ChoferesPage | ~60 |
| `recorridos` | RecorridosPage | ~70 |
| `admin` | UsuariosPage, RolesPage, PermisosPage, SubscriptionsPage, ComprarPlanesPage, PlanPage, FeaturePage | ~280 |
| `reportes` | 4 reportes operacionales + Dashboard badges | ~205 |
| `errors` | Fallbacks de `useCrud.ts`, `LoginPage.tsx`, errores genericos | ~10 |
| **TOTAL** | | **~1.097** |

### 6.2 Ejemplo de estructura JSON

#### `public/locales/es/common.json`

```json
{
  "actions": {
    "new": "Nuevo",
    "edit": "Editar",
    "delete": "Eliminar",
    "cancel": "Cancelar",
    "create": "Crear",
    "update": "Actualizar",
    "save": "Guardar",
    "saving": "Guardando...",
    "search": "Buscar",
    "clear": "Limpiar",
    "back": "Volver",
    "select": "Seleccionar..."
  },
  "state": {
    "active": "Activo",
    "inactive": "Inactivo",
    "loading": "Cargando...",
    "empty": "No hay registros",
    "noResults": "No se encontraron resultados",
    "deniedTitle": "Acceso Denegado",
    "deniedMessage": "No tiene permisos para acceder a esta sección."
  },
  "units": {
    "km": "km",
    "liters": "L",
    "litersPer100km": "L/100km",
    "days": "días",
    "percent": "%"
  },
  "pagination": {
    "showing": "Mostrando {{start}} a {{end}} de {{total}} resultados"
  },
  "months": {
    "january": "Enero",
    "february": "Febrero",
    "march": "Marzo",
    "april": "Abril",
    "may": "Mayo",
    "june": "Junio",
    "july": "Julio",
    "august": "Agosto",
    "september": "Septiembre",
    "october": "Octubre",
    "november": "Noviembre",
    "december": "Diciembre"
  }
}
```

#### `public/locales/es/crud.json`

```json
{
  "table": {
    "state": "Estado",
    "actions": "Acciones"
  },
  "modal": {
    "create": "Nuevo {{singular}}",
    "edit": "Editar {{singular}}",
    "delete": "Eliminar {{singular}}",
    "deleteConfirm": "¿Está seguro que desea eliminar este registro? Esta acción no se puede deshacer."
  },
  "toast": {
    "created": "El nuevo registro se ha creado correctamente.",
    "updated": "El registro se ha actualizado correctamente.",
    "deleted": "El registro se ha eliminado correctamente.",
    "createdNamed": "{{singular}} creado",
    "updatedNamed": "{{singular}} actualizado",
    "deletedNamed": "{{singular}} eliminado"
  }
}
```

#### `public/locales/es/admin.json` (extracto)

```json
{
  "subscription": {
    "status": {
      "TRIAL": "Prueba",
      "ACTIVE": "Activa",
      "PAST_DUE": "Vencida",
      "CANCELED": "Cancelada",
      "EXPIRED": "Expirada"
    },
    "title": "Suscripciones",
    "description": "Gestión de suscripciones de empresas",
    "filters": {
      "company": "Empresa",
      "plan": "Plan",
      "allCompanies": "Todas las empresas",
      "allPlans": "Todos los planes"
    },
    "warnings": {
      "planLimitExceeded": "El nuevo plan permite máximo {{max}} usuarios, pero actualmente hay {{current}}."
    },
    "toast": {
      "updated": "Suscripción actualizada",
      "error": "Error al actualizar la suscripción."
    }
  },
  "plans": {
    "title": "Planes",
    "description": "Gestión de los planes de suscripción",
    "table": {
      "name": "Nombre",
      "monthlyPrice": "Precio Mensual",
      "maxUsers": "Máx. Usuarios",
      "maxVehicles": "Máx. Vehículos",
      "duration": "Duración (días)",
      "annualDiscount": "Dto. Anual %",
      "features": "Características",
      "state": "Estado",
      "actions": "Acciones"
    },
    "featuresCount": "Características ({{count}})",
    "noFeatures": "Sin características asignadas",
    "noFeaturesAvailable": "No hay características disponibles",
    "toast": {
      "updated": "Plan actualizado",
      "error": "Error al guardar el plan."
    }
  }
}
```

---

## 7. Helpers Centralizados

### 7.1 `src/utils/format.ts` (NUEVO)

Centraliza las funciones de formato dispersas y las hace sensibles al locale activo de i18next.

```typescript
import i18n from '@/i18n';

export type DateFormat = 'short' | 'long' | 'iso' | 'monthYear' | 'monthLong';

export function formatDate(date: Date | string | null | undefined, format: DateFormat = 'short'): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';

  const locale = i18n.language;

  switch (format) {
    case 'short':
      return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
    case 'long':
      return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
    case 'iso':
      return d.toISOString().split('T')[0] ?? '';
    case 'monthYear':
      return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(d);
    case 'monthLong':
      return new Intl.DateTimeFormat(locale, { month: 'long' }).format(d);
    default:
      return new Intl.DateTimeFormat(locale).format(d);
  }
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(i18n.language, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCurrency(value: number | null | undefined, currency = 'USD'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: 'exceptZero',
  }).format(value / 100);
}

export function getMonthName(monthNumber: number): string {
  // monthNumber: 1-12
  const date = new Date(2024, monthNumber - 1, 1);
  return new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(date);
}
```

> **Uso**: reemplaza las funciones locales `formatDate`/`formatNumber`/`formatCurrency`/`MESES` en `DashboardPage`, `VehiculosPage`, `RecorridosPage`, `SubscriptionsPage`, `ComprarPlanesPage`, `UsuariosPage`, `PlanPage`, `TarjetaCombustiblePage`, `ProfileModal`, y los 4 reportes.

### 7.2 `src/utils/statusLabels.ts` (NUEVO)

Consolida los mapas de status duplicados en un solo helper tipado.

```typescript
import type { SubscriptionStatus, MantenimientoStatus } from '@/types';
import { useTranslation } from 'react-i18next';

type StatusInfo = {
  label: string;
  badgeClass: string;
};

const subscriptionStatusMap: Record<SubscriptionStatus, { key: string; badgeClass: string }> = {
  TRIAL:    { key: 'admin:subscription.status.TRIAL',    badgeClass: 'badge-warning' },
  ACTIVE:   { key: 'admin:subscription.status.ACTIVE',   badgeClass: 'badge-active' },
  PAST_DUE: { key: 'admin:subscription.status.PAST_DUE', badgeClass: 'badge-inactive' },
  CANCELED: { key: 'admin:subscription.status.CANCELED', badgeClass: 'badge-inactive' },
  EXPIRED:  { key: 'admin:subscription.status.EXPIRED',  badgeClass: 'badge-inactive' },
};

const mantenimientoStatusMap: Record<MantenimientoStatus, { key: string; badgeClass: string }> = {
  VENCIDO: { key: 'reportes:mantenimiento.status.VENCIDO', badgeClass: 'badge-inactive' },
  PROXIMO: { key: 'reportes:mantenimiento.status.PROXIMO', badgeClass: 'badge-warning' },
  VIGENTE: { key: 'reportes:mantenimiento.status.VIGENTE', badgeClass: 'badge-active' },
};

export function getSubscriptionStatusInfo(status: SubscriptionStatus): StatusInfo {
  const { t } = useTranslation('admin');
  const entry = subscriptionStatusMap[status];
  return { label: t(entry.key), badgeClass: entry.badgeClass };
}

export function getMantenimientoStatusInfo(estado: MantenimientoStatus): StatusInfo {
  const { t } = useTranslation('reportes');
  const entry = mantenimientoStatusMap[estado];
  return { label: t(entry.key), badgeClass: entry.badgeClass };
}
```

> **Uso**: reemplaza los mapas `statusLabels` en `ProfileModal.tsx`, `SubscriptionsPage.tsx`, `ComprarPlanesPage.tsx` y el `getEstadoBadge` en `ReporteMantenimientoPage.tsx`. Tambien requiere **tipar** `MantenimientoStatus` en `types/index.ts` (hoy es `string`).

### 7.3 Tipado de `MantenimientoStatus` (cambio en `types/index.ts`)

```typescript
// Agregar:
export type MantenimientoStatus = 'VENCIDO' | 'PROXIMO' | 'VIGENTE';

// Actualizar la interfaz del item de mantenimiento:
export interface ReporteMantenimientoItem {
  // ...otros campos
  estado: MantenimientoStatus; // antes: string
}
```

---

## 8. Convenciones de Claves

### 8.1 Reglas generales

1. **Solo claves en ingles, camelCase**, agrupadas por jerarquia de objetos: `crud.modal.deleteConfirm`.
2. **No usar claves con el texto traducido** (e.g., NO usar `crud.modal."¿Está seguro..."`).
3. **Pluralizacion**: usar el sufijo `_one`/`_other` para ingles y `_one`/`_other`/`_many` para es (i18next detecta automaticamente por el count).

   ```json
   "results": {
     "_one": "{{count}} resultado",
     "_other": "{{count}} resultados"
   }
   ```

4. **Interpolacion**: envolver variables con doble llave `{{var}}`. No usar `${var}` en JSON.
5. **Anidacion maxima de 3 niveles** para evitar claves demasiado largas. Excepciones puntuales justificadas.
6. **Strings vacios**: NO dejar claves con `""`. Si una clave no aplica en un idioma, replicar el valor del fallback.

### 8.2 Convencion de nombres por categoria

| Sufijo | Uso | Ejemplo |
|---|---|---|
| `title` | Titulo de pagina/seccion | `dashboard.title` |
| `description` | Subtitulo o descripcion | `dashboard.description` |
| `table.<col>` | Encabezados de tabla | `vehiculos.table.licensePlate` |
| `form.<field>.label` | Etiqueta de campo de formulario | `vehiculos.form.model.label` |
| `form.<field>.placeholder` | Placeholder de campo | `vehiculos.form.model.placeholder` |
| `actions.<verb>` | Botones y acciones | `common.actions.new` |
| `toast.<type>` | Mensajes de notificacion | `crud.toast.created` |
| `state.<value>` | Estados (Activo, Inactivo, etc.) | `common.state.active` |
| `filter.<name>` | Etiquetas de filtros | `reportes.filter.fromDate` |
| `badge.<status>` | Etiquetas de badges | `admin.subscription.status.ACTIVE` |
| `validation.<rule>` | Mensajes de validacion | `auth.validation.passwordMinLength` |

### 8.3 Politica de fallback

- Si una clave falta en `en.json`, i18next usa la clave correspondiente de `es.json` (fallbackLng).
- Si la clave falta en ambos, i18next retorna la clave cruda (e.g., `crud.modal.deleteConfirm`). Esto sera detectado en tests.

---

## 9. Casos Especiales

### 9.1 Mensajes del backend (politica: NO traducir)

**Situacion actual:** `useCrud.ts` muestra `error.response.data.message` (espanol del backend) como toast.

**Politica adoptada:** se mantiene como esta. Solo se traducen los fallbacks del front.

```typescript
// hooks/useCrud.ts (despues de migracion)
const message = error.response?.data?.message ?? t('errors:crud.load');
addToast({ type: 'error', title: t('common:state.error'), message });
```

### 9.2 Pluralizacion (4 lugares)

Reemplazar `{n} item{s}` por i18next plural:

```json
// reportes.json
"results": {
  "_one": "{{count}} resultado",
  "_other": "{{count}} resultados"
},
"vehicles": {
  "_one": "{{count}} vehículo",
  "_other": "{{count}} vehículos"
}
```

```tsx
// Uso:
{t('reportes:results', { count: totalElements })}
```

Aplica a: `ReporteMantenimientoPage` (vehiculos), `ReporteAbastecimientoPage` (resultados), `RolesPage` (permisos seleccionados), `UsuariosPage` (roles seleccionados).

### 9.3 Arrays `MESES` (2 lugares)

**Antes:**
```tsx
const MESES = ['Enero', 'Febrero', ..., 'Diciembre'];
// ...
{MESES[month - 1]}
```

**Despues:**
```tsx
import { getMonthName } from '@/utils/format';
// ...
{getMonthName(month)}
```

Tambien se puede usar el helper para construir opciones de un `<select>`:
```tsx
{Array.from({ length: 12 }, (_, i) => (
  <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
))}
```

### 9.4 Estados de suscripcion duplicados

Eliminar los 3 mapas `statusLabels` en `ProfileModal`, `SubscriptionsPage`, `ComprarPlanesPage` y usar el helper `getSubscriptionStatusInfo(status)` definido en 7.2.

### 9.5 Badges de variacion (`+5%`, `-3%`)

Los signos `+`, `-`, `%` son universales. Solo traducir el texto acompanante:

```tsx
<TrendingUp className="h-3 w-3" />
<span>{formatPercent(variacion)}</span>
<span className="text-xs text-gray-500">{t('dashboard:variation.vsLastMonth')}</span>
```

### 9.6 Permisos y roles (NO traducir)

`RolesPage` y `PermisosPage` muestran `role.name` y `perm.name` directamente. Mantener como esta.

### 9.7 Inconsistencias ortograficas a normalizar

Al migrar, las claves en `es.json` usaran **ortografia canonica con tildes**. Ejemplos:

| Actual (en codigo) | Clave i18n (es) | Traduccion (en) |
|---|---|---|
| `Direccion` | `companies.form.address.label` | `Address` |
| `Telefono` | `companies.form.phone.label` | `Phone` |
| `Vehiculo` | `vehicles.title` | `Vehicles` |
| `Gestion de las provincias` | `provinces.description` | `Management of provinces` |
| `Suscripcion` | `subscription.title` | `Subscription` |
| `Periodo` | `common.period` | `Period` |
| `Analisis` | `analysis.title` | `Analysis` |

### 9.8 Selector de idioma (`TopNavbar`)

Agregar un dropdown con bandera + codigo ISO:

```tsx
// components/layout/TopNavbar.tsx (extracto)
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <div className="relative">
      <button className="...">
        <Globe className="h-4 w-4" />
        <span>{i18n.language.toUpperCase()}</span>
      </button>
      <div className="absolute right-0 mt-2 w-32 ...">
        <button onClick={() => i18n.changeLanguage('es')}>ES — Español</button>
        <button onClick={() => i18n.changeLanguage('en')}>EN — English</button>
      </div>
    </div>
  );
}
```

---

## 10. Plan de Migracion por Fases

### Fase 0 — Preparacion (0.5 dia)

**Objetivo:** instalar dependencias y crear estructura base.

- [ ] `npm install i18next react-i18next i18next-browser-languagedetector`
- [ ] `npm install -D @types/i18next` (si aplica)
- [ ] Crear carpeta `public/locales/{es,en}/`
- [ ] Crear `src/i18n/index.ts`, `config.ts`, `resources.ts`
- [ ] Importar `src/i18n/index.ts` en `main.tsx` (side-effect)
- [ ] Verificar que `i18n.language` se inicializa correctamente (console.log)
- [ ] Crear archivos JSON vacios para los 12 namespaces en `es/` y `en/`

**Criterio de salida:** la app arranca sin errores y `i18n.language` retorna `'es'` por defecto.

### Fase 1 — Infraestructura compartida (1.5 dias)

**Objetivo:** crear helpers y migrar los archivos de maximo leverage.

- [ ] Crear `src/utils/format.ts` (`formatDate`, `formatNumber`, `formatCurrency`, `formatPercent`, `getMonthName`)
- [ ] Crear `src/utils/statusLabels.ts` (`getSubscriptionStatusInfo`, `getMantenimientoStatusInfo`)
- [ ] Tipar `MantenimientoStatus` en `types/index.ts`
- [ ] Migrar `utils/navigation.ts`:
  - Reemplazar `label: 'Administración'` por `labelKey: 'navigation:sections.administracion'`
  - Actualizar `NavSection` y `NavItem` para usar `labelKey` en vez de `label`
  - Actualizar `Sidebar.tsx` para resolver la clave via `t()`
- [ ] Migrar `components/common/CrudPage.tsx` (~22 strings):
  - Botones: `Nuevo`, `Cancelar`, `Crear`, `Actualizar`, `Guardando...`
  - Headers: `Estado`, `Acciones`
  - Badges: `Activo`, `Inactivo`
  - Estados: `Cargando...`, `No se encontraron resultados`, `No hay registros`
  - Modales: `Editar {{singular}}`, `Nuevo {{singular}}`, `Eliminar {{singular}}`, mensaje de confirmacion
  - Toasts: `created`, `updated`, `deleted`, variantes con nombre
- [ ] Migrar `components/common/Pagination.tsx` (`Mostrando {{start}} a {{end}} de {{total}} resultados`)
- [ ] Migrar `components/common/ProtectedRoute.tsx` y `SuperAdminRoute.tsx` (`Acceso Denegado`)
- [ ] Migrar `components/common/ComingSoon.tsx`
- [ ] Migrar `hooks/useCrud.ts` (4 fallbacks de error a `errors:` namespace)

**Criterio de salida:**
- Menu lateral muestra textos traducidos.
- Cualquier pagina CRUD (e.g., `/marcas`) muestra todos sus strings comunes traducidos.
- Cambiar idioma via `i18n.changeLanguage('en')` en consola actualiza el menu y los botones de CrudPage.

### Fase 2 — Layout y Auth (1 dia)

**Objetivo:** migrar layout y paginas de autenticacion/perfil.

- [ ] Migrar `components/layout/Sidebar.tsx` (~5 strings)
- [ ] Migrar `components/layout/TopNavbar.tsx` (~5 strings)
- [ ] Agregar `LanguageSwitcher` al TopNavbar
- [ ] Migrar `pages/auth/LoginPage.tsx` (~12 strings)
- [ ] Migrar `components/ui/ProfileModal.tsx` (~30 strings + statusLabels)
- [ ] Migrar `components/ui/ChangePasswordModal.tsx` (~15 strings)
- [ ] Migrar `components/ui/SearchableDropdown.tsx` (~3 strings)
- [ ] Migrar `components/ui/ConfirmModal.tsx` (default `confirmText`)

**Criterio de salida:**
- Login, perfil y cambio de contrasena totalmente traducidos.
- Selector de idioma funcional y persistente (recarga mantiene idioma).

### Fase 3 — Catalogos config-only (1.5 dias)

**Objetivo:** migrar las 11 paginas CRUD de catalogo. Cada una solo requiere cambiar su objeto `config`.

- [ ] `ProvinciaPage.tsx` (~12 strings)
- [ ] `MunicipioPage.tsx` (~14)
- [ ] `MarcaPage.tsx` (~15)
- [ ] `TipoCombustiblePage.tsx` (~14)
- [ ] `TipoVehiculoPage.tsx` (~13)
- [ ] `CategoriaLicenciaPage.tsx` (~14)
- [ ] `CurrencyPage.tsx` (~12)
- [ ] `FeaturePage.tsx` (~12)
- [ ] `PlanPage.tsx` (~55)
- [ ] `EmpresaPage.tsx` (~20)
- [ ] `TarjetaCombustiblePage.tsx` (~40 — custom pero simple)
- [ ] `PermisosPage.tsx` (~12)

**Patron de migracion para catalogos config-only:**

```tsx
// Antes:
const config: CrudPageConfig<...> = {
  title: 'Marcas',
  singular: 'Marca',
  description: 'Gestión de las marcas de vehículos',
  // ...
  formFields: [
    { name: 'nombre', label: 'Nombre', placeholder: 'Ej: Toyota' },
    { name: 'paisOrigen', label: 'País de Origen', placeholder: 'Ej: Japón' },
  ],
};

// Despues:
const config: CrudPageConfig<...> = {
  titleKey: 'catalogs:brands.title',
  singularKey: 'catalogs:brands.singular',
  descriptionKey: 'catalogs:brands.description',
  // ...
  formFields: [
    { name: 'nombre', labelKey: 'common:field.name', placeholderKey: 'catalogs:brands.form.name.placeholder' },
    { name: 'paisOrigen', labelKey: 'catalogs:brands.form.originCountry.label', placeholderKey: 'catalogs:brands.form.originCountry.placeholder' },
  ],
};
```

> **Nota arquitectonica:** `CrudPage.tsx` y `CrudPageConfig` deben modificarse para aceptar `titleKey`/`singularKey`/`descriptionKey`/`labelKey`/`placeholderKey` (en lugar de `title`/`singular`/`description`/`label`/`placeholder`), y resolverlos internamente via `t()`. Como alternativa, las paginas pueden pasar el string ya traducido (e.g., `title: t('catalogs:brands.title')`), lo cual es mas simple pero requiere que cada pagina use `useTranslation`. **Recomendacion:** adoptar la alternativa simple (pasar strings ya traducidos) para minimizar cambios en `CrudPage.tsx`. La unica salvedad: el `singular` se interpola en `Editar {{singular}}` — para esto se puede pasar `singular` ya traducido y CrudPage hace `t('crud:modal.edit', { singular })`.

**Criterio de salida:**
- Las 11 paginas CRUD muestran titulos, descripciones, columnas, placeholders y toasts traducidos.
- Cambiar idioma actualiza todos los textos sin recargar.

### Fase 4 — Paginas custom de admin (1.5 dias)

**Objetivo:** migrar paginas de admin con tablas, modales y filtros propios.

- [ ] `pages/admin/RolesPage.tsx` (~55 strings + pluralizacion)
- [ ] `pages/admin/UsuariosPage.tsx` (~55 + pluralizacion)
- [ ] `pages/admin/SubscriptionsPage.tsx` (~65 + usar `getSubscriptionStatusInfo`)
- [ ] `pages/admin/ComprarPlanesPage.tsx` (~50 + usar `getSubscriptionStatusInfo`)
- [ ] `pages/dashboard/DashboardPage.tsx` (~35 + reemplazar `MESES` + usar helpers de formato)

**Criterio de salida:**
- Tres paginas de admin totalmente traducidas.
- Dashboard actualiza meses y formato de numeros/currency al cambiar idioma.

### Fase 5 — Paginas custom operacionales (2 dias)

**Objetivo:** migrar las paginas mas complejas (reportes + vehiculos + choferes + recorridos).

- [ ] `pages/vehiculos/VehiculosPage.tsx` (~110 strings — el mas grande)
- [ ] `pages/choferes/ChoferesPage.tsx` (~60)
- [ ] `pages/recorridos/RecorridosPage.tsx` (~70)
- [ ] `pages/reportes/ReporteMantenimientoPage.tsx` (~40 + usar `getMantenimientoStatusInfo` + pluralizacion)
- [ ] `pages/reportes/ReporteAbastecimientoPage.tsx` (~55 + pluralizacion)
- [ ] `pages/reportes/ReporteConsumoVehiculoPage.tsx` (~55)
- [ ] `pages/reportes/ReporteConsumoCombustiblePage.tsx` (~55)

**Criterio de salida:**
- 100% de paginas traducidas.
- Reportes usan helpers centralizados de formato y status.

### Fase 6 — Validacion, Testing y Documentacion (1 dia)

- [ ] Audit completo: `rg -n "[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+.*[A-ZÁÉÍÓÚÑ]" --type ts --type tsx src/` para detectar strings en espanol residual.
- [ ] Verificar que no queden strings hardcoded en JSX (salvo excepciones tipadas como IDs tecnicos).
- [ ] Probar cambio de idioma en todas las paginas.
- [ ] Validar que `localStorage` persiste la eleccion.
- [ ] Validar formato de fechas/numeros/moneda en ambos idiomas.
- [ ] Lighthouse: confirmar que el bundle no crecio mas de 30 KB gzipados.
- [ ] Actualizar `frontend/README.md` con seccion "Como agregar una nueva clave i18n" y "Como agregar un nuevo idioma".
- [ ] PR con `feat: add i18n support (es + en)` siguiendo Conventional Commits.

**Criterio de salida final:**
- 100% de paginas traducidas a es + en.
- 0 strings hardcoded detectados (salvo excepciones justificadas).
- Selector de idioma funcional.
- Documentacion actualizada.

---

## 11. Instalacion y Configuracion Inicial

### 11.1 Instalacion de dependencias

```bash
cd /home/z/my-project/repos/fleet-frontend/frontend
npm install i18next react-i18next i18next-browser-languagedetector
```

> No se requiere `i18next-http-backend` ni `i18next-resources-to-backend` porque los JSON se importan como modulos ES (decision AD-i18n-02).

### 11.2 Creacion de estructura

```bash
mkdir -p public/locales/{es,en}
mkdir -p src/i18n
touch src/i18n/index.ts src/i18n/resources.ts
touch public/locales/{es,en}/{common,navigation,auth,dashboard,crud,catalogs,vehiculos,choferes,recorridos,admin,reportes,errors}.json
```

### 11.3 Importacion en `main.tsx`

```typescript
// main.tsx (despues)
import '@/i18n';              // <-- side-effect: inicializa i18next
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### 11.4 Vite config

No requiere cambios. Vite sirve archivos estaticos desde `public/` por defecto.

### 11.5 TypeScript config

No requiere cambios. Los archivos JSON se importan como modulos ES tipados si `resolveJsonModule: true` (verificar `tsconfig.json`). Si esta desactivado, agregar:

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

---

## 12. Testing y Validacion

### 12.1 Testing manual (minimo)

| Escenario | Pasos | Resultado esperado |
|---|---|---|
| Idioma por defecto | Cargar la app sin localStorage previo | UI en espanol |
| Deteccion de navegador | Forzar `navigator.language = 'en-US'`, sin localStorage | UI en ingles |
| Persistencia | Seleccionar ingles, recargar | UI sigue en ingles |
| Cambio en runtime | Click en ES/EN en el selector | UI cambia sin recargar |
| Fallback | Borrar una clave en `en.json` | UI muestra el valor en espanol |
| Formato de fecha | Cambiar idioma y mirar `SubscriptionsPage` | Fecha cambia formato (`dd/mm/yyyy` -> `m/d/yyyy`) |
| Pluralizacion | `ReporteMantenimiento` con 1 vs 2 resultados | "1 vehiculo" / "2 vehiculos" (es); "1 vehicle" / "2 vehicles" (en) |
| CrudPage | Crear/editar/eliminar en `/marcas` | Toasts traducidos |
| Login | Credenciales invalidas | Error traducido (solo fallback; el del backend queda en espanol) |

### 12.2 Testing automatico (recomendado, fase futura)

- **Unit test** de `utils/format.ts` con Vitest: probar `formatDate('2026-09-05', 'short')` para `es` y `en`.
- **Integration test** de `CrudPage` con React Testing Library: renderizar con i18next inicializado y verificar que `t('crud:actions.new')` aparece en el DOM.
- **Test de regresion**: snapshot de las 25 paginas en ambos idiomas.

### 12.3 Audit automatico de strings hardcoded

Crear un script de CI que detecte strings en espanol en JSX:

```bash
# scripts/check-i18n.sh (extracto)
rg -n "(>[A-ZÁÉÍÓÚÑ][a-záéíóúñ ]+<|placeholder=\"[^\"]+\"|title=\"[^\"]+\"|label:\s*'[A-ZÁÉÍÓÚÑ])" \
  src/ --type tsx \
  | grep -vE "(className|src=|href=|alt=)" \
  | grep -v "test\."
```

Este script se puede integrar en GitHub Actions para bloquear PRs que introduzcan strings hardcoded.

---

## 13. Estimacion de Esfuerzo

### 13.1 Distribucion por fase

| Fase | Descripcion | Esfuerzo (dias ingeniero) | Archivos afectados |
|---|---|---:|---:|
| 0 | Preparacion | 0.5 | Estructura + 2 archivos config |
| 1 | Infraestructura compartida | 1.5 | 6 archivos (format, statusLabels, navigation, CrudPage, Pagination, useCrud) |
| 2 | Layout y Auth | 1.0 | 7 archivos (Sidebar, TopNavbar, LoginPage, ProfileModal, ChangePasswordModal, SearchableDropdown, ConfirmModal) |
| 3 | Catalogos config-only | 1.5 | 11 paginas |
| 4 | Paginas custom de admin | 1.5 | 5 paginas |
| 5 | Paginas operacionales | 2.0 | 7 paginas |
| 6 | Validacion y documentacion | 1.0 | — |
| **TOTAL** | | **~9 dias ingeniero** | **~30 archivos** |

### 13.2 Distribucion por tipo de esfuerzo

| Tipo | % del esfuerzo | Detalle |
|---|---:|---|
| Migracion mecanica (string -> t('key')) | 55% | La mayoria de los archivos |
| Diseno de claves y namespaces | 10% | Definir estructura semantica |
| Helpers y refactor | 10% | format.ts, statusLabels.ts, tipar enums |
| Resolucion de casos especiales | 10% | Pluralizacion, interpolacion, errores backend |
| Testing y audit | 10% | Manual + automatico |
| Documentacion | 5% | README + guia de extension |

### 13.3 Riesgos que pueden desviar la estimacion

- **Strings dinamicos no detectados**: el analisis encontro ~1.000 strings; podrian aparecer 5-10% mas al implementar (e.g., atributos `title` en iconos, `aria-label` futuros).
- **Decision de politica de errores backend**: si producto decide que los errores del backend deben traducirse, se requiere coordinar con backend para agregar `errorCode`, lo cual desplaza el cronograma 2-3 dias adicionales.
- **Refactor de `CrudPageConfig`**: si se decide cambiar la interfaz para usar `titleKey` en vez de `title`, requiere tocar las 11 paginas config-only (añade ~0.5 dia).

---

## 14. Riesgos y Mitigaciones

### 14.1 Matriz de riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|---|---|---|---|
| Strings del backend no traducibles | Alta | Medio | Documentar politica; futuro: pedir `errorCode` al backend |
| Claves i18n rotas por renombrados | Media | Alto | Tipado opcional de claves (seccion 5.4) + tests |
| Bundle size +30KB | Baja | Bajo | Verificado; si crece, migrar a lazy loading por namespace |
| Olvido de strings en JSX (no migrados) | Alta | Medio | Script CI de audit (seccion 12.3) |
| Diferencia ortografica es-ES vs es-CU | Media | Bajo | Politica: usar es-ES canonico; producto puede pedir es-CU luego |
| Pluralizacion insuficiente (idiomas futuros) | Baja | Bajo | i18next soporta pluralizacion completa; usar `_one`/`_other`/`_many` |
| Traducciones en ingles incorrectas | Media | Medio | Revisar con nativo o servicio profesional; no usar traduccion automatica literal |
| Flash of untranslated content (FOUC) | Baja | Bajo | Carga sincrona de JSON (decision AD-i18n-02) lo elimina |
| Perdida de rendimiento por `useTranslation` re-renders | Baja | Medio | Usar namespaces estrechos; no `useTranslation()` con todos los namespaces |
| Conflicto con `react-router-dom` (rutas con locale) | N/A | N/A | No se usan rutas con prefijo de locale; el idioma es de UI, no de URL |

### 14.2 Decisiones de producto pendientes

Estas decisiones deben confirmarse con producto/stakeholders **antes** de iniciar la Fase 1:

1. **Política de mensajes del backend**: confirmar que NO se traducen (decision AD-i18n-07).
2. **Política de permisos/roles como IDs**: confirmar que se muestran crudos (decision AD-i18n-08).
3. **Idiomas soportados en v1**: confirmar es + en. Si se requiere un tercer idioma (e.g., pt-BR), agregar desde el inicio.
4. **Variante regional del espanol**: confirmar es-ES canonico o se requiere es-CU.
5. **Currency**: el dashboard hoy fuerza `CUP`. Confirmar si en ingles se mantiene `CUP` o se cambia a `USD`.

---

## 15. Criterios de Aceptacion

### 15.1 Funcionales

- [ ] **CA-1**: El usuario puede cambiar el idioma de la interfaz entre Espanol e Ingles desde un selector en el `TopNavbar`.
- [ ] **CA-2**: La eleccion de idioma persiste en `localStorage` y se mantiene tras recargar.
- [ ] **CA-3**: En primera visita, el idioma se detecta automaticamente del navegador.
- [ ] **CA-4**: El menu lateral (`navigation.ts`) muestra sus 23 items y 4 secciones traducidos en ambos idiomas.
- [ ] **CA-5**: Las 25 paginas de la aplicacion muestran titulos, descripciones, encabezados de tabla, botones, placeholders, labels de formulario y toasts traducidos.
- [ ] **CA-6**: El componente `CrudPage` (usado por 11 paginas) muestra todos sus strings comunes traducidos.
- [ ] **CA-7**: Las fechas, numeros y monedas se formatean segun el locale activo (formato de fecha `dd/mm/yyyy` en es, `m/d/yyyy` en en).
- [ ] **CA-8**: Los nombres de meses (`Enero`/`January`, etc.) cambian con el idioma.
- [ ] **CA-9**: La pluralizacion funciona correctamente en los 4 lugares identificados (resultados, vehiculos en mantenimiento, permisos seleccionados, roles seleccionados).
- [ ] **CA-10**: Los estados de suscripcion (`TRIAL`, `ACTIVE`, etc.) se muestran traducidos y consistentes en los 3 componentes que los usan.
- [ ] **CA-11**: Los estados de mantenimiento (`VENCIDO`, `PROXIMO`, `VIGENTE`) se muestran traducidos.
- [ ] **CA-12**: Los mensajes de error fallback del front (`useCrud.ts`, `LoginPage.tsx`) se traducen.
- [ ] **CA-13**: Los mensajes del backend (`error.response.data.message`) NO se traducen (decision AD-i18n-07).
- [ ] **CA-14**: Los IDs tecnicos (`ADMIN`, `SUPER_ADMIN`, `USUARIOS_CREATE`) se muestran crudos (decision AD-i18n-08).
- [ ] **CA-15**: Las inconsistencias ortograficas detectadas se normalizan (tildes consistentes).

### 15.2 Tecnicos

- [ ] **CA-T1**: `npm run build` exitoso sin warnings ni errores de TypeScript.
- [ ] **CA-T2**: `npm run lint` exitoso (oxlint).
- [ ] **CA-T3**: Bundle final no crece mas de 30 KB gzipados respecto a la version pre-i18n.
- [ ] **CA-T4**: LCP del dashboard no se degrada mas de 100 ms (Lighthouse).
- [ ] **CA-T5**: No hay strings hardcoded detectados por el script de audit (seccion 12.3).
- [ ] **CA-T6**: Las claves i18n ausentes en `en.json` hacen fallback a `es.json` correctamente.
- [ ] **CA-T7**: Cambiar idioma en runtime re-renderiza los componentes visibles sin necesidad de recarga.
- [ ] **CA-T8**: No se introducen regresiones en RF-01..RF-14.

### 15.3 Documentacion

- [ ] **CA-D1**: `frontend/README.md` actualizado con seccion i18n.
- [ ] **CA-D2**: Guia de "Como agregar una nueva clave i18n".
- [ ] **CA-D3**: Guia de "Como agregar un nuevo idioma".
- [ ] **CA-D4**: Este plan archivado en `docs/` del repositorio.

---

## 16. Checklist de Entrega

### 16.1 Pre-flight (antes de empezar)

- [ ] Confirmar las 5 decisiones de producto pendientes (seccion 14.2).
- [ ] Crear branch `feature/i18n` desde `developSuscription` (no se hace push directo a `main` ni a `developFT`).
- [ ] Backup o tag del commit pre-migracion para rollback rapido.

### 16.2 Por fase (checkpoints)

- [ ] Fase 0 completada y verificada (CA-T1, CA-T2).
- [ ] Fase 1 completada: menu lateral y CrudPage traducidos.
- [ ] Fase 2 completada: login, perfil y layout traducidos.
- [ ] Fase 3 completada: 11 catalogos traducidos.
- [ ] Fase 4 completada: 5 paginas admin traducidas.
- [ ] Fase 5 completada: 7 paginas operacionales traducidas.
- [ ] Fase 6 completada: audit, testing y documentacion.

### 16.3 Final (cierre)

- [ ] PR abierto contra `developSuscription` con titulo `feat: add i18n support (es + en)`.
- [ ] Descripcion del PR incluye:
  - Resumen del cambio
  - Lista de archivos migrados
  - Capturas de pantalla en es y en de al menos 3 paginas representativas
  - Referencia a este plan
- [ ] Al menos 1 revisor asignado.
- [ ] CI verde (lint + build + audit).
- [ ] Merge solo despues de aprobacion.

---

## 17. Anexos

### 17.1 Anexo A — Mapa de archivos por namespace

| Namespace | Archivos que lo consumen |
|---|---|
| `common` | Todos (es el defaultNS) |
| `navigation` | `utils/navigation.ts`, `components/layout/Sidebar.tsx` |
| `auth` | `pages/auth/LoginPage.tsx`, `components/ui/ProfileModal.tsx`, `components/ui/ChangePasswordModal.tsx` |
| `dashboard` | `pages/dashboard/DashboardPage.tsx` |
| `crud` | `components/common/CrudPage.tsx` (consumido por 11 paginas) |
| `catalogs` | Las 11 paginas en `pages/catalogs/` |
| `vehiculos` | `pages/vehiculos/VehiculosPage.tsx` |
| `choferes` | `pages/choferes/ChoferesPage.tsx` |
| `recorridos` | `pages/recorridos/RecorridosPage.tsx` |
| `admin` | `pages/admin/*.tsx` (5 archivos) |
| `reportes` | `pages/reportes/*.tsx` (4 archivos) |
| `errors` | `hooks/useCrud.ts`, `pages/auth/LoginPage.tsx`, cualquier catch de error |

### 17.2 Anexo B — Plantilla de migracion para pagina custom

```tsx
// pages/.../MiPaginaPage.tsx (despues de migracion)
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { formatDate, formatNumber } from '@/utils/format';

export default function MiPaginaPage() {
  const { t } = useTranslation(['miNamespace', 'common']);

  return (
    <>
      <PageHeader
        title={t('miNamespace:title')}
        description={t('miNamespace:description')}
      />

      <table>
        <thead>
          <tr>
            <th>{t('miNamespace:table.column1')}</th>
            <th>{t('common:state.active')}</th>
            <th>{t('common:actions.title')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{formatDate(item.createdAt, 'short')}</td>
              <td>{formatNumber(item.value, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <p>{t('common:state.empty')}</p>
      )}
    </>
  );
}
```

### 17.3 Anexo C — Plantilla de migracion para catalogo config-only

```tsx
// pages/catalogs/MarcaPage.tsx (despues de migracion)
import { useTranslation } from 'react-i18next';
import CrudPage from '@/components/common/CrudPage';
import type { CrudPageConfig } from '@/components/common/CrudPage';
import { marcaApi } from '@/api/endpoints';
import type { MarcaRequest, MarcaResponse } from '@/types';

export default function MarcaPage() {
  const { t } = useTranslation(['catalogs', 'common']);

  const config: CrudPageConfig<MarcaRequest, MarcaResponse> = {
    title: t('catalogs:brands.title'),
    singular: t('catalogs:brands.singular'),
    description: t('catalogs:brands.description'),
    permission: 'MARCAS_READ',
    api: marcaApi,
    columns: [
      { key: 'nombre', header: t('common:field.name') },
      { key: 'paisOrigen', header: t('catalogs:brands.form.originCountry.label') },
      // ...
    ],
    formFields: [
      { name: 'nombre', label: t('common:field.name'), placeholder: t('catalogs:brands.form.name.placeholder'), type: 'text', required: true },
      { name: 'paisOrigen', label: t('catalogs:brands.form.originCountry.label'), placeholder: t('catalogs:brands.form.originCountry.placeholder'), type: 'text', required: true },
    ],
    // ...resto sin cambios
  };

  return <CrudPage config={config} />;
}
```

### 17.4 Anexo D — Referencias

- **Documentacion oficial react-i18next:** https://react.i18next.com/
- **Documentacion oficial i18next:** https://www.i18next.com/
- **i18next-browser-languagedetector:** https://github.com/i18next/i18next-browser-languagedetector
- **i18next pluralization rules:** https://www.i18next.com/translation-function/plurals
- **Intl.NumberFormat:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
- **Intl.DateTimeFormat:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat

### 17.5 Anexo E — Glosario

| Termino | Definicion |
|---|---|
| **i18n** | Abreviatura de "internacionalizacion" (18 letras entre la i y la n). |
| **Locale** | Identificador de idioma y region, e.g., `es-ES`, `en-US`. |
| **Namespace** | Agrupacion logica de claves de traduccion (e.g., `common`, `auth`). |
| **Fallback** | Idioma o clave usada cuando la traduccion solicitada no existe. |
| **Interpolacion** | Sustitucion de variables en un string traducido (e.g., `{{name}}`). |
| **Pluralizacion** | Variacion del texto segun un count (uno/otros). |
| **FOUC** | "Flash of untranslated content" — parpadeo de texto sin traducir al cargar. |
| **RBAC** | Role-Based Access Control. |
| **CRUD** | Create, Read, Update, Delete. |

---

*Plan elaborado a partir del analisis del repositorio `fleet-frontend` en branch `developSuscription` y de los documentos `DOCUMENTO_TECNICO_FLEET_MANAGEMENT.md` y `REQUISITOS_FUNCIONALES.md`.*
