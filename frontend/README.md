# Fleet Management Frontend

React 19 + Vite 8 + TypeScript 5.7 SPA para gestión de flota vehicular.

## Internacionalización (i18n)

La aplicación utiliza **react-i18next** con **i18next-browser-languagedetector**.

### Idiomas soportados

- `es` (Español) — idioma por defecto
- `en` (English)

### Detección y persistencia

El orden de detección es: `localStorage` → `navigator.language` → `<html lang>` → fallback (`es`).
La preferencia del usuario se persiste en `localStorage` bajo la clave `i18nextLng`.

### Selector de idioma

Disponible en el `TopNavbar` (icono de globo terráqueo con el código ISO del idioma actual).

### Estructura de carpetas

```
frontend/
├── public/locales/
│   ├── es/
│   │   ├── common.json       (botones, estados, validaciones)
│   │   ├── navigation.json   (menú lateral + topnavbar)
│   │   ├── auth.json         (login, perfil, cambio contraseña)
│   │   ├── dashboard.json    (dashboard ejecutivo)
│   │   ├── crud.json         (componente CrudPage genérico)
│   │   ├── catalogs.json     (11 catálogos config-only)
│   │   ├── vehiculos.json
│   │   ├── choferes.json
│   │   ├── recorridos.json
│   │   ├── admin.json        (usuarios, roles, permisos, planes, suscripciones)
│   │   ├── reportes.json     (4 reportes operacionales)
│   │   └── errors.json       (fallbacks de error)
│   └── en/
│       └── ... (mismos namespaces)
└── src/
    ├── i18n/
    │   └── index.ts          # inicialización de i18next
    └── utils/
        ├── format.ts         # formatDate, formatNumber, formatCurrency, getMonthName
        └── statusLabels.ts   # useSubscriptionStatusInfo, useMantenimientoStatusInfo
```

### Cómo usar traducciones en un componente

```tsx
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t } = useTranslation(['namespace1', 'common']);

  return <h1>{t('namespace1:title')}</h1>;
}
```

### Cómo agregar una nueva clave i18n

1. Abre el archivo correspondiente en `public/locales/es/<namespace>.json`.
2. Agrega la clave con el valor en español.
3. Replica la misma clave en `public/locales/en/<namespace>.json` con la traducción al inglés.
4. Usa la clave en el componente: `t('namespace:clave.subclave')`.

### Cómo agregar un nuevo idioma (ej.: `pt-BR`)

1. Crea la carpeta `public/locales/pt-BR/` con los 12 archivos JSON (puedes copiar de `es/` como plantilla).
2. Edita `src/i18n/index.ts`:
   - Importa todos los JSON del nuevo idioma.
   - Agrégalos al objeto `resources`.
   - Agrega `'pt-BR'` a `SUPPORTED_LANGUAGES`.
3. (Opcional) Agrega el botón en el `LanguageSwitcher` del `TopNavbar`.

### Helpers centralizados de formato

- `formatDate(date, format)` — formato `short` | `long` | `iso` | `monthYear` | `monthLong`
- `formatNumber(value, decimals)`
- `formatCurrency(value, currency)` — default `USD`
- `formatPercent(value, decimals)`
- `getMonthName(monthNumber)` y `getMonthNames()` — meses en el locale activo

Todos los helpers leen automáticamente el idioma activo de `i18n.language`.

### Helpers de status

- `useSubscriptionStatusInfo()` — hook que retorna una función `(status) => { label, badgeClass }`
- `useMantenimientoStatusInfo()` — hook que retorna una función `(estado) => { label, bg, text, iconClass }`

### Política de mensajes del backend

Los mensajes del backend (`error.response.data.message`) **no se traducen** en el frontend; se muestran crudos como vienen. Solo se traducen los fallbacks del front definidos en `errors.json`.

### IDs técnicos (no traducidos)

Strings como `ADMIN`, `SUPER_ADMIN`, `USUARIOS_CREATE`, etc. se muestran crudos porque son identificadores técnicos del contrato RBAC con el backend.

---

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción |
| `npm run lint` | Linter (oxlint) |
| `npm run preview` | Preview del build de producción |

## Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | URL base de la API backend |

## Configuración de Vite

- Path alias: `@/` mapea a `src/`
- Proxy: en desarrollo, `/api` se proxean al backend Spring Boot en `http://localhost:8081`
