import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Car,
  Users,
  Shield,
  Key,
  Building2,
  UserCog,
  Fuel,
  Tag,
  CreditCard,
  Route,
  FileBadge,
  Settings,
  BookOpen,
  Truck,
  Banknote,
  Wallet,
  Layers,
  Sparkles,
  MapPin,
  Receipt,
  BarChart3,
  Wrench,
} from 'lucide-react';

export type RequiredRole = 'SUPER_ADMIN' | 'ADMIN' | null;

export interface NavItem {
  id: string;
  /** i18n key, e.g. 'navigation:items.roles' */
  labelKey: string;
  path: string;
  icon: LucideIcon;
  requiredRole: RequiredRole;
}

export interface NavSection {
  id: string;
  /** i18n key, e.g. 'navigation:sections.administracion' */
  labelKey: string;
  icon: LucideIcon;
  items: NavItem[];
}

export const navigationConfig: NavSection[] = [
  {
    id: 'administracion',
    labelKey: 'navigation:sections.administracion',
    icon: Settings,
    items: [
      {
        id: 'roles',
        labelKey: 'navigation:items.roles',
        path: '/roles',
        icon: Shield,
        requiredRole: 'SUPER_ADMIN',
      },
      {
        id: 'users',
        labelKey: 'navigation:items.users',
        path: '/usuarios',
        icon: Users,
        requiredRole: 'ADMIN',
      },
      {
        id: 'permissions',
        labelKey: 'navigation:items.permissions',
        path: '/permisos',
        icon: Key,
        requiredRole: 'SUPER_ADMIN',
      },
      {
        id: 'empresas',
        labelKey: 'navigation:items.empresas',
        path: '/empresas',
        icon: Building2,
        requiredRole: 'SUPER_ADMIN',
      },
      {
        id: 'comprar-plan',
        labelKey: 'navigation:items.comprarPlan',
        path: '/comprar-plan',
        icon: CreditCard,
        requiredRole: 'ADMIN',
      },
      {
        id: 'suscripciones',
        labelKey: 'navigation:items.suscripciones',
        path: '/suscripciones',
        icon: Receipt,
        requiredRole: 'SUPER_ADMIN',
      },
    ],
  },
  {
    id: 'catalogos',
    labelKey: 'navigation:sections.catalogos',
    icon: BookOpen,
    items: [
      {
        id: 'provincias',
        labelKey: 'navigation:items.provincias',
        path: '/provincias',
        icon: MapPin,
        requiredRole: 'SUPER_ADMIN',
      },
      {
        id: 'municipios',
        labelKey: 'navigation:items.municipios',
        path: '/municipios',
        icon: MapPin,
        requiredRole: 'SUPER_ADMIN',
      },
      {
        id: 'marcas',
        labelKey: 'navigation:items.marcas',
        path: '/marcas',
        icon: Tag,
        requiredRole: 'SUPER_ADMIN',
      },
      {
        id: 'tipos-combustible',
        labelKey: 'navigation:items.tiposCombustible',
        path: '/tipos-combustible',
        icon: Fuel,
        requiredRole: 'SUPER_ADMIN',
      },
      {
        id: 'tipos-vehiculo',
        labelKey: 'navigation:items.tiposVehiculo',
        path: '/tipos-vehiculo',
        icon: CreditCard,
        requiredRole: 'SUPER_ADMIN',
      },
      {
        id: 'categorias-licencia',
        labelKey: 'navigation:items.categoriasLicencia',
        path: '/categorias-licencia',
        icon: FileBadge,
        requiredRole: 'SUPER_ADMIN',
      },
      {
        id: 'monedas',
        labelKey: 'navigation:items.monedas',
        path: '/monedas',
        icon: Banknote,
        requiredRole: 'SUPER_ADMIN',
      },
      {
        id: 'features',
        labelKey: 'navigation:items.features',
        path: '/features',
        icon: Sparkles,
        requiredRole: 'SUPER_ADMIN',
      },
      {
        id: 'planes',
        labelKey: 'navigation:items.planes',
        path: '/planes',
        icon: Layers,
        requiredRole: 'SUPER_ADMIN',
      },
    ],
  },
  {
    id: 'reportes',
    labelKey: 'navigation:sections.reportes',
    icon: BarChart3,
    items: [
      {
        id: 'consumo-vehiculo',
        labelKey: 'navigation:items.consumoVehiculo',
        path: '/reportes/consumo-vehiculo',
        icon: BarChart3,
        requiredRole: 'ADMIN',
      },
      {
        id: 'mantenimiento',
        labelKey: 'navigation:items.mantenimiento',
        path: '/reportes/mantenimiento',
        icon: Wrench,
        requiredRole: 'ADMIN',
      },
      {
        id: 'abastecimiento',
        labelKey: 'navigation:items.abastecimiento',
        path: '/reportes/abastecimiento',
        icon: Fuel,
        requiredRole: 'ADMIN',
      },
      {
        id: 'consumo-combustible',
        labelKey: 'navigation:items.consumoCombustible',
        path: '/reportes/consumo-combustible',
        icon: BarChart3,
        requiredRole: 'ADMIN',
      },
    ],
  },
  {
    id: 'transporte',
    labelKey: 'navigation:sections.transporte',
    icon: Truck,
    items: [
      {
        id: 'vehiculos',
        labelKey: 'navigation:items.vehiculos',
        path: '/vehiculos',
        icon: Car,
        requiredRole: 'ADMIN',
      },
      {
        id: 'choferes',
        labelKey: 'navigation:items.choferes',
        path: '/choferes',
        icon: UserCog,
        requiredRole: 'ADMIN',
      },
      {
        id: 'recorridos',
        labelKey: 'navigation:items.recorridos',
        path: '/recorridos',
        icon: Route,
        requiredRole: null,
      },
      {
        id: 'tarjetas-combustible',
        labelKey: 'navigation:items.tarjetasCombustible',
        path: '/tarjetas-combustible',
        icon: Wallet,
        requiredRole: 'ADMIN',
      },
    ],
  },
];

export function getFilteredNavigation(
  isSuperAdmin: () => boolean,
  isAdmin: () => boolean
): NavSection[] {
  const filterItems = (items: NavItem[]) => {
    return items.filter((item) => {
      if (item.requiredRole === null) return true;
      if (item.requiredRole === 'ADMIN') return isSuperAdmin() || isAdmin();
      if (item.requiredRole === 'SUPER_ADMIN') return isSuperAdmin();
      return true;
    });
  };

  return navigationConfig
    .map((section) => ({
      ...section,
      items: filterItems(section.items),
    }))
    .filter((section) => section.items.length > 0);
}
