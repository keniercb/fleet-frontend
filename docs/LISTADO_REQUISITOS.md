# Listado de Requisitos — Fleet Management Frontend

> **Version:** 3.0.0
> **Fecha:** 2026-09-06
> **Branch activa:** `enzonaIntegration` (mergeable a `developSuscription`)
> **Repositorio:** fleet-frontend (GitHub: keniercb/fleet-frontend)
> **PR de referencia:** [#2 — feat: add i18n support (es + en)](https://github.com/keniercb/fleet-frontend/pull/2), branch `enzonaIntegration` (integracion de pago Enzona)

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Requisitos Funcionales (RF)](#2-requisitos-funcionales-rf)
3. [Requisitos No Funcionales (RNF)](#3-requisitos-no-funcionales-rnf)
4. [Requisitos de Diseno (RD)](#4-requisitos-de-diseno-rd)
5. [Requisitos de Internacionalizacion (RI)](#5-requisitos-de-internacionalizacion-ri)
6. [Requisitos de Seguridad (RS)](#6-requisitos-de-seguridad-rs)
7. [Requisitos de API (RA)](#7-requisitos-de-api-ra)
8. [Requisitos Tecnicos (RT)](#8-requisitos-tecnicos-rt)
9. [Requisitos de Branching (RB)](#9-requisitos-de-branching-rb)
10. [Matriz de Trazabilidad](#10-matriz-de-trazabilidad)
11. [Resumen de Estado](#11-resumen-de-estado)
12. [Apendice: Glosario](#12-apendice-glosario)

---

## 1. Resumen Ejecutivo

Este documento lista todos los requisitos del Sistema de Gestion de Flota Vehicular (frontend). Cubre requisitos funcionales (RF), no funcionales (RNF), de diseno (RD), de internacionalizacion (RI), de seguridad (RS), de API (RA), tecnicos (RT) y de branching (RB).

La aplicacion consta de **15 requisitos funcionales principales** (RF-01 a RF-15), **18 requisitos no funcionales** (RNF-01 a RNF-18), **7 requisitos de diseno** (RD-01 a RD-07), **15 requisitos de internacionalizacion** (RI-01 a RI-15), **7 requisitos de seguridad** (RS-01 a RS-07), **4 requisitos de API** (RA-01 a RA-04), **9 requisitos tecnicos** (RT-01 a RT-09) y **3 requisitos de branching** (RB-01 a RB-03). **Todos los requisitos estan implementados y verificados**.

---

## 2. Requisitos Funcionales (RF)

### RF-01: Autenticacion con JWT

**Prioridad:** Alta | **Estado:** Implementado | **Modulo:** Auth

#### Descripcion
El sistema debe permitir que un usuario inicie sesion proporcionando correo electronico y contrasena. La autenticacion se realiza contra el endpoint `POST /auth/login` del backend, el cual retorna un token JWT que se almacena en `localStorage` y se inyecta automaticamente en cada peticion HTTP subsiguiente mediante un interceptor Axios.

#### Criterios de Aceptacion
1. El usuario puede iniciar sesion con email y contrasena validos.
2. Al autenticarse exitosamente, se almacena el JWT en `localStorage` bajo la clave `token`.
3. Todas las peticiones HTTP posteriores incluyen el header `Authorization: Bearer <token>`.
4. Si el backend responde con status 401, el sistema limpia el almacenamiento local y redirige automaticamente a `/login`.
5. Si el usuario ya esta autenticado y navega a `/login`, se redirige automaticamente al dashboard (`/`).
6. El usuario puede cerrar sesion, lo cual limpia el token y redirige a `/login`.

#### Endpoints
- `POST /auth/login` — Autenticar usuario
- `POST /auth/logout` — Cerrar sesion
- `GET /auth/me` — Obtener usuario autenticado con roles y permisos
- `PUT /auth/cambiar-password` — Cambiar contrasena

#### Archivos
- `src/pages/auth/LoginPage.tsx`
- `src/api/client.ts` (interceptor de auth y 401)
- `src/contexts/AuthContext.tsx`

---

### RF-02: Control de Acceso Basado en Roles (RBAC)

**Prioridad:** Alta | **Estado:** Implementado | **Modulo:** Auth / Routing

#### Descripcion
El sistema implementa un modelo de control de acceso basado en roles con dos niveles: `SUPER_ADMIN` (super administrador con acceso total) y `ADMIN` (administrador de empresa con acceso restringido). Ademas, se soportan permisos granulares por entidad (e.g., `VEHICULOS_READ`, `ROLES_READ`) que se verifican en las rutas protegidas y en la generacion del menu lateral.

#### Criterios de Aceptacion
1. El sistema reconoce los roles `SUPER_ADMIN` y `ADMIN` (alias `ADMINISTRADOR`).
2. Las rutas protegidas verifican el permiso requerido antes de renderizar la pagina.
3. Si el usuario no tiene permiso, se muestra un mensaje "Acceso Denegado".
4. El menu lateral solo muestra las secciones e items accesibles para el rol del usuario.
5. Acciones de CRUD verifican permisos granulares (create, update, delete).

#### Roles y Permisos

| Ruta | Permiso Requerido | Roles con Acceso |
|------|-------------------|------------------|
| `/` (Dashboard) | Autenticado | ADMIN, SUPER_ADMIN |
| `/vehiculos` | `VEHICULOS_READ` | ADMIN, SUPER_ADMIN |
| `/choferes` | `CHOFERES_READ` | ADMIN, SUPER_ADMIN |
| `/recorridos` | Cualquier rol | ADMIN, SUPER_ADMIN |
| `/roles` | `ROLES_READ` | SUPER_ADMIN |
| `/usuarios` | `USUARIOS_READ` | ADMIN, SUPER_ADMIN |
| `/permisos` | `PERMISOS_READ` | SUPER_ADMIN |
| `/empresas` | `EMPRESAS_READ` | SUPER_ADMIN |
| `/features` | SUPER_ADMIN exclusivo | SUPER_ADMIN |
| `/planes` | SUPER_ADMIN exclusivo | SUPER_ADMIN |
| `/suscripciones` | SUPER_ADMIN exclusivo | SUPER_ADMIN |
| `/comprar-plan` | `SUBSCRIPTIONS_READ` | ADMIN, SUPER_ADMIN |
| Reportes | `ADMIN` | ADMIN, SUPER_ADMIN |

#### Archivos
- `src/components/common/ProtectedRoute.tsx`
- `src/components/common/SuperAdminRoute.tsx`
- `src/utils/navigation.ts` (`getFilteredNavigation`)
- `src/contexts/AuthContext.tsx`

---

### RF-03: Dashboard Ejecutivo

**Prioridad:** Alta | **Estado:** Implementado | **Modulo:** Dashboard

#### Descripcion
El dashboard ejecutivo presenta un resumen consolidado de los indicadores clave de desempeno (KPIs) de la flota para un periodo especifico (mes y ano). Los datos se obtienen del endpoint `/api/reportes-transporte/dashboard-ejecutivo` y se presentan en tarjetas con indicadores visuales (badges de variacion, semaforos de eficiencia, barras de progreso).

#### KPIs Presentados

| KPI | Unidad | Tipo | Indicador Visual |
|-----|--------|------|-----------------|
| KM Totales Flota | km | Primario | Numero formateado |
| Costo Total Combustible | CUP | Primario | Moneda + badge variacion vs mes anterior |
| Consumo Promedio Flota | L/100km | Primario | Numero decimal |
| Tasa de Utilizacion Flota | % | Primario | Barra de progreso (verde >=75%, amarillo >=50%, rojo <50%) |
| Eficiencia Promedio Choferes | % | Secundario | Semaforo (verde >=95%, amarillo >=80%, rojo <80%) |
| Vehiculos en Alerta Mantenimiento | unidades | Secundario | Badge rojo (si >0) o verde (si 0) |
| Desviacion Consumo Promedio | L | Secundario | Numero decimal |

#### Criterios de Aceptacion
1. El dashboard carga automaticamente con el mes y ano actual.
2. El usuario puede navegar al mes anterior/siguiente con botones de navegacion.
3. Cada KPI muestra el valor formateado segun su unidad.
4. La variacion de costo muestra un badge con tendencia (rojo si positivo/aumento, verde si negativo/reduccion).
5. La tasa de utilizacion muestra una barra de progreso proporcional al porcentaje.
6. La eficiencia de choferes usa un semaforo de tres colores.
7. Se muestra un spinner durante la carga y un mensaje de error si falla la peticion.
8. Los numeros y monedas se formatean segun el locale activo (es o en).

#### Endpoint
- `GET /api/reportes-transporte/dashboard-ejecutivo?mes={mes}&anio={anio}`

#### Archivos
- `src/pages/dashboard/DashboardPage.tsx`

---

### RF-04: CRUD Generico para Catalogos

**Prioridad:** Alta | **Estado:** Implementado | **Modulo:** Catalogs (shared)

#### Descripcion
El sistema provee un componente generico `CrudPage<TReq, TRes>` que, a partir de una configuracion tipada, genera automaticamente una tabla paginada con busqueda, un formulario modal de creacion/edicion, y un dialogo de confirmacion de eliminacion. Este patron elimina la duplicacion de codigo para las 11+ entidades de catalogo que comparten la misma estructura.

#### Entidades que Usan el CRUD Generico

| Entidad | Pagina | Permisos |
|---------|--------|----------|
| Provincia | `ProvinciaPage` | SUPER_ADMIN |
| Municipio | `MunicipioPage` | SUPER_ADMIN |
| Marca | `MarcaPage` | SUPER_ADMIN |
| Tipo de Vehiculo | `TipoVehiculoPage` | SUPER_ADMIN |
| Tipo de Combustible | `TipoCombustiblePage` | SUPER_ADMIN |
| Categoria de Licencia | `CategoriaLicenciaPage` | SUPER_ADMIN |
| Moneda | `CurrencyPage` | SUPER_ADMIN |
| Feature | `FeaturePage` | SUPER_ADMIN |
| Plan | `PlanPage` | SUPER_ADMIN |
| Rol | `RolesPage` | SUPER_ADMIN |
| Permiso | `PermisosPage` | SUPER_ADMIN |

#### Criterios de Aceptacion
1. La tabla muestra columnas definidas en la configuracion con datos paginados del backend.
2. El boton "Nuevo" abre un formulario modal con campos definidos en la configuracion.
3. El boton "Editar" (lapiz) abre el mismo formulario con datos pre-cargados.
4. El boton "Eliminar" (papelera) muestra un dialogo de confirmacion.
5. La busqueda filtra los registros visibles por cualquier columna.
6. La paginacion navega entre paginas del backend (server-side).
7. Los campos tipo "select" soportan opciones estaticas y asincronas (cargadas via API).
8. Cada accion (crear, editar, eliminar) muestra un toast de exito o error.
9. Todos los textos del CrudPage estan traducidos (i18n) en es y en.

#### Configuracion Requerida por Entidad
```typescript
interface CrudPageConfig<TReq, TRes> {
  title: string;              // "Marcas"
  singular: string;           // "Marca"
  description: string;        // "Gestion de marcas de vehiculos"
  permission: string;         // "MARCAS_READ"
  api: CrudApi<TReq, TRes>;   // { findAll, create, update, delete }
  columns: ColumnDef<TRes>[]; // Definicion de columnas de tabla
  formFields: FormFieldDef[]; // Definicion de campos de formulario
  getFormDefaultValues: () => TReq;
  getFormValuesFromEntity: (entity: TRes) => TReq;
  getId: (entity: TRes) => number;
  getIsActive: (entity: TRes) => boolean;
}
```

#### Archivos
- `src/components/common/CrudPage.tsx`
- `src/hooks/useCrud.ts`

---

### RF-05: Gestion de Vehiculos

**Prioridad:** Alta | **Estado:** Implementado | **Modulo:** Vehiculos

#### Descripcion
Modulo de gestion integral de vehiculos con CRUD completo, vinculacion con tipo de vehiculo, tipo de combustible, marca, chofer asignado, tarjeta de combustible y empresa. Incluye funcionalidad de exportacion a PDF del listado y reporte mensual de movimientos por vehiculo.

#### Criterios de Aceptacion
1. El usuario puede crear, editar y eliminar vehiculos con todos sus campos asociados.
2. Se puede asignar/desasignar un chofer al vehiculo.
3. Se puede generar un reporte PDF del listado de vehiculos de la empresa.
4. Se puede generar un reporte mensual de movimientos por vehiculo en formato PDF.
5. Se puede filtrar vehiculos por tipo, combustible, marca, chofer y empresa.
6. El listado muestra: matricula, empresa, tipo, marca, modelo, tipo combustible, combustible (L), chofer, odometro, acciones.
7. El modal de detalle muestra 5 secciones: Informacion General, Empresa y Chofer, Metricas y Combustible, Mantenimiento, Estado.
8. El reporte mensual de movimiento incluye: datos del vehiculo, lecturas diarias, analisis de consumo.

#### Endpoints
- `GET/POST/PUT/DELETE /vehiculos`
- `GET /vehiculos/tipo-vehiculo/{id}`, `/vehiculos/tipo-combustible/{id}`
- `GET /vehiculos/sin-chofer`, `/vehiculos/chofer/{id}`
- `GET /vehiculos/reporte-movimiento-mensual/{id}?mes=X&anio=Y`
- `GET /vehiculos/reporte-pdf?empresaId=X`
- `GET /recorridos/vehiculo/{id}/reporte-mensual/pdf?mes=X&anio=Y`

#### Archivos
- `src/pages/vehiculos/VehiculosPage.tsx` (~960 lineas)

---

### RF-06: Gestion de Choferes

**Prioridad:** Alta | **Estado:** Implementado | **Modulo:** Choferes

#### Descripcion
Modulo de gestion de choferes con CRUD y administracion de categorias de licencia asociadas. La relacion chofer-categoria es many-to-many, permitiendo que un chofer posea multiples categorias habilitadoras.

#### Criterios de Aceptacion
1. El usuario puede crear, editar y eliminar choferes.
2. Se pueden asignar categorias de licencia a un chofer (sub-formulario).
3. Se puede filtrar choferes por empresa.
4. Las categorias de licencia se gestionan como catalogo independiente.
5. El listado muestra: nombre, apellidos, carne identidad, no. licencia, empresa, f. nacimiento, categorias, estado, acciones.

#### Endpoints
- `GET/POST/PUT/DELETE /choferes`
- `GET /choferes/empresa/{id}`
- `GET/POST/PUT/DELETE /choferes-categorias`
- `GET /choferes-categorias/chofer/{id}`, `/choferes-categorias/categoria/{id}`

#### Archivos
- `src/pages/choferes/ChoferesPage.tsx` (~530 lineas)
- `src/pages/catalogs/CategoriaLicenciaPage.tsx`

---

### RF-07: Registro de Recorridos

**Prioridad:** Media | **Estado:** Implementado | **Modulo:** Recorridos

#### Descripcion
Modulo de registro y consulta de recorridos realizados por los vehiculos de la flota. Soporta filtrado por vehiculo y rango de fechas para analisis historico.

#### Criterios de Aceptacion
1. El usuario puede crear, editar y eliminar recorridos.
2. Se puede filtrar recorridos por vehiculo.
3. Se puede filtrar por rango de fechas (from, to).
4. Los recorridos se muestran en tabla paginada.
5. El listado muestra: fecha, km recorridos, odometro inicial, consumo, litros, n chip, lugar, tarjeta, importe, acciones.
6. El formulario permite seleccionar tarjeta de combustible (opcional).
7. El usuario debe seleccionar un vehiculo antes de poder agregar recorridos.

#### Endpoints
- `GET/POST/PUT/DELETE /recorridos`
- `GET /recorridos/vehiculo/{id}?from=...&to=...`

#### Archivos
- `src/pages/recorridos/RecorridosPage.tsx` (~640 lineas)

---

### RF-08: Gestion de Tarjetas de Combustible

**Prioridad:** Media | **Estado:** Implementado | **Modulo:** Catalogs

#### Descripcion
CRUD de tarjetas de combustible vinculadas a empresas. Permite la administracion de los medios de pago utilizados para el abastecimiento de combustible de la flota.

#### Criterios de Aceptacion
1. El usuario puede crear, editar y eliminar tarjetas de combustible.
2. Cada tarjeta esta asociada a una empresa.
3. Se puede buscar una tarjeta por su numero.
4. Se puede filtrar tarjetas por empresa.
5. El listado muestra: numero, empresa, moneda, saldo, estado, acciones.

#### Endpoints
- `GET/POST/PUT/DELETE /tarjetas-combustible`
- `GET /tarjetas-combustible/numero/{numero}`
- `GET /tarjetas-combustible/empresa/{id}`

#### Archivos
- `src/pages/catalogs/TarjetaCombustiblePage.tsx`

---

### RF-09: Sistema de Reportes Operacionales

**Prioridad:** Alta | **Estado:** Implementado | **Modulo:** Reportes

#### Descripcion
Conjunto de cuatro reportes operacionales que proporcionan visibilidad sobre el consumo, mantenimiento y abastecimiento de la flota. Cada reporte tiene filtros especificos y presenta datos en formato tabular paginado.

#### Reportes Implementados

##### RF-09a: Reporte de Consumo por Vehiculo
- Filtros: fecha desde/hasta, tipo vehiculo, marca, tipo combustible
- Tabla paginada con metricas de consumo por vehiculo
- Badges de desviacion (rojo/verde) y eficiencia (semaforo)
- Endpoint: `GET /reportes-transporte/consumo-vehiculo`

##### RF-09b: Reporte de Mantenimiento
- Listado de vehiculos en mantenimiento o con alertas
- Badges de estado: VENCIDO (rojo), PROXIMO (amarillo), VIGENTE (verde)
- Paginacion server-side
- Endpoint: `GET /reportes-transporte/mantenimiento`

##### RF-09c: Reporte de Abastecimiento
- Filtros: fecha desde/hasta, vehiculo, lugar de abastecimiento
- Tabla paginada con registros de abastecimiento
- Resumen: total vehiculos, total abastecimientos, total litros
- Endpoint: `GET /reportes-transporte/abastecimiento`

##### RF-09d: Reporte de Consumo por Combustible
- Filtros: fecha desde/hasta, tipo vehiculo
- Resumen agrupado por tipo de combustible con estadisticas
- Iconos de variacion vs periodo anterior (TrendingUp/Down)
- Endpoint: `GET /reportes-transporte/consumo-por-combustible`

#### Criterios de Aceptacion
1. Cada reporte carga con filtros vacios o con defaults (primer dia del mes a hoy).
2. Los filtros se aplican al solicitar datos al backend.
3. Los resultados se muestran en tabla paginada.
4. Se muestran spinners durante la carga y mensajes de error si falla la peticion.
5. Todos los textos estan traducidos (i18n) en es y en.

#### Archivos
- `src/pages/reportes/ReporteConsumoVehiculoPage.tsx`
- `src/pages/reportes/ReporteMantenimientoPage.tsx`
- `src/pages/reportes/ReporteAbastecimientoPage.tsx`
- `src/pages/reportes/ReporteConsumoCombustiblePage.tsx`

---

### RF-10: Sistema de Suscripciones y Planes

**Prioridad:** Alta | **Estado:** Implementado | **Modulo:** Admin

#### Descripcion
Sistema de planes y suscripciones que permite a los super administradores gestionar los planes disponibles y a los administradores de empresa comprar suscripciones. Incluye calculo de importe con descuento por facturacion anual.

#### Criterios de Aceptacion
1. Un SUPER_ADMIN puede crear, editar y eliminar planes.
2. Cada plan tiene un porcentaje de descuento anual configurable.
3. Un ADMIN puede ver los planes disponibles y comprar una suscripcion.
4. Al comprar, se calcula el importe considerando facturacion mensual o anual.
5. El calculo de importe se realiza via endpoint: `GET /plans/{id}/calcular-importe?facturarAnual=true|false`.
6. Un SUPER_ADMIN puede gestionar las suscripciones existentes.
7. El modal de edicion de suscripcion muestra warnings si el nuevo plan no permite los usuarios/vehiculos actuales.

#### Endpoints
- `GET/POST/PUT/DELETE /plans`
- `GET /plans/{id}/calcular-importe?facturarAnual={bool}`
- `GET/PUT/DELETE /subscriptions`
- `GET /subscriptions/empresa/{id}`, `/subscriptions/plan/{id}`
- `GET /subscriptions/my-company`

#### Archivos
- `src/pages/catalogs/PlanPage.tsx`
- `src/pages/catalogs/FeaturePage.tsx`
- `src/pages/admin/ComprarPlanesPage.tsx`
- `src/pages/admin/SubscriptionsPage.tsx`

---

### RF-11: Gestion de Empresas

**Prioridad:** Alta | **Estado:** Implementado | **Modulo:** Catalogs

#### Descripcion
CRUD de empresas con datos completos incluyendo provincia, municipio y moneda. Las empresas son la entidad organizacional principal a la que se vinculan usuarios, vehiculos, choferes y suscripciones.

#### Criterios de Aceptacion
1. Un SUPER_ADMIN puede crear, editar y eliminar empresas.
2. Cada empresa tiene provincia, municipio y moneda asociados.
3. Se puede buscar una empresa por su codigo.
4. Los usuarios, vehiculos y choferes se filtran por la empresa del usuario autenticado.

#### Endpoints
- `GET/POST/PUT/DELETE /empresas`
- `GET /empresas/codigo/{codigo}`

#### Archivos
- `src/pages/catalogs/EmpresaPage.tsx`
- `src/pages/catalogs/ProvinciaPage.tsx`
- `src/pages/catalogs/MunicipioPage.tsx`
- `src/pages/catalogs/CurrencyPage.tsx`

---

### RF-12: Administracion de Usuarios y Permisos

**Prioridad:** Alta | **Estado:** Implementado | **Modulo:** Admin

#### Descripcion
Modulo de administracion de usuarios con asignacion de roles y permisos. Los roles agrupan permisos, y los usuarios heredan los permisos de sus roles asignados. Incluye funcionalidad de cambio de contrasena.

#### Criterios de Aceptacion
1. Un SUPER_ADMIN puede crear, editar y eliminar usuarios.
2. Se pueden asignar multiples roles a un usuario (multi-select).
3. Un rol agrupa multiples permisos (multi-select).
4. Se pueden crear y editar permisos independientes.
5. El usuario puede cambiar su propia contrasena.
6. Se puede buscar un usuario por email.
7. Se pueden filtrar usuarios por empresa.

#### Endpoints
- `GET/POST/PUT/DELETE /users`
- `GET /users/email/{email}`, `/users/empresa/{id}`
- `GET/POST/PUT/DELETE /roles`
- `GET /roles/permission/{id}`, `/roles/name/{name}`
- `GET/POST/PUT/DELETE /permissions`
- `GET /permissions/name/{name}`
- `PUT /auth/cambiar-password`

#### Archivos
- `src/pages/admin/UsuariosPage.tsx`
- `src/pages/admin/RolesPage.tsx`
- `src/pages/admin/PermisosPage.tsx`
- `src/components/ui/ChangePasswordModal.tsx`
- `src/components/ui/ProfileModal.tsx`

---

### RF-13: Sistema de Notificaciones (Toast)

**Prioridad:** Media | **Estado:** Implementado | **Modulo:** UI

#### Descripcion
Sistema de notificaciones no intrusivas (toast) para feedback de acciones del usuario. Soporta cuatro tipos de notificacion con auto-dismiss configurable y animacion de entrada.

#### Tipos de Notificacion

| Tipo | Color | Uso |
|------|-------|-----|
| `success` | Verde | Operacion exitosa (crear, actualizar, eliminar) |
| `error` | Rojo | Error en operacion o de API |
| `warning` | Amarillo | Advertencia al usuario |
| `info` | Azul | Informacion general |

#### Criterios de Aceptacion
1. Cada accion CRUD exitosa muestra un toast de tipo `success`.
2. Cada error de API muestra un toast de tipo `error`.
3. Los toasts desaparecen automaticamente despues de 4 segundos (configurable).
4. El usuario puede cerrar un toast manualmente.
5. Multiples toasts pueden mostrarse simultaneamente (stack vertical).
6. Los toasts aparecen con animacion de entrada suave.

#### Archivos
- `src/contexts/ToastContext.tsx`
- `src/components/ui/ToastContainer.tsx`

---

### RF-14: Internacionalizacion (i18n) — Espanol e Ingles

**Prioridad:** Alta | **Estado:** Implementado | **Modulo:** i18n

#### Descripcion
El sistema soporta dos idiomas: Espanol (por defecto) e Ingles. El idioma se detecta automaticamente del navegador en la primera visita, se persiste en `localStorage`, y puede cambiarse en runtime mediante un selector en el TopNavbar. El 100% de los textos visibles al usuario estan traducidos.

#### Criterios de Aceptacion
1. La aplicacion detecta el idioma del navegador en la primera visita.
2. La eleccion de idioma se persiste en `localStorage` (clave `i18nextLng`).
3. Un selector en el TopNavbar permite cambiar entre ES y EN sin recarga.
4. El 100% de los textos visibles (titulos, botones, placeholders, encabezados, toasts, etc.) estan traducidos.
5. Las fechas, numeros y monedas se formatean segun el locale activo.
6. Los nombres de meses cambian con el idioma.
7. La pluralizacion funciona correctamente (i18next con `_one`/`_other`).
8. Los mensajes de error del backend se muestran crudos (no traducidos).
9. Los IDs tecnicos (`ADMIN`, `USUARIOS_CREATE`) se muestran crudos.
10. Las claves i18n estan tipadas en TypeScript (autocompletado VSCode + validacion en compilacion).

#### Decisiones de politica
- **Mensajes del backend**: NO se traducen (sin contrato `errorCode` con backend).
- **IDs tecnicos**: NO se traducen (parte del contrato RBAC).
- **Locale principal**: `es` (sin region) — normaliza `es-ES`, `es-CU`, `es-MX` a `es`.

#### Arquitectura
- 12 namespaces por modulo (common, navigation, auth, dashboard, crud, catalogs, vehiculos, choferes, recorridos, admin, reportes, errors)
- 24 archivos JSON en `public/locales/{es,en}/` (~1.097 strings traducidos)
- Tipado fuerte via `src/i18n/types.ts` (CustomTypeOptions)

#### Archivos
- `src/i18n/index.ts` (inicializacion)
- `src/i18n/types.ts` (tipado fuerte)
- `src/utils/format.ts` (helpers de formato locale-aware)
- `src/utils/statusLabels.ts` (hooks de status traducidos)
- `public/locales/{es,en}/*.json` (24 archivos)
- `src/components/layout/TopNavbar.tsx` (LanguageSwitcher)

---

### RF-15: Integracion de Pago Enzona (QR)

**Prioridad:** Alta | **Estado:** Implementado | **Modulo:** Payment

#### Descripcion
El sistema permite iniciar un pago a traves de la pasarela **Enzona** desde la pagina de Comprar Planes. Al hacer click en el boton "Comprar", el frontend llama al endpoint `POST /api/payments` con el plan seleccionado y el tipo de pago apropiado (NUEVA_SUSCRIPCION o RENOVACION). El backend responde con un objeto `PaymentResponse` que incluye un codigo QR (en formato base64 PNG) que el usuario debe escanear con su app bancaria. El frontend muestra el QR en un modal, hace polling automatico del estado del pago cada 5 segundos, y permite al usuario reintentar, cancelar o verificar manualmente el estado del pago.

#### Criterios de Aceptacion
1. El boton "Comprar" en `ComprarPlanesPage` llama a `paymentsApi.create` con `{ planId, type, subscriptionId? }`.
2. El `PaymentType` se determina automaticamente: `NUEVA_SUSCRIPCION` si no hay suscripcion previa, `RENOVACION` si ya existe.
3. Al recibir la respuesta, se abre un modal que muestra el QR (`qrImageBase64` renderizado como `<img>` con prefijo `data:image/png;base64,`).
4. Si el backend no retorna `qrImageBase64` pero si `qrCode`, se muestra el codigo QR textual como fallback.
5. El modal muestra: importe, plan, ID de transaccion, fecha de expiracion, y badge de estado con color e icono.
6. **Polling automatico**: cada 5 segundos se consulta `GET /payments/{id}/status` para detectar cambios de estado.
7. Al detectar `PAGADO`: se detiene el polling, se refresca la suscripcion, se muestra toast de exito, y se ofrece boton "Cerrar".
8. Al detectar `EXPIRADO` o `FALLIDO`: se detiene el polling y se ofrece boton "Reintentar pago".
9. El usuario puede realizar acciones manuales: "Verificar estado", "Reintentar pago", "Cancelar pago", "Copiar codigo QR" al portapapeles.
10. El polling se detiene al cerrar el modal o desmontar el componente (cleanup via `useRef` + `useEffect`).
11. Todos los textos del modal y los mensajes de toast estan traducidos (i18n) en es y en.
12. Los 6 estados de pago estan traducidos: PENDIENTE, QR_GENERADO, PAGADO, FALLIDO, EXPIRADO, CANCELADO.
13. El prefijo `data:image/png;base64,` se agrega automaticamente al `src` del `<img>` si el backend no lo incluye (fix idempotente).

#### Estados de Pago (PaymentStatus)

| Estado | Color | Icono | Significado |
|--------|-------|-------|-------------|
| `PENDIENTE` | Ambar | Clock3 | Pago creado, esperando generacion de QR |
| `QR_GENERADO` | Azul | QrCode | QR listo para escanear |
| `PAGADO` | Verde | CheckCircle | Pago confirmado, suscripcion activada |
| `FALLIDO` | Rojo | AlertTriangle | El pago fallo en la pasarela |
| `EXPIRADO` | Gris | Clock3 | El QR expiro sin pago |
| `CANCELADO` | Rojo | XCircle | El usuario cancelo el pago |

#### Tipos de Pago (PaymentType)

| Tipo | Uso |
|------|-----|
| `NUEVA_SUSCRIPCION` | Empresa sin suscripcion previa, compra un plan por primera vez |
| `RENOVACION` | Empresa con suscripcion existente, renueva o cambia de plan |
| `UPGRADE` | Mejora de plan (futuro, no implementado en UI) |

#### Endpoints

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `POST` | `/api/payments` | Crear nuevo pago (recibe `PaymentCreateRequest`, retorna `PaymentResponse` con QR) |
| `GET` | `/api/payments/{id}` | Obtener pago por ID |
| `GET` | `/api/payments/{id}/status` | Obtener estado actual del pago (sincroniza con Enzona) |
| `GET` | `/api/payments/{id}/local-status` | Obtener estado local (sin consultar Enzona) |
| `POST` | `/api/payments/{id}/retry` | Reintentar pago fallido/expirado (genera nuevo QR) |
| `POST` | `/api/payments/{id}/cancel` | Cancelar pago pendiente |
| `GET` | `/api/payments/empresa/{empresaId}` | Listar pagos por empresa (paginado) |
| `GET` | `/api/payments/my-company` | Obtener pago de mi empresa |
| `POST` | `/api/payments/webhook/enzona` | Webhook de Enzona (callback del backend, no usado en frontend) |

#### Archivos
- `src/types/index.ts` (tipos `PaymentStatus`, `PaymentType`, `PaymentCreateRequest`, `PaymentResponse`)
- `src/api/endpoints.ts` (`paymentsApi` con 8 metodos)
- `src/pages/admin/ComprarPlanesPage.tsx` (modal QR, polling, handlers)
- `public/locales/{es,en}/admin.json` (seccion `payment` con 40+ claves)

#### Flujo de Pago

```
1. Usuario selecciona plan en ComprarPlanesPage
2. Click "Comprar" → paymentsApi.create({ planId, type, subscriptionId? })
3. Backend contacta Enzona → retorna PaymentResponse con qrImageBase64
4. Frontend abre modal con QR (prefija data:image/png;base64, si falta)
5. Inicia polling: cada 5s → paymentsApi.getStatus(id)
6. Usuario escanea QR con app bancaria → paga en Enzona
7. Enzona notifica al backend via webhook (POST /api/payments/webhook/enzona)
8. Backend actualiza status a PAGADO
9. Frontend detecta PAGADO en proximo poll → detiene polling
10. Refresca suscripcion → muestra toast de exito
11. Si expira/falla → ofrece "Reintentar pago" (genera nuevo QR)
```

---

## 3. Requisitos No Funcionales (RNF)

### RNF-01: Rendimiento del Bundle

**Prioridad:** Alta | **Estado:** Cumplido

- El bundle de produccion no debe superar 650 KB sin comprimir (gzip < 160 KB).
- Verificado: 608 KB / 154 KB gzip (incluyendo i18n + Enzona payment integration).

### RNF-02: Tiempo de Carga Inicial

**Prioridad:** Alta | **Estado:** Cumplido

- El primer render con texto (FCP) debe ocurrir en menos de 2 segundos en conexion 3G.
- Logrado mediante carga sincrona de JSON de i18n (sin FOUC).

### RNF-03: Tipado Estricto TypeScript

**Prioridad:** Alta | **Estado:** Cumplido

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noUncheckedIndexedAccess: true`
- `noFallthroughCasesInSwitch: true`
- Verificado: `tsc --noEmit` pasa sin errores.

### RNF-04: Lint Sin Errores

**Prioridad:** Alta | **Estado:** Cumplido

- `npm run lint` (oxlint) no debe producir errores.
- Warnings permitidos (e.g., dependency arrays en useCallback).
- Verificado: 0 errores, solo warnings menores.

### RNF-05: Compatibilidad de Navegadores

**Prioridad:** Media | **Estado:** Cumplido

- Target ES2020 (soporta Chrome >= 80, Firefox >= 75, Safari >= 13.1, Edge >= 80).
- `Intl.NumberFormat` y `Intl.DateTimeFormat` son nativos en estos navegadores.

### RNF-06: Responsive Design

**Prioridad:** Alta | **Estado:** Cumplido

- Mobile-first con breakpoints Tailwind (`sm`, `md`, `lg`, `xl`).
- Sidebar colapsa a overlay en mobile (lg:hidden).
- TopNavbar muestra menu hamburguesa en mobile.
- Tablas con scroll horizontal en pantallas pequenas.

### RNF-07: Accesibilidad Basica

**Prioridad:** Media | **Estado:** Parcial

- Labels asociados a inputs via `htmlFor`.
- Botones con `title` descriptivos.
- Contraste WCAG AA verificado en paleta principal.
- **Pendiente**: focus trap en modales, roles ARIA en tablas, navegacion por teclado en dropdowns.

### RNF-08: Mantenibilidad del Codigo

**Prioridad:** Alta | **Estado:** Cumplido

- Principios SOLID aplicados (Single Responsibility, Open/Closed, etc.).
- DRY: componente `CrudPage` elimina duplicacion de 11+ entidades.
- Separation of Concerns: capas api/types/hooks/components/pages.
- Helpers centralizados (format.ts, statusLabels.ts).

### RNF-09: Escalabilidad

**Prioridad:** Media | **Estado:** Cumplido

- Server-side pagination para listados grandes.
- Arquitectura modular permite agregar nuevas entidades sin tocar codigo existente.
- Namespaces i18n permiten crecer a mas idiomas con costo minimo.

### RNF-10: Seguridad del Token JWT

**Prioridad:** Alta | **Estado:** Cumplido

- Token almacenado en `localStorage` (mejora futura: httpOnly cookies).
- Interceptor automatico para inyectar `Authorization: Bearer <token>`.
- Auto-logout en 401.

### RNF-11: Manejo de Errores

**Prioridad:** Media | **Estado:** Parcial

- Errores de API mostrados como toasts.
- Fallbacks traducidos en `errors.json`.
- **Pendiente**: React Error Boundary para errores de render.
- **Pendiente**: Sentry o similar para error tracking en produccion.

### RNF-12: Consistencia Visual

**Prioridad:** Media | **Estado:** Cumplido

- Design system definido en `index.css` (@layer components).
- Paleta de colores consistente (primary, success, error, warning).
- Tipografia Inter (variable font).
- Iconografia lucide-react (tree-shakeable).

### RNF-13: i18n sin FOUC

**Prioridad:** Alta | **Estado:** Cumplido

- Carga sincrona de JSON de traduccion (sin HTTP backend).
- No hay "flash of untranslated content" en el primer render.

### RNF-14: Persistencia de Estado de UI

**Prioridad:** Media | **Estado:** Cumplido

- Idioma seleccionado persiste en `localStorage` (clave `i18nextLng`).
- Token y usuario persisten en `localStorage` (claves `token`, `user`).

### RNF-15: Deteccion Automatica de Idioma

**Prioridad:** Media | **Estado:** Cumplido

- Orden de deteccion: `localStorage → navigator → htmlTag → fallback (es)`.
- Normaliza variantes regionales (`es-ES`, `es-CU` → `es`) via `load: 'languageOnly'`.

### RNF-16: Validacion en Compilacion de Claves i18n

**Prioridad:** Media | **Estado:** Cumplido

- `src/i18n/types.ts` con `CustomTypeOptions` tipa las claves.
- VSCode autocompleta claves al escribir `t('namespace:clave.subclave')`.
- TypeScript marca error si una clave no existe en el JSON.

### RNF-17: Formato Locale-Aware

**Prioridad:** Media | **Estado:** Cumplido

- `formatDate`, `formatNumber`, `formatCurrency` leen `i18n.language`.
- Al cambiar de idioma, los numeros y fechas se reformatean sin recarga.
- Reemplaza 11+ helpers duplicados que tenian locales hardcoded.

### RNF-18: Sin Regresiones Funcionales

**Prioridad:** Alta | **Estado:** Cumplido

- Todos los RF-01 a RF-15 siguen funcionando despues de la integracion de pago Enzona.
- Build de produccion exitoso.
- Dev server HTTP 200.

---

## 4. Requisitos de Diseno (RD)

### RD-01: Tokens de Color

**Estado:** Cumplido

| Token | Valor | Uso |
|---|---|---|
| `primary-600` | `#418AD1` | Botones primarios, links, foco |
| `primary-700` | `#3470AD` | Hover de botones primarios |
| `primary-50` | `#E8F1FA` | Backgrounds sutiles (badges) |
| `sidebar` | `#16202E` | Fondo del sidebar |
| Background general | `#F8F9FB` | Fondo de la app |

### RD-02: Componentes de Design System

**Estado:** Cumplido

Definidos en `index.css` bajo `@layer components`:
- `btn-primary`, `btn-secondary`, `btn-danger`
- `input-field`
- `card`
- `table-header`, `table-cell`
- `badge-active`, `badge-inactive`, `badge-warning`

### RD-03: Tipografia

**Estado:** Cumplido

- Familia: **Inter** (variable font) con fallback a `system-ui, -apple-system, sans-serif`
- Font smoothing: antialiased
- Tamanos: escalas Tailwind (text-xs a text-2xl)

### RD-04: Iconografia

**Estado:** Cumplido

- Biblioteca: `lucide-react` (SVG tree-shakeable)
- Cada icono se importa individualmente
- Tamanos: `w-4 h-4`, `w-5 h-5`, `w-6 h-6`

### RD-05: Layout Responsive

**Estado:** Cumplido

- Sidebar fijo a la izquierda (w-64 o w-20 colapsado)
- TopNavbar fija arriba (h-14)
- Contenido principal con padding y margin-left dinamico
- Mobile: sidebar overlay, topnavbar con menu hamburguesa

### RD-06: Componentes Visuales Consistentes

**Estado:** Cumplido

- Modales con backdrop blur, tamanos sm/md/lg/xl
- Badges con colores semaforo (verde/amarillo/rojo)
- Tablas con hover, headers gris claro, bordes sutiles
- Spinners animados para loading states
- Toasts con animacion de entrada cubic-bezier

### RD-07: Selector de Idioma Integrado

**Estado:** Cumplido

- Icono de globo terraqueo (Globe de lucide)
- Codigo ISO del idioma actual (ES/EN) en mayusculas
- Dropdown con banderas emoji (ES, US) y nombres de idioma
- Resaltado del idioma activo

---

## 5. Requisitos de Internacionalizacion (RI)

### RI-01: Soporte Multi-idioma

**Estado:** Cumplido

- Idiomas soportados: Espanol (`es`, por defecto) e Ingles (`en`).
- Arquitectura permite agregar nuevos idiomas con costo minimo.

### RI-02: Deteccion Automatica

**Estado:** Cumplido

- Deteccion en orden: `localStorage → navigator → htmlTag → fallback (es)`.
- `i18next-browser-languagedetector` configurado.
- Normaliza variantes regionales (`es-ES` → `es`) via `load: 'languageOnly'`.

### RI-03: Persistencia de Preferencia

**Estado:** Cumplido

- Idioma seleccionado se persiste en `localStorage` bajo clave `i18nextLng`.
- Recargar la pagina mantiene el idioma seleccionado.

### RI-04: Cambio en Runtime sin Recarga

**Estado:** Cumplido

- Selector ES/EN en `TopNavbar` cambia el idioma al instante.
- React re-renderiza los componentes visibles automaticamente.

### RI-05: Cobertura Completa de Strings

**Estado:** Cumplido

- 100% de los textos visibles al usuario estan traducidos.
- ~1.097 strings distribuidos en 12 namespaces.
- 25 paginas migradas.

### RI-06: Estrategia de Namespaces

**Estado:** Cumplido

- 12 namespaces por modulo: common, navigation, auth, dashboard, crud, catalogs, vehiculos, choferes, recorridos, admin, reportes, errors.
- Permite organizacion y potencial lazy loading futuro.

### RI-07: Carga Sincrona (sin FOUC)

**Estado:** Cumplido

- JSON de traduccion se importan como modulos ES en el bundle.
- No hay "flash of untranslated content" en el primer render.
- Evita peticiones HTTP adicionales.

### RI-08: Tipado Fuerte de Claves

**Estado:** Cumplido

- `src/i18n/types.ts` con `CustomTypeOptions` tipa las claves.
- Autocompletado VSCode al escribir `t('namespace:clave.subclave')`.
- Validacion en compilacion: si una clave no existe, TypeScript marca error.

### RI-09: Interpolacion de Variables

**Estado:** Cumplido

- Sintaxis `{{variable}}` en JSON.
- Ejemplo: `t('pagination.showing', { start, end, total })`.
- i18next maneja el reemplazo automaticamente.

### RI-10: Pluralizacion

**Estado:** Cumplido

- Sufijos `_one` / `_other` para plurales.
- Ejemplo: `countLabel_one: "{{count}} vehiculo"`, `countLabel_other: "{{count}} vehiculos"`.
- i18next detecta automaticamente por el count.

### RI-11: Formato Locale-Aware

**Estado:** Cumplido

- Helpers en `src/utils/format.ts` leen `i18n.language`.
- `formatDate`, `formatNumber`, `formatCurrency`, `formatPercent` usan `Intl.NumberFormat` y `Intl.DateTimeFormat`.
- `getMonthName` y `getMonthNames` retornan meses en el locale activo.

### RI-12: Politica de Mensajes del Backend

**Estado:** Cumplido

- Mensajes del backend (`error.response.data.message`) NO se traducen.
- Solo los fallbacks del front (en `errors.json`) estan traducidos.
- Rationale: sin contrato `errorCode` con backend, mapear mensajes es fragil.

### RI-13: IDs Tecnicos No Traducidos

**Estado:** Cumplido

- Strings como `ADMIN`, `SUPER_ADMIN`, `USUARIOS_CREATE`, `MARCAS_READ` se muestran crudos.
- Son identificadores del contrato RBAC con el backend.

### RI-14: Selector de Idioma UI

**Estado:** Cumplido

- Integrado en `TopNavbar.tsx`.
- Icono de globo + codigo ISO + dropdown con opciones ES/EN.
- Resaltado del idioma activo.

### RI-15: Fallback a Espanol

**Estado:** Cumplido

- `fallbackLng: 'es'`.
- Si una clave falta en `en.json`, i18next usa la clave correspondiente de `es.json`.
- Si la clave falta en ambos, retorna la clave cruda (detectable en tests).

---

## 6. Requisitos de Seguridad (RS)

### RS-01: Autenticacion JWT

**Estado:** Cumplido

- Token JWT en header `Authorization: Bearer <token>`.
- Interceptor Axios automatico.

### RS-02: Almacenamiento Seguro

**Estado:** Parcial (mejora futura)

- Token y datos de usuario en `localStorage`.
- **Mejora futura**: migrar a httpOnly cookies para JWT.

### RS-03: Auto-logout en 401

**Estado:** Cumplido

- Interceptor de respuesta captura 401.
- Limpia `localStorage`.
- Redirige a `/login`.

### RS-04: Proteccion de Rutas

**Estado:** Cumplido

- `ProtectedRoute` verifica permisos antes de renderizar.
- `SuperAdminRoute` verifica rol SUPER_ADMIN.
- Si no tiene permiso, muestra "Acceso Denegado".

### RS-05: Menu Filtrado por Rol

**Estado:** Cumplido

- Items del sidebar ocultos si el rol no tiene permiso.
- Funcion `getFilteredNavigation(isSuperAdmin, isAdmin)`.

### RS-06: RBAC Granular

**Estado:** Cumplido

- Permisos por entidad (e.g., `VEHICULOS_READ`).
- Verificacion en rutas y acciones CRUD.
- Roles agrupan permisos.

### RS-07: XSS Protection

**Estado:** Cumplido

- React escapea por defecto contenido de variables.
- i18next con `escapeValue: false` (seguro porque React ya escapa).
- No se usa `dangerouslySetInnerHTML` salvo en Pagination (texto controlado).

---

## 7. Requisitos de API (RA)

### RA-01: API REST Backend

**Estado:** Cumplido

- Backend Spring Boot desplegado en `http://localhost:8081`.
- 25 objetos API en `src/api/endpoints.ts` (incluyendo `paymentsApi`).
- 108+ endpoints cubiertos.

### RA-02: HTTP Client Axios

**Estado:** Cumplido

- Instancia Axios con `baseURL: '/api'` (o `VITE_API_BASE_URL`).
- Interceptores de request (JWT) y response (401).

### RA-03: Proxy de Desarrollo

**Estado:** Cumplido

- Vite proxy: `/api` → `http://localhost:8081`.
- Configurado en `vite.config.ts`.

### RA-04: Contrato Tipado

**Estado:** Cumplido

- 70 interfaces/tipos en `src/types/index.ts` (incluyendo 4 tipos de Payment).
- Tipos Request y Response para cada entidad.
- Contrato `CrudApi<TReq, TRes>` para entidades CRUD.
- Tipos `PaymentStatus`, `PaymentType`, `PaymentCreateRequest`, `PaymentResponse` para integracion Enzona.

---

## 8. Requisitos Tecnicos (RT)

### RT-01: React 19

**Estado:** Cumplido

- `react` ^19.2.8
- `react-dom` ^19.2.8
- Functional components + hooks.

### RT-02: TypeScript 5.7

**Estado:** Cumplido

- `typescript` ~5.7.0
- Strict mode + noUncheckedIndexedAccess.
- `resolveJsonModule: true` (para importar JSON de i18n).

### RT-03: Vite 8

**Estado:** Cumplido

- `vite` ^8.2.0
- Bundler ESM nativo, HMR ultra-rapido.
- Plugin `@vitejs/plugin-react` ^6.0.4.

### RT-04: Tailwind CSS 4

**Estado:** Cumplido

- `tailwindcss` ^4.3.3
- Plugin `@tailwindcss/vite` ^4.3.3.
- Design system en `@layer components`.

### RT-05: react-router-dom 6

**Estado:** Cumplido

- `react-router-dom` ^6.28.0
- Navegacion SPA con rutas protegidas.
- `<BrowserRouter>`, `<Routes>`, `<Route>`, `<Navigate>`, `<Outlet>`.

### RT-06: Axios 1.19

**Estado:** Cumplido

- `axios` ^1.19.0
- HTTP client con interceptores.

### RT-07: lucide-react 1.31

**Estado:** Cumplido

- `lucide-react` ^1.31.0
- Iconografia SVG tree-shakeable.

### RT-08: Stack i18n

**Estado:** Cumplido

- `i18next` ^26.4.2
- `react-i18next` ^17.0.13
- `i18next-browser-languagedetector` ^8.2.1

### RT-09: Linter Oxlint

**Estado:** Cumplido

- `oxlint` ^1.75.0
- Linter Rust-based (rapido y estricto).
- `npm run lint` sin errores.

---

## 9. Requisitos de Branching (RB)

### RB-01: Estrategia de Branches

**Estado:** Cumplido

| Branch | Proposito | Proteccion |
|---|---|---|
| `main` | Produccion | No push directo |
| `developFT` | Features generales | Merge desde PR |
| `developSuscription` | Suscripciones, planes, dashboard, i18n | Merge desde PR |
| `feature/i18n` | Implementacion i18n | Base para PR #2 |

### RB-02: Convencion de Commits

**Estado:** Cumplido

Estandar **Conventional Commits**:
- `feat:` — Nueva funcionalidad
- `fix:` — Correccion de bug
- `refactor:` — Refactorizacion sin cambio funcional
- `chore:` — Tareas de mantenimiento (deps, config)
- `docs:` — Documentacion

### RB-03: Workflow de PR

**Estado:** Cumplido

1. Crear branch `feature/<topic>` desde `developSuscription`.
2. Commits con prefijo `feat:` / `fix:` / etc.
3. Push a origin.
4. Crear PR contra `developSuscription` con descripcion detallada.
5. Review + CI green (lint + build + tsc).
6. Merge.

**PR activo**: [#2 — feat: add i18n support (es + en)](https://github.com/keniercb/fleet-frontend/pull/2)

---

## 10. Matriz de Trazabilidad

| ID | Requisito | Estado | Modulo | Archivo principal |
|----|-----------|--------|--------|---|
| RF-01 | Autenticacion JWT | ✅ Implementado | Auth | `LoginPage.tsx`, `AuthContext.tsx` |
| RF-02 | RBAC | ✅ Implementado | Auth/Routing | `ProtectedRoute.tsx`, `SuperAdminRoute.tsx` |
| RF-03 | Dashboard Ejecutivo | ✅ Implementado | Dashboard | `DashboardPage.tsx` |
| RF-04 | CRUD Generico | ✅ Implementado | Catalogs | `CrudPage.tsx`, `useCrud.ts` |
| RF-05 | Gestion Vehiculos | ✅ Implementado | Vehiculos | `VehiculosPage.tsx` |
| RF-06 | Gestion Choferes | ✅ Implementado | Choferes | `ChoferesPage.tsx` |
| RF-07 | Registro Recorridos | ✅ Implementado | Recorridos | `RecorridosPage.tsx` |
| RF-08 | Tarjetas Combustible | ✅ Implementado | Catalogs | `TarjetaCombustiblePage.tsx` |
| RF-09 | Reportes Operacionales | ✅ Implementado | Reportes | 4 archivos en `pages/reportes/` |
| RF-10 | Suscripciones y Planes | ✅ Implementado | Admin | `PlanPage.tsx`, `SubscriptionsPage.tsx`, `ComprarPlanesPage.tsx` |
| RF-11 | Gestion Empresas | ✅ Implementado | Catalogs | `EmpresaPage.tsx` |
| RF-12 | Admin Usuarios/Permisos | ✅ Implementado | Admin | `UsuariosPage.tsx`, `RolesPage.tsx`, `PermisosPage.tsx` |
| RF-13 | Sistema Toast | ✅ Implementado | UI | `ToastContext.tsx`, `ToastContainer.tsx` |
| RF-14 | Internacionalizacion | ✅ Implementado | i18n | `i18n/index.ts`, `i18n/types.ts`, 24 JSON |
| RF-15 | Pago Enzona (QR) | ✅ Implementado | Payment | `ComprarPlanesPage.tsx`, `endpoints.ts` (paymentsApi), `types/index.ts` |
| RNF-01 | Rendimiento bundle | ✅ 608 KB / 154 KB gzip | - | `vite.config.ts` |
| RNF-02 | Tiempo carga inicial | ✅ <2s (FCP) | - | Carga sincrona JSON |
| RNF-03 | TypeScript strict | ✅ Cumplido | - | `tsconfig.app.json` |
| RNF-04 | Lint sin errores | ✅ 0 errores | - | `oxlint` |
| RNF-05 | Compatibilidad navegadores | ✅ ES2020 | - | `tsconfig.app.json` |
| RNF-06 | Responsive | ✅ Cumplido | - | Tailwind breakpoints |
| RNF-07 | Accesibilidad | ⚠️ Parcial | - | Pendiente focus trap, ARIA |
| RNF-08 | Mantenibilidad | ✅ SOLID + DRY | - | CrudPage generico |
| RNF-09 | Escalabilidad | ✅ Server-side pagination | - | `useCrud.ts` |
| RNF-10 | Seguridad JWT | ✅ Cumplido | - | `api/client.ts` |
| RNF-11 | Manejo errores | ⚠️ Parcial | - | Pendiente Error Boundary |
| RNF-12 | Consistencia visual | ✅ Design system | - | `index.css` |
| RNF-13 | i18n sin FOUC | ✅ Carga sincrona | - | `i18n/index.ts` |
| RNF-14 | Persistencia UI | ✅ localStorage | - | `i18nextLng`, `token`, `user` |
| RNF-15 | Deteccion idioma | ✅ Cumplido | - | `LanguageDetector` |
| RNF-16 | Validacion claves i18n | ✅ Tipado fuerte | - | `i18n/types.ts` |
| RNF-17 | Formato locale-aware | ✅ Cumplido | - | `utils/format.ts` |
| RNF-18 | Sin regresiones | ✅ Todos RF OK | - | Build + dev server |
| RD-01 | Tokens color | ✅ Cumplido | - | `index.css` |
| RD-02 | Componentes DS | ✅ Cumplido | - | `index.css` @layer |
| RD-03 | Tipografia | ✅ Inter | - | `index.css` |
| RD-04 | Iconografia | ✅ lucide-react | - | imports |
| RD-05 | Layout responsive | ✅ Cumplido | - | `MainLayout.tsx`, `Sidebar.tsx` |
| RD-06 | Componentes consistentes | ✅ Cumplido | - | Modales, badges, tablas |
| RD-07 | Selector idioma | ✅ Cumplido | - | `TopNavbar.tsx` |
| RI-01 | Multi-idioma | ✅ es + en | i18n | `i18n/index.ts` |
| RI-02 | Deteccion automatica | ✅ Cumplido | i18n | `LanguageDetector` |
| RI-03 | Persistencia | ✅ localStorage | i18n | `i18nextLng` |
| RI-04 | Cambio runtime | ✅ Sin recarga | i18n | `LanguageSwitcher` |
| RI-05 | Cobertura completa | ✅ ~1.137 strings | i18n | 25 paginas |
| RI-06 | Namespaces | ✅ 12 | i18n | `i18n/index.ts` |
| RI-07 | Sin FOUC | ✅ Carga sincrona | i18n | imports ES |
| RI-08 | Tipado fuerte | ✅ CustomTypeOptions | i18n | `i18n/types.ts` |
| RI-09 | Interpolacion | ✅ `{{var}}` | i18n | JSON |
| RI-10 | Pluralizacion | ✅ `_one`/`_other` | i18n | JSON |
| RI-11 | Formato locale | ✅ Intl | i18n | `format.ts` |
| RI-12 | Mensajes backend | ✅ No traducidos | i18n | Politica |
| RI-13 | IDs tecnicos | ✅ No traducidos | i18n | Politica |
| RI-14 | Selector UI | ✅ TopNavbar | i18n | `TopNavbar.tsx` |
| RI-15 | Fallback es | ✅ fallbackLng | i18n | `i18n/index.ts` |
| RS-01 | Autenticacion JWT | ✅ Cumplido | Auth | `api/client.ts` |
| RS-02 | Almacenamiento | ⚠️ Parcial | Auth | Pendiente httpOnly cookies |
| RS-03 | Auto-logout 401 | ✅ Cumplido | Auth | interceptor |
| RS-04 | Proteccion rutas | ✅ Cumplido | Auth | `ProtectedRoute` |
| RS-05 | Menu filtrado | ✅ Cumplido | Auth | `getFilteredNavigation` |
| RS-06 | RBAC granular | ✅ Cumplido | Auth | permisos por entidad |
| RS-07 | XSS protection | ✅ Cumplido | - | React escape |
| RA-01 | API REST | ✅ Cumplido | API | backend Spring Boot |
| RA-02 | Axios | ✅ Cumplido | API | `api/client.ts` |
| RA-03 | Proxy dev | ✅ Cumplido | API | `vite.config.ts` |
| RA-04 | Contrato tipado | ✅ Cumplido | API | `types/index.ts` (70 tipos) |
| RT-01 | React 19 | ✅ ^19.2.8 | - | `package.json` |
| RT-02 | TypeScript 5.7 | ✅ ~5.7.0 | - | `package.json` |
| RT-03 | Vite 8 | ✅ ^8.2.0 | - | `package.json` |
| RT-04 | Tailwind 4 | ✅ ^4.3.3 | - | `package.json` |
| RT-05 | react-router-dom 6 | ✅ ^6.28.0 | - | `package.json` |
| RT-06 | Axios 1.19 | ✅ ^1.19.0 | - | `package.json` |
| RT-07 | lucide-react 1.31 | ✅ ^1.31.0 | - | `package.json` |
| RT-08 | Stack i18n | ✅ i18next 26 + react-i18next 17 | - | `package.json` |
| RT-09 | Oxlint | ✅ ^1.75.0 | - | `package.json` |
| RB-01 | Estrategia branches | ✅ Cumplido | DevOps | 4 branches |
| RB-02 | Commits semanticos | ✅ Conventional Commits | DevOps | `feat:`, `fix:`, etc. |
| RB-03 | Workflow PR | ✅ Cumplido | DevOps | PR #2 + branch `enzonaIntegration` |

---

## 11. Resumen de Estado

### Conteo por categoria

| Categoria | Total | Cumplido | Parcial | Pendiente |
|---|---:|---:|---:|---:|
| **RF** (Requisitos Funcionales) | 15 | 15 | 0 | 0 |
| **RNF** (Requisitos No Funcionales) | 18 | 16 | 2 | 0 |
| **RD** (Requisitos de Diseno) | 7 | 7 | 0 | 0 |
| **RI** (Requisitos de Internacionalizacion) | 15 | 15 | 0 | 0 |
| **RS** (Requisitos de Seguridad) | 7 | 6 | 1 | 0 |
| **RA** (Requisitos de API) | 4 | 4 | 0 | 0 |
| **RT** (Requisitos Tecnicos) | 9 | 9 | 0 | 0 |
| **RB** (Requisitos de Branching) | 3 | 3 | 0 | 0 |
| **TOTAL** | **78** | **75** | **3** | **0** |

**Tasa de cumplimiento: 96.2%**

### Requisitos parciales (3)

| ID | Requisito | Estado actual | Accion recomendada |
|---|---|---|---|
| RNF-07 | Accesibilidad | Labels y titles basicos OK | Agregar focus trap en modales, roles ARIA en tablas, navegacion por teclado en dropdowns |
| RNF-11 | Manejo de errores | Toasts y fallbacks OK | Agregar React Error Boundary, considerar Sentry |
| RS-02 | Almacenamiento JWT | localStorage OK | Migrar a httpOnly cookies para mayor seguridad |

### Metricas del proyecto

| Metrica | Valor |
|---|---|
| Total de archivos `.tsx`/`.ts` en `src/` | 55 |
| Lineas de codigo TypeScript/TSX | 10.428 |
| Interfaces/tipos exportados | 70 |
| Objetos API en `endpoints.ts` | 25 (incluye `paymentsApi`) |
| Paginas | 25 |
| Componentes compartidos | 15 |
| Custom Hooks | 1 (`useCrud`) |
| Context Providers | 2 (`AuthContext`, `ToastContext`) |
| Items de navegacion | 23 (en 4 secciones) |
| Namespaces i18n | 12 |
| Archivos JSON de traduccion | 24 (12 × 2 idiomas) |
| Strings i18n traducidos | ~1.137 |
| Tamanho del bundle (production) | 608 KB / 154 KB gzip |
| Dependencias de produccion | 10 |
| Dependencias de desarrollo | 7 |
| Endpoints de pago Enzona | 8 (create, findById, getStatus, getLocalStatus, retry, cancel, findByEmpresaId, getMyCompany) |

---

## 12. Apendice: Glosario

| Termino | Definicion |
|---|---|
| **i18n** | Abreviatura de "internacionalizacion" (18 letras entre la i y la n). |
| **l10n** | Abreviatura de "localizacion" (10 letras entre la l y la n). |
| **Locale** | Identificador de idioma y region, e.g., `es-ES`, `en-US`. |
| **Namespace** | Agrupacion logica de claves de traduccion (e.g., `common`, `auth`). |
| **Fallback** | Idioma o clave usada cuando la traduccion solicitada no existe. |
| **Interpolacion** | Sustitucion de variables en un string traducido (e.g., `{{name}}`). |
| **Pluralizacion** | Variacion del texto segun un count (uno/otros). |
| **FOUC** | "Flash of untranslated content" — parpadeo de texto sin traducir al cargar. |
| **RBAC** | Role-Based Access Control. |
| **CRUD** | Create, Read, Update, Delete. |
| **JWT** | JSON Web Token (estandar RFC 7519 para autenticacion stateless). |
| **SPA** | Single-Page Application. |
| **HMR** | Hot Module Replacement (Vite recarga modulos sin refresco completo). |
| **Enzona** | Pasarela de pago cubana que genera codigos QR para pago mediante apps bancarias. |
| **QR** | Quick Response code — codigo de barras bidimensional escaneable. |
| **Polling** | Tecnica de consulta periodica a un endpoint para detectar cambios de estado. |
| **Webhook** | Callback HTTP que Enzona envia al backend cuando un pago se completa. |
| **base64** | Esquema de codificacion binaria a texto, usado para embeber imagenes en HTML. |
| **PaymentStatus** | Enumeracion de 6 estados posibles de un pago Enzona. |
| **PaymentType** | Enumeracion de 3 tipos de pago (NUEVA_SUSCRIPCION, RENOVACION, UPGRADE). |
| **AD-XX** | Architectural Decision Record numero XX. |
| **RF / RNF / RD / RI / RS / RA / RT / RB** | Prefijos de categorias de requisitos (Funcional / No Funcional / Diseno / Internacionalizacion / Seguridad / API / Tecnico / Branching). |

---

*Documento generado a partir del analisis del codigo fuente en branch `enzonaIntegration` (commit `8eb2f34`). Refleja el estado final del proyecto despues de la implementacion de i18n (PR #2) y la integracion de pago Enzona (branch `enzonaIntegration`).*
