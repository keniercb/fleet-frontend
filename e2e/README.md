# fleet-e2e-cypress

Pruebas E2E (Cypress 14 + TypeScript) para **fleet-frontend** — rama `enzonaIntegration`.
Cubren cuatro módulos críticos: **autenticación/sesión**, **gestión de flota (vehículos y choferes)**, **pagos Enzona (comprar plan)** y **navegación/errores**.

---

## 1. Requisitos previos

| Requisito | Detalle |
|---|---|
| Node.js | ≥ 20 LTS |
| Frontend levantado | `npm run dev` en `frontend/` (Vite en `http://localhost:5173`) **o** un build desplegado en staging |
| Backend real | Spring Boot en `localhost:8081` (el proxy de Vite redirige `/api`) **o** accesible por URL |
| Datos mínimos | Usuario ADMIN de pruebas · al menos un plan activo · catálogos (tipos de vehículo, marcas, tipos de combustible) con registros |

> Este proyecto vive dentro del repositorio, en la carpeta `e2e/` del nivel raíz:
> `fleet-frontend/e2e/`.

## 2. Instalación

```bash
cd e2e
npm install
```

## 3. Configuración

Copia `.env.example` a `.env` y ajusta los valores. Cypress solo lee variables con prefijo `CYPRESS_`:

```bash
CYPRESS_baseUrl=http://localhost:5173     # frontend bajo prueba
CYPRESS_apiUrl=                            # vacío ⇒ <baseUrl>/api (proxy Vite)
CYPRESS_usuario=admin@empresa.cu           # usuario ADMIN real del entorno
CYPRESS_password=**********
CYPRESS_mockEstadosPago=true               # véase §6
```

Alternativa interactiva: `cypress.env.json` (git-ignorado) o `npx cypress open --env usuario=...`.

## 4. Ejecución

```bash
npm run e2e:open        # modo interactivo (watcher + selector de specs)
npm run e2e:headless    # suite completa (headless, 2 reintentos por fallo)
npm run e2e:smoke       # solo @smoke (pipeline rápido)
npm run e2e:pagos       # solo módulo de pagos Enzona
npm run e2e:flota       # solo CRUD de vehículos y choferes
npm run e2e:auth        # solo login y sesión
npm run typecheck       # validación de tipos sin ejecutar
```

## 5. Estructura del proyecto

```
e2e/
├── cypress.config.ts            # baseUrl, timeouts, reintentos, env por defecto
├── cypress/
│   ├── e2e/
│   │   ├── auth/
│   │   │   ├── autenticacion-login.cy.ts    # login UI (éxito, 401, 500, HTML5, carga)
│   │   │   └── autenticacion-sesion.cy.ts   # logout, guards, 401, F5, 403
│   │   ├── flota/
│   │   │   ├── vehiculos-crud.cy.ts         # CRUD completo de vehículos
│   │   │   └── choferes-crud.cy.ts          # CRUD completo de choferes
│   │   ├── pagos/
│   │   │   └── comprar-plan-enzona.cy.ts    # flujo Enzona completo
│   │   └── navegacion/
│   │       └── estructura-errores.cy.ts     # 404→/, CrudPage, 500, idioma
│   ├── fixtures/                # plantillas de datos y estados de pago
│   └── support/
│       ├── e2e.ts               # hooks globales (idioma es, uncaught:exception)
│       ├── commands.ts          # loginPorApi, datosUnicos, limpieza por API…
│       ├── types.ts             # DTOs espejo del backend
│       ├── api/interceptores.ts # aliases cy.intercept reutilizables
│       └── pages/               # Page Object Model
│           ├── BasePage.ts
│           ├── LoginPage.ts
│           ├── MainLayoutPage.ts
│           ├── TablaCrudPage.ts      # CrudPage genérico (catálogos)
│           ├── VehiculosPage.ts
│           ├── ChoferesPage.ts
│           └── ComprarPlanesPage.ts
└── .github/workflows/e2e.yml    # GitHub Actions (smoke en push, completa nocturna)
```

