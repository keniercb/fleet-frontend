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
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  permission: string | null;
}

export interface NavSection {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

export const navigationConfig: NavSection[] = [
  {
    id: 'administracion',
    label: 'Administración',
    icon: Settings,
    items: [
      {
        id: 'roles',
        label: 'Roles',
        path: '/roles',
        icon: Shield,
        permission: 'ROLES_READ',
      },
      {
        id: 'users',
        label: 'Usuarios',
        path: '/usuarios',
        icon: Users,
        permission: 'USUARIOS_READ',
      },
      {
        id: 'permissions',
        label: 'Permisos',
        path: '/permisos',
        icon: Key,
        permission: 'PERMISOS_READ',
      },
      {
        id: 'empresas',
        label: 'Empresas',
        path: '/empresas',
        icon: Building2,
        permission: 'EMPRESAS_READ',
      },
    ],
  },
  {
    id: 'catalogos',
    label: 'Catálogos',
    icon: BookOpen,
    items: [
      {
        id: 'marcas',
        label: 'Marcas',
        path: '/marcas',
        icon: Tag,
        permission: 'MARCAS_READ',
      },
      {
        id: 'tipos-combustible',
        label: 'Tipo de Combustible',
        path: '/tipos-combustible',
        icon: Fuel,
        permission: 'TIPOS_COMBUSTIBLE_READ',
      },
      {
        id: 'tipos-vehiculo',
        label: 'Tipo de Vehículo',
        path: '/tipos-vehiculo',
        icon: CreditCard,
        permission: 'TIPOS_VEHICULO_READ',
      },
      {
        id: 'categorias-licencia',
        label: 'Categoría de Licencia',
        path: '/categorias-licencia',
        icon: FileBadge,
        permission: 'CATEGORIAS_LICENCIA_READ',
      },
      {
        id: 'monedas',
        label: 'Monedas',
        path: '/monedas',
        icon: Banknote,
        permission: 'CURRENCIES_READ',
      },
    ],
  },
  {
    id: 'transporte',
    label: 'Control de Transporte',
    icon: Truck,
    items: [
      {
        id: 'vehiculos',
        label: 'Vehículos',
        path: '/vehiculos',
        icon: Car,
        permission: 'VEHICULOS_READ',
      },
      {
        id: 'choferes',
        label: 'Choferes',
        path: '/choferes',
        icon: UserCog,
        permission: 'CHOFERES_READ',
      },
      {
        id: 'recorridos',
        label: 'Recorridos',
        path: '/recorridos',
        icon: Route,
        permission: 'RECORRIDOS_READ',
      },
      {
        id: 'tarjetas-combustible',
        label: 'Tarjetas de Combustible',
        path: '/tarjetas-combustible',
        icon: Wallet,
        permission: 'TARJETAS_COMBUSTIBLE_READ',
      },
    ],
  },
];

export function getFilteredNavigation(
  hasPermission: (name: string) => boolean,
  isAdmin: () => boolean
): NavSection[] {
  const filterItems = (items: NavItem[]) => {
    if (isAdmin()) return items;
    return items.filter(
      (item) => item.permission === null || hasPermission(item.permission)
    );
  };

  return navigationConfig
    .map((section) => ({
      ...section,
      items: filterItems(section.items),
    }))
    .filter((section) => section.items.length > 0);
}
