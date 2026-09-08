# Documento de Arquitectura Tecnica — Fleet Management Frontend

> **Version:** 4.0.0
> **Fecha:** 2026-09-07
> **Branch activa:** `enzonaIntegration` (mergeable a `developSuscription`)
> **Repositorio:** fleet-frontend (GitHub: keniercb/fleet-frontend)
> **Commit de referencia:** `713fd2a` (refactor: move locale JSONs to src/locales)
> **PR de referencia:** [#2 — feat: add i18n support (es + en)](https://github.com/keniercb/fleet-frontend/pull/2), branch `enzonaIntegration` (integracion de pago Enzona)

---

## Tabla de Contenidos

1. [Vision General](#1-vision-general)
2. [Stack Tecnologico](#2-stack-tecnologico)
3. [Arquitectura de Alto Nivel](#3-arquitectura-de-alto-nivel)
4. [Estructura de Carpetas](#4-estructura-de-carpetas)
5. [Capa de Tipos y Contratos](#5-capa-de-tipos-y-contratos)
6. [Capa de API](#6-capa-de-api)
7. [Capa de Hooks y Contextos](#7-capa-de-hooks-y-contextos)
8. [Capa de Componentes](#8-capa-de-componentes)
9. [Capa de Paginas](#9-capa-de-paginas)
10. [Sistema de Internacionalizacion (i18n)](#10-sistema-de-internacionalizacion-i18n)
11. [Helpers de Formato y Status](#11-helpers-de-formato-y-status)
12. [Sistema de Diseno](#12-sistema-de-diseno)
13. [Seguridad y RBAC](#13-seguridad-y-rbac)
14. [Flujos de Autenticacion](#14-flujos-de-autenticacion)
15. [Integracion de Pago Enzona](#15-integracion-de-pago-enzona)
16. [Estrategia de Branching](#16-estrategia-de-branching)
17. [Decisiones Arquitectonicas (ADRs)](#17-decisiones-arquitectonicas-adrs)
18. [Metricas del Proyecto](#18-metricas-del-proyecto)
19. [Posibles Mejoras](#19-posibles-mejoras)
20. [Diagrama de Componentes](#20-diagrama-de-componentes)
21. [Guia de Extension](#21-guia-de-extension)

---

## 1. Vision General

El Sistema de Gestion de Flota Vehicular es una aplicacion web **Single-Page Application (SPA)** orientada a la administracion integral de vehiculos, choferes, recorridos, combustible y mantenimiento para empresas de transporte. La aplicacion consume una API REST backend (Spring Boot) desplegada en `localhost:8081` y expone un frontend reactivo con control de acceso basado en roles (RBAC), dashboard ejecutivo, reportes operacionales e internacionalizacion (i18n) en Espanol e Ingles.

La arquitectura sigue el patron **layered frontend** con separacion estricta de responsabilidades: la capa `api/` solo conoce de HTTP; la capa `types/` solo define contratos; los `hooks/` manejan estado de servidor; los `contexts/` manejan estado global; los `components/` solo renderizan UI; y las `pages/` solo orquestan.

### 1.1 Principios rectores

- **DRY (Don't Repeat Yourself)**: el componente generico `CrudPage<TReq, TRes>` elimina la duplicacion de 11+ tablas, formularios y modales de eliminacion.
- **KISS (Keep It Simple)**: no se usa estado global complejo (Redux/Zustand). React Context es suficiente para auth y toasts.
- **Separation of Concerns**: cada capa tiene una unica responsabilidad y no filtra concerns de otra.
- **Convention over Configuration**: las paginas CRUD siguen una convencion fija (tabla + modal + confirmacion) que permite agregar entidades con minima configuracion.
- **Fail-Fast**: TypeScript strict mode con `noUncheckedIndexedAccess` fuerza a manejar casos undefined en compilacion, no en runtime.
- **i18n-by-default**: el 100% de los textos visibles al usuario son traducibles; las claves estan tipadas en compilacion para autocompletado VSCode.

---

## 2. Stack Tecnologico

### 2.1 Dependencias de produccion

| Dependencia | Version | Rol |
|---|---|---|
| `react` | ^19.2.8 | Framework UI declarativo |
| `react-dom` | ^19.2.8 | Montaje en el DOM |
| `react-router-dom` | ^6.28.0 | Navegacion SPA con rutas protegidas |
| `axios` | ^1.19.0 | HTTP client con interceptores |
| `tailwindcss` | ^4.3.3 | Framework CSS utility-first |
| `@tailwindcss/vite` | ^4.3.3 | Integracion nativa Tailwind + Vite |
| `lucide-react` | ^1.31.0 | Iconografia SVG tree-shakeable |
| `i18next` | ^26.4.2 | Core del sistema de internacionalizacion |
| `react-i18next` | ^17.0.13 | Binding React para i18next (`useTranslation`) |
| `i18next-browser-languagedetector` | ^8.2.1 | Deteccion automatica de idioma del navegador |

### 2.2 Dependencias de desarrollo

| Dependencia | Version | Rol |
|---|---|---|
| `typescript` | ~5.7.0 | Tipado estatico, seguridad en compilacion |
| `vite` | ^8.2.0 | Bundler y dev server ultra-rapido (ESM nativo) |
| `@vitejs/plugin-react` | ^6.0.4 | Plugin React con Fast Refresh |
| `oxlint` | ^1.75.0 | Linter Rust-based (rapido y estricto) |
| `@types/react`, `@types/react-dom`, `@types/node` | ^19.x / ^26.x | Tipos para TypeScript |

### 2.3 Configuracion TypeScript

`tsconfig.app.json` (extracto):

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noUncheckedIndexedAccess": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

> **Nota**: `resolveJsonModule: true` es requerido por el sistema i18n (importacion de JSON de traducciones como modulos tipados). Los archivos JSON viven en `src/locales/` y son importados directamente por `src/i18n/index.ts` y `src/i18n/types.ts`.

### 2.4 Configuracion Vite

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': resolve(import.meta.dirname, './src') } },
  server: {
    proxy: { '/api': { target: 'http://localhost:8081', changeOrigin: true } }
  }
})
```

- **Path alias**: `@/` mapea a `src/` para imports limpios.
- **Proxy**: en desarrollo, `/api` se proxean al backend Spring Boot en `http://localhost:8081`.
- **API base URL**: `import.meta.env.VITE_API_BASE_URL || '/api'` (configurable via `.env`).

---

## 3. Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                       Browser (User Agent)                       │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Vite Dev Server (:5173)                    │
│              proxy /api → http://localhost:8081                 │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    React SPA (Entry: main.tsx)                   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              i18n init (side-effect import)                │ │
│  │   - i18next + react-i18next + LanguageDetector            │ │
│  │   - 12 namespaces x 2 idiomas (es, en)                    │ │
│  │   - localStorage persistence (key: i18nextLng)             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              BrowserRouter                                 │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │              ToastProvider                            │  │ │
│  │  │  ┌──────────────────────────────────────────────┐    │  │ │
│  │  │  │              AuthProvider                    │    │  │ │
│  │  │  │  ┌────────────────────────────────────────┐  │    │  │ │
│  │  │  │  │              Routes                   │  │    │  │ │
│  │  │  │  │   - /login  (PublicOnlyRoute)         │  │    │  │ │
│  │  │  │  │   - /       (MainLayout wrapper)       │  │    │  │ │
│  │  │  │  │     ├── Sidebar + TopNavbar            │  │    │  │ │
│  │  │  │  │     ├── /vehiculos (ProtectedRoute)    │  │    │  │ │
│  │  │  │  │     ├── /roles      (ProtectedRoute)    │  │    │  │ │
│  │  │  │  │     ├── /empresas   (ProtectedRoute)    │  │    │  │ │
│  │  │  │  │     ├── /planes     (SuperAdminRoute)   │  │    │  │ │
│  │  │  │  │     └── ...22 rutas mas                  │  │    │  │ │
│  │  │  │  └────────────────────────────────────────┘  │    │  │ │
│  │  │  └──────────────────────────────────────────────┘    │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────┐  ┌────────────────────┐                 │
│  │   api/client.ts    │  │   utils/format.ts   │                 │
│  │  - Axios instance   │  │  - formatDate       │                 │
│  │  - JWT interceptor  │  │  - formatNumber    │                 │
│  │  - 401 → /login     │  │  - formatCurrency   │                 │
│  └─────────┬──────────┘  │  - getMonthName     │                 │
│            │              └────────────────────┘                 │
│            ▼                                                     │
│  ┌────────────────────┐  ┌────────────────────┐                 │
│  │   api/endpoints.ts  │  │ utils/statusLabels │                 │
│  │  - 24 API objects    │  │  - useSubscription │                │
│  │  - 100+ endpoints    │  │    StatusInfo      │                │
│  └─────────┬──────────┘  │  - useMantenimiento │                │
│            │              │    StatusInfo      │                │
│            ▼              └────────────────────┘                 │
│  ┌────────────────────────────────────────────┐                 │
│  │          Backend Spring Boot (:8081)        │                 │
│  │   - JWT Auth (POST /auth/login)             │                 │
│  │   - REST CRUD: 24 entidades                 │                 │
│  │   - Reportes: dashboard, consumo, mant.,    │                 │
│  │     abastecimiento, consumo-combustible       │                 │
│  │   - Subscriptions + Plans                    │                 │
│  └────────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Estructura de Carpetas

```
frontend/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── App.tsx                        ← rutas + jerarquia de providers
│   ├── main.tsx                       ← entry point + import @/i18n
│   ├── index.css                      ← Tailwind + design system (componentes @layer)
│   ├── vite-env.d.ts
│   ├── i18n/
│   │   ├── index.ts                   ← inicializacion de i18next (96 lineas)
│   │   └── types.ts                   ← tipado fuerte de claves (41 lineas)
│   ├── locales/                       ← i18n resources (co-located con codigo i18n)
│   │   ├── es/                        ← Espanol (idioma por defecto)
│   │   │   ├── common.json            ← botones, estados, validaciones, meses
│   │   │   ├── navigation.json        ← menu lateral + topnavbar
│   │   │   ├── auth.json              ← login, perfil, cambio contrasena
│   │   │   ├── dashboard.json         ← KPIs, variacion
│   │   │   ├── crud.json              ← strings de CrudPage (compartido)
│   │   │   ├── catalogs.json          ← 11 catalogos (provincia, marca, ...)
│   │   │   ├── vehiculos.json
│   │   │   ├── choferes.json
│   │   │   ├── recorridos.json
│   │   │   ├── admin.json             ← roles, usuarios, permisos, planes, suscripciones, payment
│   │   │   ├── reportes.json          ← 4 reportes operacionales
│   │   │   └── errors.json            ← fallbacks de error del front
│   │   └── en/                        ← English (mismos 12 namespaces)
│   │       └── ... (12 archivos JSON)
│   ├── api/
│   │   ├── client.ts                  ← instancia axios + interceptores
│   │   └── endpoints.ts               ← 25 objetos API tipados (601 lineas)
│   ├── components/
│   │   ├── common/                    ← componentes reutilizables
│   │   │   ├── CrudPage.tsx           ← CRUD generico<TReq,TRes> (385 lineas)
│   │   │   ├── PageHeader.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── ProtectedRoute.tsx     ← guard por permiso
│   │   │   ├── SuperAdminRoute.tsx    ← guard exclusivo SUPER_ADMIN
│   │   │   └── ComingSoon.tsx
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx         ← layout shell (sidebar + topnavbar + outlet)
│   │   │   ├── Sidebar.tsx            ← menu lateral con secciones colapsables
│   │   │   └── TopNavbar.tsx          ← barra superior + LanguageSwitcher
│   │   └── ui/                        ← componentes atomicos
│   │       ├── Modal.tsx
│   │       ├── ConfirmModal.tsx
│   │       ├── ToastContainer.tsx
│   │       ├── ProfileModal.tsx
│   │       ├── ChangePasswordModal.tsx
│   │       └── SearchableDropdown.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx            ← user, empresa, permisos, login/logout
│   │   └── ToastContext.tsx           ← sistema de notificaciones
│   ├── hooks/
│   │   └── useCrud.ts                 ← estado de servidor generico CRUD
│   ├── pages/
│   │   ├── auth/         (1)  LoginPage
│   │   ├── dashboard/    (1)  DashboardPage (KPIs ejecutivos)
│   │   ├── catalogs/     (11) config-only CRUDs
│   │   ├── admin/        (5)  Usuarios, Roles, Permisos, Subscriptions, ComprarPlanes
│   │   ├── vehiculos/    (1)  VehiculosPage (960 lineas)
│   │   ├── choferes/     (1)  ChoferesPage
│   │   ├── recorridos/   (1)  RecorridosPage
│   │   └── reportes/     (4)  ConsumoVehiculo, Mantenimiento, Abastecimiento, ConsumoCombustible
│   ├── types/
│   │   └── index.ts                   ← 66 interfaces/tipos exportados (667 lineas)
│   └── utils/
│       ├── navigation.ts              ← config de menu + getFilteredNavigation
│       ├── format.ts                  ← formatDate, formatNumber, formatCurrency, getMonthName (115 lineas)
│       └── statusLabels.ts            ← hooks de status de suscripcion y mantenimiento (70 lineas)
├── index.html
├── package.json
├── tsconfig.app.json
├── tsconfig.json
└── vite.config.ts
```

---

## 5. Capa de Tipos y Contratos

**Archivo:** `src/types/index.ts` (667 lineas, 66 interfaces/tipos)

Esta capa define los contratos TypeScript compartidos entre API, hooks, componentes y paginas. Es la **fuente de verdad** de la forma de los datos.

### 5.1 Categorias de tipos

| Categoria | Cantidad | Ejemplos |
|---|---:|---|
| **Entities (Response)** | ~24 | `VehiculoResponse`, `ChoferResponse`, `EmpresaResponse`, `PlanResponse`, `SubscriptionResponse`, `MantenimientoReporteResponse`, `DashboardEjecutivoResponse` |
| **Requests** | ~24 | `VehiculoRequest`, `ChoferRequest`, `EmpresaRequest`, `PlanRequest`, `SubscriptionRequest`, `AuthLoginRequest` |
| **Paginacion** | 2 | `PageResponse<T>`, `PageParams` |
| **Reportes** | ~6 | `VehiculoConsumoReporteDTO`, `AbastecimientoReporteResponse`, `ConsumoCombustibleResponse`, `DetalleTipoCombustible`, `ReporteMovimientoMensualResponse` |
| **Enums/Unions** | ~5 | `SubscriptionStatus`, `RequiredRole`, `MantenimientoStatus` |
| **Sub-entities** | ~5 | `VehiculoResumido`, `EmpresaResumida`, `PlanResumido`, `RolResponse`, `PermissionResponse` |

### 5.2 Convenciones de tipos

- **Naming**: `<Entity>Request` (payload para POST/PUT), `<Entity>Response` (retorno del backend).
- **Optional fields**: las que pueden ser null en el backend se marcan como `field?: Type` o `field: Type | null`.
- **Nested objects**: se definen como interfaces separadas (e.g., `VehiculoResponse` incluye `tipoVehiculo: TipoVehiculoResponse`).
- **Paginacion**: `PageResponse<T> { content: T[], totalPages, totalElements, size, number }`.
- **Params**: `PageParams { page, perPage, sort?, sortOrder?, from?, to?, filter? }`.

### 5.3 Patron generics en CrudPage

```typescript
// CrudPage<TReq, TRes> es generico sobre los tipos Request y Response de cada entidad
interface CrudPageConfig<TReq, TRes> {
  title: string;              // "Marcas"
  singular: string;           // "Marca"
  description: string;
  permission: string;         // "MARCAS_READ"
  api: CrudApi<TReq, TRes>;   // { findAll, create, update, delete }
  columns: ColumnDef<TRes>[];
  formFields: FormFieldDef[];
  getFormDefaultValues: () => TReq;
  getFormValuesFromEntity: (entity: TRes) => TReq;
  getId: (entity: TRes) => number;
  getIsActive: (entity: TRes) => boolean;
}
```

---

## 6. Capa de API

### 6.1 `api/client.ts` — Instancia Axios

```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: inyecta JWT en header Authorization
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: si 401, limpia storage y redirige a /login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 6.2 `api/endpoints.ts` — 24 Objetos API

Cada objeto API agrupa los endpoints de una entidad:

```typescript
export const vehiculosApi = {
  findAll: (params?: PageParams) => apiClient.get<PageResponse<VehiculoResponse>>('/vehiculos', { params }),
  findByEmpresaId: (empresaId: number, params?: PageParams) => apiClient.get(`/vehiculos/empresa/${empresaId}`, { params }),
  findByTipoVehiculo: (tipoVehiculoId: number) => apiClient.get(`/vehiculos/tipo-vehiculo/${tipoVehiculoId}`),
  findByChofer: (choferId: number) => apiClient.get(`/vehiculos/chofer/${choferId}`),
  findSinChofer: () => apiClient.get('/vehiculos/sin-chofer'),
  reporteMovimientoMensual: (id: number, mes: number, anio: number) => apiClient.get(`/vehiculos/reporte-movimiento-mensual/${id}`, { params: { mes, anio } }),
  reporteMensualPdf: (id: number, mes: number, anio: number) => apiClient.get(`/recorridos/vehiculo/${id}/reporte-mensual/pdf`, { params: { mes, anio }, responseType: 'blob' }),
  reportePdf: (empresaId: number) => apiClient.get('/vehiculos/reporte-pdf', { params: { empresaId }, responseType: 'blob' }),
  create: (data: VehiculoRequest) => apiClient.post<VehiculoResponse>('/vehiculos', data),
  update: (id: number, data: VehiculoRequest) => apiClient.put<VehiculoResponse>(`/vehiculos/${id}`, data),
  delete: (id: number) => apiClient.delete(`/vehiculos/${id}`),
};
```

**Lista completa de 24 objetos API**: authApi, usersApi, rolesApi, permissionsApi, vehiculosApi, tiposVehiculoApi, tiposCombustibleApi, marcasApi, empresasApi, choferesApi, categoriasLicenciaApi, choferesCategoriasApi, currenciesApi, tarjetasCombustibleApi, recorridosApi, featuresApi, plansApi, provinciasApi, municipiosApi, subscriptionsApi, reportesTransporteApi, reportesMantenimientoApi, reportesAbastecimientoApi, reportesConsumoCombustibleApi.

### 6.3 Contrato `CrudApi<TReq, TRes>`

Todas las APIs de entidades CRUD cumplen el contrato:

```typescript
interface CrudApi<TReq, TRes> {
  findAll: (params?: PageParams) => Promise<AxiosResponse<PageResponse<TRes>>>;
  create: (data: TReq) => Promise<AxiosResponse<TRes>>;
  update: (id: number, data: TReq) => Promise<AxiosResponse<TRes>>;
  delete: (id: number) => Promise<AxiosResponse<void>>;
}
```

Esto permite que el hook `useCrud<TReq, TRes>` sea agnostico a la entidad.

---

## 7. Capa de Hooks y Contextos

### 7.1 `hooks/useCrud.ts` — Estado de Servidor Generico

Hook que abstrae el fetch/create/update/delete de cualquier entidad CRUD. Maneja loading, saving, error, paginacion y re-fetch automatico.

```typescript
export function useCrud<TReq, TRes>(
  api: CrudApi<TReq, TRes>,
  defaultParams?: Partial<PageParams>
): UseCrudReturn<TReq, TRes> {
  // State: data, loading, saving, error, totalPages, totalElements, page, size
  // Actions: fetchData, setPage, setSize, createItem, updateItem, deleteItem, clearError
  // Fallback errors (traducidos via i18n errors namespace):
  //   'Error al cargar los datos' → t('errors:crud.load')
  //   'Error al crear'           → t('errors:crud.create')
  //   'Error al actualizar'      → t('errors:crud.update')
  //   'Error al eliminar'        → t('errors:crud.delete')
}
```

**Politica de errores**: los mensajes del backend (`error.response.data.message`) se muestran crudos (no traducidos) — solo los fallbacks del front estan i18n.

### 7.2 `contexts/AuthContext.tsx` — Estado de Autenticacion

```typescript
interface AuthContextValue {
  user: UserResponse | null;
  empresa: EmpresaResponse | null;
  empresaId: number;
  loading: boolean;
  login: (email, password) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
}
```

**Flujo de autenticacion**:
1. `POST /auth/login` con email + password → retorna `{ token, userId, email }`
2. Almacena token + user en `localStorage`
3. `GET /auth/me` obtiene usuario completo con roles y permisos
4. Permisos se aplanan: `roles.flatMap(role => role.permissions)`
5. Cada request posterior incluye `Authorization: Bearer <token>`
6. Si 401 → interceptor limpia storage y redirige a `/login`

### 7.3 `contexts/ToastContext.tsx` — Notificaciones

```typescript
interface ToastContextValue {
  addToast: (toast: { type: 'success'|'error'|'warning'|'info'; title: string; message: string }) => void;
  removeToast: (id: number) => void;
}
```

- 4 tipos de toast con colores: success (verde), error (rojo), warning (amarillo), info (azul)
- Auto-dismiss configurable (default 4s)
- Stack vertical con animacion de entrada cubic-bezier
- Renderizado por `ToastContainer.tsx`

---

## 8. Capa de Componentes

### 8.1 Componentes Comunes (`components/common/`)

#### `CrudPage.tsx` (385 lineas) — Componente generico CRUD

El componente mas importante de la arquitectura. A partir de un objeto `CrudPageConfig<TReq, TRes>`, genera automaticamente:

- Tabla paginada con busqueda en memoria
- Formulario modal de creacion/edicion (con soporte de campos async select)
- Modal de confirmacion de eliminacion
- Estados de loading y empty
- Toasts de exito/error
- Badges de estado activo/inactivo

**Usado por**: ProvinciaPage, MunicipioPage, MarcaPage, TipoCombustiblePage, TipoVehiculoPage, CategoriaLicenciaPage, CurrencyPage, EmpresaPage, FeaturePage, PermisosPage, PlanPage (10+ paginas).

#### `PageHeader.tsx`

Layout estandar de pagina con `title`, `description` y slot para acciones (boton "Nuevo", search input).

#### `Pagination.tsx`

Paginacion con texto `Mostrando {{start}} a {{end}} de {{total}} resultados` (i18n + interpolacion).

#### `ProtectedRoute.tsx`

Guard de ruta por permiso. Verifica `isAuthenticated`, `hasPermission(permission)`, fallback a pagina "Acceso Denegado".

#### `SuperAdminRoute.tsx`

Guard exclusivo para SUPER_ADMIN (roles management, planes, features, suscripciones).

#### `ComingSoon.tsx`

Pagina placeholder para modulos pendientes de implementar.

### 8.2 Layout (`components/layout/`)

#### `MainLayout.tsx`

Shell de la aplicacion autenticada: renderiza `Sidebar` + `TopNavbar` + `<Outlet />`. Maneja estado de sidebar colapsado y menu mobile.

#### `Sidebar.tsx`

Menu lateral generado desde `navigationConfig` (objeto JS). Soporta:
- 4 secciones colapsables (Administracion, Catalogos, Reportes, Control de Transporte)
- Filtrado por rol del usuario (`getFilteredNavigation`)
- Modo colapsado en desktop, overlay en mobile
- Auto-expand de la seccion que contiene la ruta activa

#### `TopNavbar.tsx`

Barra superior con:
- Toggle de menu mobile
- Info de empresa actual
- **LanguageSwitcher** (selector ES/EN con persistencia)
- Dropdown de usuario (Perfil, Cambiar contrasena, Salir)

### 8.3 UI Atomicos (`components/ui/`)

- `Modal.tsx` — modal base con backdrop, tamanos sm/md/lg/xl
- `ConfirmModal.tsx` — modal de confirmacion con variantes danger/primary
- `ToastContainer.tsx` — renderiza stack de toasts activos
- `ProfileModal.tsx` — modal de perfil de usuario con info de suscripcion
- `ChangePasswordModal.tsx` — formulario de cambio de contrasena con validaciones
- `SearchableDropdown.tsx` — dropdown con busqueda async, usado para selects con muchos items

---

## 9. Capa de Paginas

### 9.1 Inventario de paginas (25 total)

| Modulo | Pagina | Tipo | Permisos | i18n Status |
|---|---|---|---|---|
| auth | LoginPage | custom | publico | ✅ migrada |
| dashboard | DashboardPage | custom | autenticado | ✅ migrada |
| catalogs | ProvinciaPage | config-only | SUPER_ADMIN | ✅ migrada |
| catalogs | MunicipioPage | config-only | SUPER_ADMIN | ✅ migrada |
| catalogs | MarcaPage | config-only | SUPER_ADMIN | ✅ migrada |
| catalogs | TipoCombustiblePage | config-only | SUPER_ADMIN | ✅ migrada |
| catalogs | TipoVehiculoPage | config-only | SUPER_ADMIN | ✅ migrada |
| catalogs | CategoriaLicenciaPage | config-only | SUPER_ADMIN | ✅ migrada |
| catalogs | CurrencyPage | config-only | SUPER_ADMIN | ✅ migrada |
| catalogs | EmpresaPage | config-only | SUPER_ADMIN | ✅ migrada |
| catalogs | FeaturePage | config-only | SUPER_ADMIN | ✅ migrada |
| catalogs | PlanPage | custom CRUD | SUPER_ADMIN | ✅ migrada |
| catalogs | TarjetaCombustiblePage | custom CRUD | ADMIN+ | ✅ migrada |
| admin | RolesPage | custom | SUPER_ADMIN | ✅ migrada |
| admin | UsuariosPage | custom | ADMIN+ | ✅ migrada |
| admin | PermisosPage | config-only | SUPER_ADMIN | ✅ migrada |
| admin | SubscriptionsPage | custom | SUPER_ADMIN | ✅ migrada |
| admin | ComprarPlanesPage | custom | ADMIN+ | ✅ migrada |
| vehiculos | VehiculosPage | custom | ADMIN+ | ✅ migrada (960 lineas) |
| choferes | ChoferesPage | custom | ADMIN+ | ✅ migrada (530 lineas) |
| recorridos | RecorridosPage | custom | autenticado | ✅ migrada (640 lineas) |
| reportes | ReporteConsumoVehiculoPage | custom | ADMIN+ | ✅ migrada |
| reportes | ReporteMantenimientoPage | custom | ADMIN+ | ✅ migrada |
| reportes | ReporteAbastecimientoPage | custom | ADMIN+ | ✅ migrada |
| reportes | ReporteConsumoCombustiblePage | custom | ADMIN+ | ✅ migrada |

### 9.2 Patron de pagina "config-only"

Las paginas que delegan en `CrudPage` solo definen un objeto `config` con strings ya traducidos:

```typescript
export default function MarcaPage() {
  const { t } = useTranslation(['catalogs', 'common']);

  const config: CrudPageConfig<MarcaRequest, MarcaResponse> = {
    title: t('catalogs:brand.title'),           // "Marcas"
    singular: t('catalogs:brand.singular'),     // "Marca"
    description: t('catalogs:brand.description'),
    permission: 'MARCAS_READ',
    api: marcasApi,
    columns: [...],
    formFields: [...],
    // ...
  };

  return <CrudPage config={config} />;
}
```

### 9.3 Patron de pagina "custom"

Las paginas custom (Vehiculos, Choferes, Recorridos, Admin, Reportes) tienen su propia tabla, formulario y modales. Usan `useTranslation(['namespace', 'common', 'crud'])` para acceder a multiples namespaces.

---

## 10. Sistema de Internacionalizacion (i18n)

### 10.1 Stack

- **`i18next`** ^26.4.2 — core i18n
- **`react-i18next`** ^17.0.13 — binding React con hook `useTranslation`
- **`i18next-browser-languagedetector`** ^8.2.1 — deteccion automatica de idioma

### 10.2 Inicializacion (`src/i18n/index.ts`)

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import './types'; // strong typing for keys (autocompletion + compile-time validation)

import commonEs from '../locales/es/common.json';
// ... import de los 12 namespaces x 2 idiomas

void i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources: { es: {...}, en: {...} },
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    nonExplicitSupportedLngs: true,  // es-ES, es-CU, es-MX → es
    load: 'languageOnly',
    interpolation: { escapeValue: false },  // React ya escapa
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    defaultNS: 'common',
    ns: ['common','navigation','auth','dashboard','crud','catalogs',
          'vehiculos','choferes','recorridos','admin','reportes','errors'],
    react: { useSuspense: false },
  });
```

### 10.3 Tipado fuerte (`src/i18n/types.ts`)

```typescript
import 'i18next';
import type common from '../locales/es/common.json';
import type navigation from '../locales/es/navigation.json';
// ... 12 namespaces

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      navigation: typeof navigation;
      // ... 12 namespaces
    };
  }
}
```

**Beneficios**:
- Autocompletado VSCode al escribir `t('namespace:clave.subclave')`
- Validacion en compilacion: si una clave no existe, TypeScript marca error
- Refactor seguro: renombrar una clave en el JSON propaga el cambio a TS

### 10.4 Estrategia de namespaces

12 namespaces por modulo, evitando un archivo gigante:

| Namespace | Cobertura | Strings aprox. |
|---|---|---:|
| `common` | botones, estados, validaciones, meses, unidades | ~80 |
| `navigation` | menu lateral + topnavbar | ~30 |
| `auth` | login, perfil, cambio de contrasena | ~50 |
| `dashboard` | KPIs, variacion, semaforos | ~40 |
| `crud` | strings compartidos del CrudPage | ~22 |
| `catalogs` | 11 catalogos config-only | ~140 |
| `vehiculos` | VehiculosPage | ~110 |
| `choferes` | ChoferesPage | ~60 |
| `recorridos` | RecorridosPage | ~70 |
| `admin` | roles, usuarios, permisos, planes, suscripciones, comprar planes | ~280 |
| `reportes` | 4 reportes operacionales | ~205 |
| `errors` | fallbacks de error del front | ~10 |
| **TOTAL** | | **~1.097** |

### 10.5 Uso en componentes

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation(['vehiculos', 'common', 'crud']);

  return (
    <PageHeader title={t('vehiculos:title')} description={t('vehiculos:description')}>
      <button className="btn-primary">{t('crud:actions.new')}</button>
    </PageHeader>
  );
}
```

### 10.6 LanguageSwitcher

Integrado en `TopNavbar.tsx`:

```tsx
function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <div>
      <button onClick={() => i18n.changeLanguage('es')}>ES</button>
      <button onClick={() => i18n.changeLanguage('en')}>EN</button>
    </div>
  );
}
```

Persistencia automatica via `i18next-browser-languagedetector` (clave `i18nextLng`).

### 10.7 Politica de mensajes del backend

- Los mensajes del backend (`error.response.data.message`) **NO se traducen** en el front
- Solo se traducen los fallbacks del front (definidos en `errors.json`)
- Rationale: sin un campo `errorCode` estable en la API, mapear mensajes del backend a claves i18n es fragil
- **Trabajo futuro**: coordinar con backend para agregar `errorCode` y permitir traduccion completa

### 10.8 IDs tecnicos (no traducidos)

Los identificadores del contrato RBAC se muestran crudos:
- `ADMIN`, `SUPER_ADMIN` (roles)
- `USUARIOS_CREATE`, `VEHICULOS_READ`, `MARCAS_READ` (permisos)

Estos son parte del contrato con el backend y traducirlos romperia la validacion RBAC.

---

## 11. Helpers de Formato y Status

### 11.1 `utils/format.ts` (115 lineas)

Centraliza las funciones de formato para que sean sensibles al locale activo:

```typescript
import i18n from '@/i18n';

export type DateFormat = 'short' | 'long' | 'iso' | 'monthYear' | 'monthLong';

export function formatDate(date, format = 'short'): string {
  const locale = i18n.language || 'es';
  return new Intl.DateTimeFormat(locale, {...}).format(date);
}

export function formatNumber(value, decimals = 0): string {
  return new Intl.NumberFormat(i18n.language || 'es', {...}).format(value);
}

export function formatCurrency(value, currency = 'USD'): string {
  return new Intl.NumberFormat(i18n.language || 'es', { style: 'currency', currency }).format(value);
}

export function formatPercent(value, decimals = 1): string {
  return new Intl.NumberFormat(i18n.language || 'es', {
    style: 'percent', signDisplay: 'exceptZero',
  }).format(value / 100);
}

export function getMonthName(monthNumber: number): string {
  return new Intl.DateTimeFormat(i18n.language || 'es', { month: 'long' })
    .format(new Date(2024, monthNumber - 1, 1));
}

export function getMonthNames(): { value: number; label: string }[] {
  return Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: getMonthName(i + 1) }));
}
```

**Reemplaza**: 11+ helpers locales duplicados (4 `formatDate`, 3 `formatCurrency`, 4 `formatNumber`) que tenian locales hardcoded (`es-ES`, `es-CU`, `undefined`).

### 11.2 `utils/statusLabels.ts` (70 lineas)

Hooks que consolidan mapas de status duplicados:

```typescript
export function useSubscriptionStatusInfo() {
  const { t } = useTranslation('admin');
  return (status: SubscriptionStatus): { label: string; badgeClass: string } => {
    // mapa interno con clave 'admin:subscription.status.TRIAL' etc.
    return { label: t(entry.key), badgeClass: entry.badgeClass };
  };
}

export function useMantenimientoStatusInfo() {
  const { t } = useTranslation('reportes');
  return (estado: MantenimientoStatus): { label: string; bg: string; text: string; iconClass: string } => {
    // mapa interno con clave 'reportes:mantenimiento.status.VENCIDO' etc.
    return { label: t(entry.key), ...entry };
  };
}
```

**Reemplaza**: 3 mapas `statusLabels` duplicados en `ProfileModal`, `SubscriptionsPage`, `ComprarPlanesPage`, `ReporteMantenimientoPage` con discrepancias (e.g., `'Trial'` vs `'Prueba'`).

---

## 12. Sistema de Diseno

### 12.1 Tokens de color

| Token | Valor | Uso |
|---|---|---|
| `primary-600` | `#418AD1` | Botones primarios, links, foco |
| `primary-700` | `#3470AD` | Hover de botones primarios |
| `primary-50` | `#E8F1FA` | Backgrounds sutiles (badges) |
| `sidebar` | `#16202E` | Fondo del sidebar |
| `sidebar-active` | `#418AD1` | Item activo del sidebar |
| Background general | `#F8F9FB` | Fondo de la app |
| Success | `#10B981` / `#059669` | Badges activos, toast success |
| Error | `#EF4444` / `#DC2626` | Badges inactivos, toast error |
| Warning | `#F59E0B` | Badges warning, toast warning |
| Info | `#3B82F6` | Toast info |

### 12.2 Componentes de design system (`index.css` @layer components)

| Clase | Descripcion |
|---|---|
| `btn-primary` | Boton azul con hover oscuro |
| `btn-secondary` | Boton blanco con borde gris |
| `btn-danger` | Boton rojo para acciones destructivas |
| `input-field` | Input con borde, foco ring azul |
| `card` | Tarjeta con sombra sutil y borde |
| `table-header` | Encabezado de tabla fondo gris claro |
| `table-cell` | Celda de tabla con borde inferior |
| `badge-active` | Badge verde "Activo" |
| `badge-inactive` | Badge rojo "Inactivo" |
| `badge-warning` | Badge amarillo (estados trial/proximo) |

### 12.3 Tipografia

- **Familia**: **Inter** (variable font) con fallback a `system-ui, -apple-system, sans-serif`
- **Font smoothing**: antialiased habilitado
- **Tamanos**: escalas Tailwind (text-xs, text-sm, text-base, text-lg, text-xl, text-2xl)

### 12.4 Iconografia

- **Biblioteca**: `lucide-react` (iconos SVG tree-shakeable)
- **Uso**: cada icono se importa individualmente: `import { Plus, Pencil, Trash2 } from 'lucide-react'`
- **Tamanos**: `w-4 h-4`, `w-5 h-5`, `w-6 h-6` (utility classes Tailwind)

---

## 13. Seguridad y RBAC

### 13.1 Modelo RBAC

**2 niveles** de roles:

| Rol | ID en backend | Acceso |
|---|---|---|
| `SUPER_ADMIN` | `SUPER_ADMIN` | Acceso total (empresas, planes, features, suscripciones, todos los catalogos) |
| `ADMIN` | alias `ADMINISTRADOR` | Administrador de empresa (vehiculos, choferes, usuarios, recorridos, reportes) |

**Permisos granulares** por entidad:

| Permiso | Acceso |
|---|---|
| `VEHICULOS_READ` | Ver listado de vehiculos |
| `USUARIOS_CREATE` | Crear usuarios |
| `MARCAS_READ` | Ver catalogo de marcas |
| `EMPRESAS_READ` | Ver empresas |
| `...` (50+ permisos) | Cada entidad tiene 4 permisos: `_READ`, `_CREATE`, `_UPDATE`, `_DELETE` |

### 13.2 Tabla de rutas protegidas

| Ruta | Permiso | Roles con acceso |
|---|---|---|
| `/` (Dashboard) | autenticado | ADMIN, SUPER_ADMIN |
| `/vehiculos` | `VEHICULOS_READ` | ADMIN, SUPER_ADMIN |
| `/choferes` | `CHOFERES_READ` | ADMIN, SUPER_ADMIN |
| `/recorridos` | (cualquier autenticado) | ADMIN, SUPER_ADMIN |
| `/usuarios` | `USUARIOS_READ` | ADMIN, SUPER_ADMIN |
| `/roles` | `ROLES_READ` | SUPER_ADMIN |
| `/permisos` | `PERMISOS_READ` | SUPER_ADMIN |
| `/empresas` | `EMPRESAS_READ` | SUPER_ADMIN |
| `/marcas` | `MARCAS_READ` | SUPER_ADMIN |
| `/tipos-vehiculo` | `TIPOS_VEHICULO_READ` | SUPER_ADMIN |
| `/tipos-combustible` | `TIPOS_COMBUSTIBLE_READ` | SUPER_ADMIN |
| `/categorias-licencia` | `CATEGORIAS_LICENCIA_READ` | SUPER_ADMIN |
| `/provincias` | `PROVINCIAS_READ` | SUPER_ADMIN |
| `/municipios` | `MUNICIPIOS_READ` | SUPER_ADMIN |
| `/monedas` | `CURRENCIES_READ` | SUPER_ADMIN |
| `/tarjetas-combustible` | `TARJETAS_COMBUSTIBLE_READ` | ADMIN, SUPER_ADMIN |
| `/features` | SUPER_ADMIN exclusivo | SUPER_ADMIN |
| `/planes` | SUPER_ADMIN exclusivo | SUPER_ADMIN |
| `/suscripciones` | SUPER_ADMIN exclusivo | SUPER_ADMIN |
| `/comprar-plan` | `SUBSCRIPTIONS_READ` | ADMIN, SUPER_ADMIN |
| `/reportes/consumo-vehiculo` | `ADMIN` | ADMIN, SUPER_ADMIN |
| `/reportes/mantenimiento` | `ADMIN` | ADMIN, SUPER_ADMIN |
| `/reportes/abastecimiento` | `ADMIN` | ADMIN, SUPER_ADMIN |
| `/reportes/consumo-combustible` | `ADMIN` | ADMIN, SUPER_ADMIN |

### 13.3 Mecanismos de seguridad

| Mecanismo | Implementacion |
|---|---|
| Autenticacion | JWT Bearer en header `Authorization` |
| Almacenamiento | `localStorage` para token + user |
| Auto-logout | Interceptor 401 limpia storage y redirige a `/login` |
| Proteccion de rutas | `ProtectedRoute` verifica permisos antes de renderizar |
| Menu filtrado | Items del sidebar ocultos si el rol no tiene permiso |
| RBAC granular | Permisos por entidad (`VEHICULOS_READ`) + roles (`ADMIN`, `SUPER_ADMIN`) |
| Validacion formularios | Campos `required` nativos HTML + tipado TypeScript |
| XSS protection | React escapea por defecto; i18next con `escapeValue: false` (seguro porque React) |

---

## 14. Flujos de Autenticacion

### 14.1 Login

```
1. Usuario envia email + password → POST /auth/login
2. Backend retorna { token, userId, email }
3. Frontend almacena token + user en localStorage
4. GET /auth/me obtiene usuario completo con roles y permisos
5. Permisos se aplanan: roles.flatMap(role => role.permissions)
6. Cada request posterior incluye Authorization: Bearer <token>
7. Navigate to / (dashboard)
```

### 14.2 Logout

```
1. Usuario click en "Salir" del TopNavbar dropdown
2. POST /auth/logout (opcional, backend invalida token)
3. Limpiar localStorage (token, user)
4. Navigate to /login (replace)
```

### 14.3 Auto-logout (401)

```
1. Cualquier request recibe 401 (token expirado o invalido)
2. Axios response interceptor captura el error
3. Limpiar localStorage
4. window.location.href = '/login' (recarga completa para limpiar estado React)
```

### 14.4 Cambio de contrasena

```
1. Usuario click en "Cambiar contrasena" del dropdown
2. Modal pide: contrasena actual, nueva, confirmacion
3. Validaciones front:
   - Todos los campos obligatorios
   - Nueva = confirmacion
   - Nueva longitud >= 4
4. PUT /auth/cambiar-password con { userId, passwordAnterior, nuevaPassword, confirmacionPassword }
5. Toast de exito/error
```

---

## 15. Integracion de Pago Enzona

### 15.1 Vision General

El sistema integra la pasarela de pago **Enzona** para permitir a las empresas comprar planes de suscripcion mediante pagos con QR. La integracion sigue un patron asincrono: el frontend crea un pago, recibe un codigo QR, lo muestra al usuario, y hace polling del estado hasta que el pago se confirma o falla.

### 15.2 Stack de Integracion

| Componente | Rol |
|---|---|
| `paymentsApi` (endpoints.ts) | Cliente HTTP tipado para los 8 endpoints de pago |
| `PaymentCreateRequest` / `PaymentResponse` | Tipos TypeScript del contrato |
| `ComprarPlanesPage.tsx` | UI: boton Comprar, modal QR, polling, acciones |
| Backend Spring Boot | Intermediario con la API de Enzona |
| Enzona API (externa) | Pasarela que genera QR y procesa pagos |

### 15.3 Tipos de Pago

```typescript
// src/types/index.ts
export type PaymentStatus =
  | 'PENDIENTE'    // Pago creado, esperando QR
  | 'QR_GENERADO'  // QR listo para escanear
  | 'PAGADO'       // Pago confirmado
  | 'FALLIDO'      // Error en pasarela
  | 'EXPIRADO'     // QR expiro sin pago
  | 'CANCELADO';   // Usuario cancelo

export type PaymentType =
  | 'NUEVA_SUSCRIPCION'  // Primera compra
  | 'RENOVACION'         // Renovar plan existente
  | 'UPGRADE';           // Mejorar plan (futuro)

export interface PaymentCreateRequest {
  planId: number;
  type: PaymentType;
  subscriptionId?: number;
}

export interface PaymentResponse {
  id: number;
  empresa: EmpresaResumidaResponse;
  plan: PlanResumidoResponse;
  subscriptionId?: number;
  amount: number;
  currency: string;
  description?: string;
  status: PaymentStatus;
  type: PaymentType;
  qrCode?: string;           // QR como string (fallback)
  qrImageBase64?: string;    // QR como imagen PNG base64
  externalTransactionId?: string;
  paidAt?: string;
  expiresAt?: string;
  errorMessage?: string;
  retryCount: number;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  externalStatus?: string;
  confirmed: boolean;
}
```

### 15.4 API Client (`paymentsApi`)

```typescript
// src/api/endpoints.ts
export const paymentsApi = {
  create: (data: PaymentCreateRequest) =>
    apiClient.post<PaymentResponse>('/payments', data),

  findById: (id: number) =>
    apiClient.get<PaymentResponse>(`/payments/${id}`),

  getStatus: (id: number) =>                   // Sincroniza con Enzona
    apiClient.get<PaymentResponse>(`/payments/${id}/status`),

  getLocalStatus: (id: number) =>              // Estado local sin consultar Enzona
    apiClient.get<PaymentResponse>(`/payments/${id}/local-status`),

  retry: (id: number) =>                        // Genera nuevo QR
    apiClient.post<PaymentResponse>(`/payments/${id}/retry`),

  cancel: (id: number) =>
    apiClient.post<PaymentResponse>(`/payments/${id}/cancel`),

  findByEmpresaId: (empresaId: number, params?: PageParams) =>
    apiClient.get<PageResponse<PaymentResponse>>(`/payments/empresa/${empresaId}`, { params }),

  getMyCompany: () =>
    apiClient.get<PaymentResponse>('/payments/my-company'),
};
```

### 15.5 Flujo de Pago Completo

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────┐     ┌─────────┐
│  Usuario     │     │  Frontend (React) │     │  Backend    │     │  Enzona │
│  (browser)   │     │  ComprarPlanes   │     │  Spring Boot│     │  API    │
└──────┬───────┘     └────────┬─────────┘     └──────┬──────┘     └────┬────┘
       │                      │                      │                  │
       │ 1. Click "Comprar"    │                      │                  │
       ├─────────────────────►│                      │                  │
       │                      │ 2. POST /payments    │                  │
       │                      ├─────────────────────►│                  │
       │                      │                      │ 3. Crear pago    │
       │                      │                      ├─────────────────►│
       │                      │                      │ 4. QR + status   │
       │                      │                      │◄─────────────────┤
       │                      │ 5. PaymentResponse   │                  │
       │                      │   (qrImageBase64)    │                  │
       │                      │◄─────────────────────┤                  │
       │ 6. Abre modal QR     │                      │                  │
       │◄─────────────────────┤                      │                  │
       │                      │                      │                  │
       │ 7. Escanea QR con    │                      │                  │
       │    app bancaria      │                      │                  │
       ├──────────────────────────────────────────────────────────────►│
       │                      │                      │                  │
       │                      │ 8. Polling cada 5s   │                  │
       │                      │    GET /payments/{id}/status          │
       │                      ├─────────────────────►│ 9. Consulta     │
       │                      │                      ├─────────────────►│
       │                      │                      │ 10. Status       │
       │                      │                      │◄─────────────────┤
       │                      │ 11. PaymentResponse  │                  │
       │                      │     status=PAGADO    │                  │
       │                      │◄─────────────────────┤                  │
       │                      │                      │                  │
       │                      │ 12. Detiene polling  │                  │
       │                      │ 13. Refresca sub     │                  │
       │                      │ 14. Toast exito      │                  │
       │ 15. Muestra "Cerrar" │                      │                  │
       │◄─────────────────────┤                      │                  │
       │                      │                      │                  │
```

### 15.6 Modal QR — Estructura UI

El modal de pago (`ComprarPlanesPage.tsx`) incluye:

1. **Titulo**: "Pago Enzona" (`admin:payment.modal.title`)
2. **Subtitulo**: Instrucciones para escanear (`admin:payment.modal.subtitle`)
3. **Imagen QR**: `<img>` con `src={data:image/png;base64,...}` (prefijo auto-agregado)
   - Fallback: si no hay `qrImageBase64` pero si `qrCode`, muestra el codigo textual
   - Fallback: si no hay ninguno, muestra spinner de carga
4. **Badge de estado**: Icono + color segun `PaymentStatus` (6 estados)
5. **Detalles del pago**: importe, plan, ID transaccion, fecha expiracion
6. **Mensaje de error**: si `errorMessage` esta presente
7. **Boton "Copiar QR"**: copia `qrCode` al portapapeles via `navigator.clipboard`
8. **Acciones contextuales**:
   - Si `QR_GENERADO` o `PENDIENTE`: "Verificar estado" + "Cancelar pago"
   - Si `FALLIDO` o `EXPIRADO`: "Reintentar pago" + "Cancelar pago"
   - Si `PAGADO`: "Cerrar"
   - Si `CANCELADO`: sin acciones (solo cerrar modal)

### 15.7 Polling Automatico

```typescript
// ComprarPlanesPage.tsx (extracto)
const startPolling = useCallback((paymentId: number) => {
  stopPolling();
  pollRef.current = setInterval(async () => {
    try {
      const res = await paymentsApi.getStatus(paymentId);
      setPayment(res.data);
      if (res.data.status === 'PAGADO') {
        stopPolling();
        addToast({ type: 'success', message: t('admin:payment.toast.paid') });
        // Refrescar suscripcion para reflejar nuevo plan
        subscriptionsApi.getMyCompanySubscription()
          .then((r) => setSubscription(r.data))
          .catch(() => {});
      } else if (['EXPIRADO', 'FALLIDO', 'CANCELADO'].includes(res.data.status)) {
        stopPolling();
        // Toast apropiado segun estado
      }
    } catch {
      // silent — keep polling
    }
  }, 5000); // cada 5 segundos
}, [stopPolling, addToast, t]);

// Cleanup al cerrar modal o desmontar
useEffect(() => {
  return () => stopPolling();
}, [stopPolling]);
```

**Caracteristicas del polling**:
- Intervalo: 5 segundos
- Detencion automatica en estados terminales (PAGADO, EXPIRADO, FALLIDO, CANCELADO)
- Cleanup en `useEffect` return (desmonte del componente)
- Cleanup al cerrar el modal manualmente
- Refresco automatico de la suscripcion al detectar PAGADO
- Errores silenciosos (no interrumpen el polling)

### 15.8 Renderizado del QR (Prefijo base64)

El backend retorna `qrImageBase64` como un string base64 puro sin el prefijo `data:image/png;base64,`. Sin ese prefijo, el navegador no puede renderizar la imagen. El frontend lo agrega automaticamente:

```tsx
<img
  src={payment.qrImageBase64.startsWith('data:')
    ? payment.qrImageBase64
    : `data:image/png;base64,${payment.qrImageBase64}`}
  alt="QR Enzona"
  className="w-64 h-64 border-2 border-gray-200 rounded-lg"
/>
```

**Idempotente**: si el backend en el futuro incluye el prefijo `data:`, no se duplica.

### 15.9 i18n del Modulo de Pago

Se agregaron 40+ claves en `admin.json` (seccion `payment`) para ambos idiomas:

```json
{
  "payment": {
    "modal": {
      "title": "Pago Enzona",
      "subtitle": "Escanea el codigo QR con tu app bancaria...",
      "amountLabel": "Importe",
      "planLabel": "Plan",
      "statusLabel": "Estado",
      "expiresAtLabel": "Expira en",
      "transactionIdLabel": "ID de transaccion",
      "copyQr": "Copiar codigo QR",
      "retryPayment": "Reintentar pago",
      "cancelPayment": "Cancelar pago",
      "checkStatus": "Verificar estado",
      "closeModal": "Cerrar"
    },
    "status": {
      "PENDIENTE": "Pendiente",
      "QR_GENERADO": "QR Generado",
      "PAGADO": "Pagado",
      "FALLIDO": "Fallido",
      "EXPIRADO": "Expirado",
      "CANCELADO": "Cancelado"
    },
    "type": {
      "NUEVA_SUSCRIPCION": "Nueva suscripcion",
      "RENOVACION": "Renovacion",
      "UPGRADE": "Mejora de plan"
    },
    "toast": {
      "creatingPayment": "Generando pago...",
      "paymentCreated": "Pago creado. Escanea el QR para continuar.",
      "createError": "No se pudo generar el pago.",
      "statusUpdated": "Estado del pago actualizado",
      "statusError": "No se pudo verificar el estado.",
      "cancelled": "Pago cancelado",
      "cancelError": "No se pudo cancelar el pago.",
      "retried": "Pago reintentado. Escanea el nuevo QR.",
      "retryError": "No se pudo reintentar el pago.",
      "paid": "¡Pago confirmado! Su suscripcion ha sido activada.",
      "expired": "El pago ha expirado.",
      "failed": "El pago ha fallado. Intente nuevamente."
    }
  }
}
```

### 15.10 Endpoints Backend

| Metodo | Endpoint | Frontend usa | Descripcion |
|--------|----------|--------------|-------------|
| `POST` | `/api/payments` | Si (`create`) | Crear pago, recibe QR |
| `GET` | `/api/payments/{id}` | Si (`findById`) | Obtener pago por ID |
| `GET` | `/api/payments/{id}/status` | Si (`getStatus`) | Sincronizar con Enzona |
| `GET` | `/api/payments/{id}/local-status` | Si (`getLocalStatus`) | Estado local (sin Enzona) |
| `POST` | `/api/payments/{id}/retry` | Si (`retry`) | Reintentar (nuevo QR) |
| `POST` | `/api/payments/{id}/cancel` | Si (`cancel`) | Cancelar pago |
| `GET` | `/api/payments/empresa/{empresaId}` | Si (`findByEmpresaId`) | Listar por empresa |
| `GET` | `/api/payments/my-company` | Si (`getMyCompany`) | Pago de mi empresa |
| `POST` | `/api/payments/webhook/enzona` | No (backend only) | Webhook de Enzona |

> **Nota**: El webhook `POST /api/payments/webhook/enzona` es llamado por Enzona al backend directamente (no por el frontend). El backend actualiza el estado del pago y el frontend lo detecta via polling.

---

## 16. Estrategia de Branching

### 16.1 Ramas

| Branch | Proposito | Proteccion |
|---|---|---|
| `main` | Produccion | No push directo |
| `developFT` | Features generales | Merge desde PR |
| `developSuscription` | Suscripciones, planes, dashboard, i18n | Merge desde PR |
| `feature/i18n` | Implementacion de i18n (este PR) | Base para PR #2 |

### 16.2 Convencion de commits

Se sigue el estandar **Conventional Commits**:

- `feat:` — Nueva funcionalidad
- `fix:` — Correccion de bug
- `refactor:` — Refactorizacion sin cambio funcional
- `chore:` — Tareas de mantenimiento (deps, config)
- `docs:` — Documentacion

### 16.3 Workflow de PR

```
feature/i18n ────► developSuscription ────► main (produccion)
   ↑ PR #2            ↑ merge directo
```

1. Crear branch `feature/<topic>` desde `developSuscription`
2. Commits con prefijo `feat:` / `fix:` / etc.
3. Push a origin
4. Crear PR contra `developSuscription` con descripcion detallada
5. Review + CI green (lint + build + tsc)
6. Merge squash o merge commit

---

## 17. Decisiones Arquitectonicas (ADRs)

### AD-01: Generics sobre Code Generation

**Decision**: Implementar `CrudPage<TReq, TRes>` como componente generico en vez de generar codigo por entidad (Plop/Hygen).

**Rationale**: Un componente generico es mantenible en un solo lugar, tipado en compilacion, y extensible sin modificar codigo existente. La alternativa generaria 15+ archivos duplicados que divergerian con el tiempo.

### AD-02: React Context sobre Redux

**Decision**: Usar React Context para estado global (auth, toasts) en vez de Redux/Zustand.

**Rationale**: El estado global es minimal (user + toasts). Redux anadiria complejidad innecesaria (actions, reducers, selectors, middleware) para 2 slices. Si la app crece, se puede migrar incrementalmente.

### AD-03: Server-side Pagination sobre Client-side

**Decision**: La paginacion se maneja en el backend (Spring Data Page) con parametros `page`, `perPage`, `sort`.

**Rationale**: Con flotas de 1000+ vehiculos, cargar todos en memoria degradaria el rendimiento. Server-side pagination escala con el tamano de datos.

### AD-04: Config-Driven Navigation

**Decision**: El menu lateral se genera desde `navigationConfig` (objeto JS) en vez de rutas anidadas en JSX.

**Rationale**: Centraliza la configuracion, facilita el filtrado por rol, y permite agregar secciones/items sin tocar el componente `Sidebar`.

### AD-05: Tailwind CSS sobre CSS-in-JS

**Decision**: Tailwind CSS 4 con plugin Vite nativo en vez de styled-components/emotion.

**Rationale**: Tailwind elimina CSS muerto automaticamente (purge), no agrega runtime JS, y su modelo utility-first acelera el desarrollo. El plugin `@tailwindcss/vite` ofrece HMR instantaneo sin PostCSS.

### AD-06: Axios sobre Fetch

**Decision**: Axios como HTTP client en vez de la Fetch API nativa.

**Rationale**: Axios ofrece interceptores (esencial para JWT y 401), transformacion automatica de JSON, cancelacion de requests, y mejor manejo de errores. La Fetch API requeriria un wrapper para igualar funcionalidad.

### AD-07: Strict TypeScript

**Decision**: `strict: true` + `noUncheckedIndexedAccess` + `noUnusedLocals` + `noUnusedParameters` + `noFallthroughCasesInSwitch`.

**Rationale**: La seguridad en compilacion previene bugs en runtime. `noUncheckedIndexedAccess` fuerza a manejar `undefined` al indexar arrays/objetos, eliminando una categoria completa de bugs.

### AD-08: Vite sobre Webpack

**Decision**: Vite como bundler en vez de Create React App (Webpack).

**Rationale**: Vite ofrece HMR 10-100x mas rapido (ESM nativo), build optimizado con Rollup, y configuracion minimal. CRA esta deprecado y Webpack es excesivamente lento para proyectos medianos.

### AD-09: react-i18next sobre alternativas

**Decision**: Adoptar `react-i18next` (`i18next` core + `react-i18next` binding + `i18next-browser-languagedetector`).

**Rationale**: Estandar de facto en el ecosistema React (>5M descargas/semana). Soporta namespaces, interpolacion, pluralizacion, formato, lazy loading, deteccion de idioma, fallback. API con hook `useTranslation()` compatible con React 19 y functional components.

### AD-10: Carga sincrona de JSON (sin HTTP backend)

**Decision**: Los archivos JSON de traduccion se importan como modulos ES en el bundle inicial, no se cargan via HTTP backend.

**Rationale**: La app tiene ~1.097 strings; los JSON pesan ~30-40 KB por idioma (~10 KB gzip). Evita peticiones HTTP que retrasen el primer render con texto (FOUC — "flash of untranslated content"). Si en el futuro el volumen crece >5.000 strings, se puede migrar a lazy loading por namespace.

### AD-11: Deteccion de idioma con persistencia

**Decision**: Usar `i18next-browser-languagedetector` con orden: `localStorage → navigator → htmlTag → fallback`.

**Rationale**: Respeta la eleccion del usuario (localStorage), usa el idioma del navegador en primera visita, y como fallback usa el `<html lang>` o `es`.

### AD-12: Estrategia de namespaces por modulo

**Decision**: 12 namespaces funcionales en vez de un solo archivo gigante.

**Rationale**: Mejor organizacion del codigo (~1.097 strings en un solo archivo seria inmanejable). Permite rastrear autoria y ownership por modulo. Permite lazy loading futuro si se requiere.

### AD-13: Locale principal `es` (sin region)

**Decision**: Usar el codigo ISO 639-1 `es` (sin region) como locale principal.

**Rationale**: Simplifica la deteccion: el navegador envia `es`, `es-ES`, `es-MX`, etc. i18next con `load: 'languageOnly'` los normaliza a `es`. La ortografia canonica es-ES (con tildes) es universalmente comprensible en hispanoamerica.

### AD-14: Formato de numeros/fechas via `Intl` con locale activo

**Decision**: Centralizar todo el formateo en `utils/format.ts` que lee `i18next.language` y usa `Intl.NumberFormat` / `Intl.DateTimeFormat`.

**Rationale**: Elimina las 11 funciones duplicadas detectadas. Garantiza que al cambiar de idioma, los numeros/fechas se reformatean consistentemente. `Intl` es nativo del navegador.

### AD-15: Politica de mensajes del backend

**Decision**: Los mensajes del backend (`error.response.data.message`) **no se traducen** en el front; se muestran crudos.

**Rationale**: Sin un campo `errorCode` estable en la API, mapear mensajes del backend a claves i18n es fragil (cualquier cambio de texto en el backend rompe la traduccion). El 80% de los errores visibles son fallbacks del front.

### AD-16: IDs tecnicos no se traducen

**Decision**: Los strings `ADMIN`, `SUPER_ADMIN`, `USUARIOS_CREATE`, etc. se muestran crudos.

**Rationale**: Son identificadores tecnicos usados para coincidir con permisos en el backend. Traducirlos romperia el contrato RBAC.

### AD-17: Sin `I18nextProvider` explicito

**Decision**: Inicializar i18next con `initReactI18next` y dejar que su contexto se propague globalmente. No agregar `<I18nextProvider>` al arbol de React.

**Rationale**: react-i18next expone el contexto por defecto una vez inicializado. Agregar un provider extra es redundante y ensucia `App.tsx`.

### AD-18: Tipado fuerte de claves i18n

**Decision**: Crear `src/i18n/types.ts` con `CustomTypeOptions` que importa los tipos de los 12 namespaces JSON.

**Rationale**: Autocompletado VSCode para claves i18n y validacion en compilacion cuando una clave no existe o esta mal escrita. Refactor seguro: renombrar una clave en el JSON propaga el cambio a TS.

### AD-18: Polling para Deteccion de Estado de Pago

**Decision**: Usar polling con `setInterval` cada 5 segundos para detectar cambios de estado del pago Enzona, en lugar de WebSocket o Server-Sent Events.

**Rationale**: El polling es la solucion mas simple y compatible con el backend REST existente. No requiere infraestructura adicional (WebSocket server o SSE). El intervalo de 5s ofrece un balance entre responsividad y carga del servidor. El cleanup se maneja correctamente via `useRef` + `useEffect` para evitar memory leaks. Alternativas como WebSocket serian mas eficientes pero requieren soporte backend que no esta disponible actualmente.

### AD-19: Prefijo `data:image/png;base64,` Auto-Agregado

**Decision**: Agregar automaticamente el prefijo `data:image/png;base64,` al atributo `src` del `<img>` del QR cuando el backend no lo incluye.

**Rationale**: El backend retorna `qrImageBase64` como base64 puro sin prefijo data URI. El navegador necesita el prefijo para interpretar el contenido como imagen. El chequeo `startsWith('data:')` hace que el fix sea idempotente — si el backend cambia y empieza a retornar el data URI completo, no se duplica el prefijo. Esto desacopla el frontend de cambios en el backend.

### AD-20: Locale JSONs Co-located en src/locales

**Decision**: Mover los archivos JSON de traduccion de `public/locales/` a `src/locales/`.

**Rationale**: Los JSON de i18n nunca se fetchean en runtime — se importan como modulos ES en el bundle. Tenerlos en `public/` implicaba que Vite los servia como archivos estaticos (innecesario) y requeria `include: ["public/locales"]` en tsconfig. Al moverlos a `src/locales/`, quedan co-located con el codigo que los importa (`src/i18n/`), el tsconfig se simplifica a `include: ["src"]`, y la estructura del proyecto es mas limpia.

---

## 18. Metricas del Proyecto

| Metrica | Valor |
|---|---|
| Total de archivos `.tsx`/`.ts` en `src/` | 55 |
| Lineas de codigo TypeScript/TSX | 10.817 |
| Interfaces/tipos exportados | 70 (incluye 4 tipos de Payment) |
| Objetos API en `endpoints.ts` | 25 (incluye `paymentsApi`) |
| Paginas | 25 (1 auth + 1 dashboard + 11 catalogs + 5 admin + 1 vehiculos + 1 choferes + 1 recorridos + 4 reportes) |
| Componentes compartidos | 15 (6 common + 3 layout + 6 ui) |
| Custom Hooks | 1 (`useCrud`) |
| Context Providers | 2 (`AuthContext`, `ToastContext`) |
| Items de navegacion | 23 (en 4 secciones) |
| Namespaces i18n | 12 |
| Archivos JSON de traduccion | 24 (12 namespaces × 2 idiomas) en `src/locales/{es,en}/` |
| Strings i18n traducidos | ~1.137 (incluye 40+ claves de payment) |
| Endpoints de pago Enzona | 8 (create, findById, getStatus, getLocalStatus, retry, cancel, findByEmpresaId, getMyCompany) |
| Lineas de `endpoints.ts` | 601 |
| Lineas de `types/index.ts` | 709 |
| Lineas de `CrudPage.tsx` | 385 |
| Lineas de `ComprarPlanesPage.tsx` | 578 (incluye modal QR Enzona + polling) |
| Lineas de `VehiculosPage.tsx` | 943 |
| Tamanho del bundle (production) | 610 KB / 155 KB gzip |
| Dependencias de produccion | 10 |
| Dependencias de desarrollo | 7 |

---

## 19. Posibles Mejoras

### 19.1 Estado de Servidor

**Prioridad: Alta**

El `useCrud` hook maneja estado de servidor manualmente con `useState + useEffect`. Migrar a **TanStack Query (React Query)** para cache automatica, revalidacion, optimistic updates, infinite scroll. Beneficio: eliminar loading/error states manuales, reducir re-renders, compartir cache entre componentes.

### 19.2 Testing

**Prioridad: Alta**

No existe testing automatizado. Recomendado:
- **Vitest** + **React Testing Library** para unit/integration tests
- **Playwright** o **Cypress** para E2E tests
- Coverage minimo: 80% en componentes compartidos, 60% en paginas
- Test del `useCrud` hook con mock de API
- Test de rutas protegidas con `MemoryRouter`
- Test del selector i18n ES/EN

### 19.3 Manejo de Errores Global

**Prioridad: Media**

Implementar **React Error Boundary** para capturar errores de render. Mejorar el interceptor Axios para mapear codigos de error a mensajes user-friendly. Considerar **Sentry** para error tracking en produccion.

### 19.4 Performance

**Prioridad: Media**

- **Code splitting**: `React.lazy()` + `Suspense` para paginas (reducir bundle inicial)
- **Virtual scrolling**: para tablas con >100 registros (`react-window` o `tanstack-virtual`)
- **Memoizacion**: `useMemo`/`useCallback` en calculos del dashboard y filtros de reportes
- **Bundle analysis**: `rollup-plugin-visualizer` para identificar dependencias pesadas

### 19.5 Accesibilidad (a11y)

**Prioridad: Media**

- Agregar `aria-label` a botones de icono (editar, eliminar)
- Roles ARIA en tabla (`role="table"`, `role="row"`, etc.)
- Focus trap en modales
- Contraste WCAG AA verificado
- Navegacion por teclado en dropdowns y modales
- Selector de idioma accesible via teclado

### 19.6 Persistencia de Estado

**Prioridad: Baja**

- Migrar de `localStorage` directo a un storage mas seguro (httpOnly cookies para JWT)
- Considerar `sessionStorage` como alternativa para sesiones mas cortas
- Implementar refresh token rotation para sesiones persistentes

### 19.7 PWA / Offline

**Prioridad: Baja**

- Service Worker para cache de assets estaticos
- Offline fallback para datos previamente cargados
- Notificaciones push para alertas de mantenimiento

### 19.8 Monitoreo y Analytics

**Prioridad: Baja**

- **Web Vitals**: LCP, FID, CLS tracking con `web-vitals` library
- **Analytics**: Posthog o Mixpanel para tracking de uso por feature y por idioma
- **LogRocket** o similar para session replay en debugging

### 19.9 CI/CD

**Prioridad: Media**

GitHub Actions para:
- Lint (oxlint) en PR
- TypeScript check (`tsc --noEmit`) en PR
- Build verification en PR
- Deploy automatico a staging en merge a `developFT`/`developSuscription`
- Deploy a produccion en merge a `main`
- Script de audit i18n para bloquear PRs que introduzcan strings hardcoded

### 19.10 Coordinacion con backend para errorCode

**Prioridad: Media**

Solicitar al equipo backend agregar un campo `errorCode` estable en las respuestas de error, ademas del `message` en espanol. Esto permitiria al front mapear `errorCode → i18n key` y traducir los errores del backend.

---

## 20. Diagrama de Componentes

```
App
├── BrowserRouter
│   ├── ToastProvider
│   │   └── AuthProvider
│   │       ├── Routes
│   │       │   ├── /login → PublicOnlyRoute → LoginPage
│   │       │   │           ├── auth.title (i18n)
│   │       │   │           ├── auth.subtitle
│   │       │   │           └── auth.invalidCredentials (fallback)
│   │       │   └── MainLayout
│   │       │       ├── Sidebar
│   │       │       │   ├── navigation.sections.administracion (i18n)
│   │       │       │   ├── navigation.sections.catalogos
│   │       │       │   ├── navigation.sections.reportes
│   │       │       │   ├── navigation.sections.transporte
│   │       │       │   └── navigation.items.* (23 items, filtrados por rol)
│   │       │       ├── TopNavbar
│   │       │       │   ├── LanguageSwitcher (ES/EN, persistente)
│   │       │       │   ├── User dropdown (Perfil, Cambiar contrasena, Salir)
│   │       │       │   └── Empresa badge
│   │       │       └── Outlet
│   │       │           ├── / → DashboardPage
│   │       │           │   ├── dashboard.title, dashboard.welcome
│   │       │           │   ├── KPIs (7 indicadores)
│   │       │           │   └── formatCurrency, formatNumber (locale-aware)
│   │       │           ├── /vehiculos → ProtectedRoute → VehiculosPage
│   │       │           │   ├── vehiculos.title, vehiculos.description
│   │       │           │   ├── Tabla (10 columnas)
│   │       │           │   ├── Form modal (modelo, matricula, motor, odometro, ...)
│   │       │           │   ├── Detail modal (4 secciones)
│   │       │           │   └── Monthly movement report modal
│   │       │           ├── /choferes → ProtectedRoute → ChoferesPage
│   │       │           ├── /recorridos → ProtectedRoute → RecorridosPage
│   │       │           ├── /roles → ProtectedRoute → CrudPage<RoleReq,RoleRes>
│   │       │           ├── /usuarios → ProtectedRoute → UsuariosPage
│   │       │           ├── /permisos → ProtectedRoute → CrudPage<PermReq,PermRes>
│   │       │           ├── /empresas → ProtectedRoute → EmpresaPage (config-only)
│   │       │           ├── /marcas → ProtectedRoute → CrudPage<MarcaReq,MarcaRes>
│   │       │           ├── /tipos-vehiculo → ProtectedRoute → CrudPage<TVReq,TVRes>
│   │       │           ├── /tipos-combustible → ProtectedRoute → CrudPage<TCReq,TCRes>
│   │       │           ├── /categorias-licencia → ProtectedRoute → CrudPage<CLReq,CLRes>
│   │       │           ├── /monedas → ProtectedRoute → CrudPage<CurrReq,CurrRes>
│   │       │           ├── /tarjetas-combustible → ProtectedRoute → TarjetaCombustiblePage
│   │       │           ├── /provincias → ProtectedRoute → ProvinciaPage (config-only)
│   │       │           ├── /municipios → ProtectedRoute → MunicipioPage (config-only)
│   │       │           ├── /features → SuperAdminRoute → FeaturePage (config-only)
│   │       │           ├── /planes → SuperAdminRoute → PlanPage (custom CRUD)
│   │       │           ├── /comprar-plan → ProtectedRoute → ComprarPlanesPage
│   │       │           ├── /suscripciones → SuperAdminRoute → SubscriptionsPage
│   │       │           ├── /reportes/consumo-vehiculo → ProtectedRoute → ReporteConsumoVehiculoPage
│   │       │           ├── /reportes/mantenimiento → ProtectedRoute → ReporteMantenimientoPage
│   │       │           ├── /reportes/abastecimiento → ProtectedRoute → ReporteAbastecimientoPage
│   │       │           └── /reportes/consumo-combustible → ProtectedRoute → ReporteConsumoCombustiblePage
│   │       └── ToastContainer
```

---

## 21. Guia de Extension

### 21.1 Agregar una nueva entidad CRUD

1. **Definir interfaces** en `src/types/index.ts`: `NewEntityRequest`, `NewEntityResponse`
2. **Agregar objeto API** en `src/api/endpoints.ts`: `newEntityApi` con `findAll, create, update, delete`
3. **Crear pagina** en `src/pages/catalogs/NewEntityPage.tsx`:
   ```tsx
   import { useTranslation } from 'react-i18next';
   import CrudPage from '@/components/common/CrudPage';
   // ... definicion de config con t('catalogs:newEntity.*')
   export default function NewEntityPage() {
     const { t } = useTranslation(['catalogs', 'common']);
     const config = { title: t('catalogs:newEntity.title'), ... };
     return <CrudPage config={config} />;
   }
   ```
4. **Agregar ruta** en `App.tsx` dentro de `<MainLayout>` con `ProtectedRoute`
5. **Agregar item de navegacion** en `utils/navigation.ts` con `labelKey: 'navigation:items.newEntity'`
6. **Agregar traducciones** en `src/locales/{es,en}/catalogs.json` (clave `newEntity`) y `src/locales/{es,en}/navigation.json` (clave `items.newEntity`)

### 21.2 Agregar un nuevo reporte

1. Definir tipos de response en `types/index.ts`
2. Agregar metodo en el API object correspondiente en `endpoints.ts`
3. Crear pagina en `pages/reportes/` con filtros y tabla
4. Agregar ruta protegida y item de navegacion
5. Agregar traducciones en `reportes.json`

### 21.3 Agregar un nuevo idioma (ej.: `pt-BR`)

1. Crear la carpeta `src/locales/pt-BR/` con los 12 archivos JSON (puedes copiar de `es/` como plantilla)
2. Editar `src/i18n/index.ts`:
   - Importar todos los JSON del nuevo idioma
   - Agregarlos al objeto `resources`
   - Agregar `'pt-BR'` a `SUPPORTED_LANGUAGES`
3. (Opcional) Agregar el boton en el `LanguageSwitcher` del `TopNavbar`
4. El detector de idioma del navegador lo seleccionara automaticamente para usuarios con `navigator.language='pt-BR'`

### 21.4 Agregar una nueva clave i18n

1. Abrir el archivo correspondiente en `src/locales/es/<namespace>.json`
2. Agregar la clave con el valor en espanol
3. Replicar la misma clave en `src/locales/en/<namespace>.json` con la traduccion al ingles
4. Usar la clave en el componente: `t('namespace:clave.subclave')`
5. **Gracias al tipado fuerte**, VSCode autocompletara la clave y TS validara que existe

### 21.5 Cambiar un helper de formato

Si necesitas un nuevo formato de fecha o moneda:

1. Editar `src/utils/format.ts` y agregar la variante (e.g., `formatDateRelative`)
2. Usar el helper en el componente: `formatDateRelative(date)`
3. El helper leera automaticamente `i18n.language` para formatear segun el locale activo

---

*Documento generado a partir del analisis del codigo fuente en branch `enzonaIntegration` (commit `713fd2a`). Incluye cambios de los commits `4d7f80e`, `e75ada3` (PR #2 — i18n), `38c3903`..`713fd2a` (branch `enzonaIntegration` — integracion de pago Enzona, correcciones de labels, y refactor de locales a src/).*