**¿Por qué Page Object Model?** La app usa componentes genéricos (`CrudPage`, `Modal`, `ConfirmModal`, toasts) compartidos por 10+ catálogos. Centralizando localizadores en POMs, un cambio de DOM se corrige en un solo archivo y los specs se leen como casos de negocio.

## 6. Estrategia de backend e interceptores

Con **backend real**, `cy.intercept` actúa como **espía** (observa sin alterar) en todo el flujo: todas las esperas son `cy.wait('@alias')` sobre peticiones reales.

Excepciones documentadas:

1. **Transiciones del pago Enzona** (`CYPRESS_mockEstadosPago=true`): `GET /payments/{id}/status` y `POST /payments/{id}/retry` se simulan porque los estados `PAGADO/FALLIDO/EXPIRADO` requieren que un humano escanee el QR real. Con `false`, esos tests se omiten automáticamente y solo corre la integración pura (crear pago + cancelar).
2. **Escenarios de error** (500): se stubbean endpoints puntuales para probar la resiliencia de la UI.

## 7. Estrategia de datos

- Datos únicos por ejecución (`cy.datosUnicos`, sufijo temporal) → la suite es **repetible y paralelizable** contra el mismo entorno.
- **Limpieza por API** en `after()` (`cy.limpiarVehiculoPorMatricula`, `cy.limpiarChoferPorCarne`) → no deja registros huérfanos.
- Los pagos creados se **cancelan al final** de cada escenario que no termine en `PAGADO`.
- Credenciales **solo** por variables de entorno o secrets — nunca en el repositorio.

## 8. Selectores: jerarquía recomendada

1. `data-cy` / `data-testid` (ideal — pendiente de añadir en la app; ver §10)
2. IDs estables existentes: `#email`, `#password`, `#plan-select`, `#facturacion-anual`, `#matricula`, `#modelo`, `#nombre`…
3. Rol/atributo: `form button[type="submit"]`, `button[title="Editar"]`, `img[alt="QR Enzona"]`
4. Texto i18n **español** (determinista: `e2e.ts` fija `i18nextLng=es` en `window:before:load`, porque el detector de idioma usaría `en-US` del navegador headless)

## 9. CI (GitHub Actions)

`.github/workflows/e2e.yml` (copiar al nivel raíz del repositorio):

- **push** a `main`/`enzonaIntegration` → suite `@smoke`
- **schedule** (cron L-V 06:00 UTC) y `workflow_dispatch` → suite completa
- Secrets: `E2E_BASE_URL`, `E2E_API_URL`, `E2E_USUARIO`, `E2E_PASSWORD` (+ opcionales del usuario sin permisos)
- En fallo sube capturas y vídeos (retención 14 días)

## 10. Recomendaciones a la app (mejora de testeabilidad)

- Añadir **`data-testid`** sistemático a botones/tablas/modales/badges (p. ej. `data-testid="payment-modal.status-badge"`); permite migrar los POMs a `data-cy` sin depender de textos i18n.
- El interceptor 401 de `api/client.ts` recarga la página en el propio **login fallido**, borrando el mensaje de error: excluir la ruta `/auth/login` del hard-redirect mejoraría la UX y la verificabilidad.
- El polling de pago usa `setInterval` sin límite de intentos; un `maxRetries` + estado `EXPIRADO` local haría el flujo más robusto offline.

## 11. Solución de problemas

| Síntoma | Causa probable |
|---|---|
| `loginPorApi falló (0)` | Backend no accesible — revisa `CYPRESS_apiUrl`/proxy |
| Tests fallan en textos de UI | Falta la inyección de `i18nextLng` (ocurre si se elimina `e2e.ts`) |
| `PAG-02` omitido | Solo hay un plan activo en el entorno |
| `SES-05` omitido | `CYPRESS_usuarioSinPermisos` sin configurar |
| Fallo en VEH-02 por selects vacíos | Catálogos sin registros activos en el entorno |
