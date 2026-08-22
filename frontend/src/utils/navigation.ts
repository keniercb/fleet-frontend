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

export type RequiredRole = 'SUPER_ADMIN' | 'ADMIN' | null;

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  requiredRole: RequiredRole;
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
        requiredRole: 'SUPER_ADMIN',
      },
      {
        id: 'users',
        label: 'Usuarios',
        path: '/usuarios',
        icon: Users,
        requiredRole: 'ADMIN',
      },
      {
        id: 'permissions',
        label: 'Permisos',
        path: '/permisos',
        icon: Key,
        requiredRole: 'SUPER_ADMIN',
      },
      {
        id: 'empresas',
        label: 'Empresas',
        path: '/empresas',
        icon: Building2,
        requiredRole: 'SUPER_ADMIN',
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
        requiredRole: 'SUPER_ADMIN',
      },
      {
        id: 'tipos-combustible',
        label: 'Tipo de Combustible',
        path: '/tipos-combustible',
        icon: Fuel,
        requiredRole: 'SUPER_ADMIN',
      },
      {
        id: 'tipos-vehiculo',
        label: 'Tipo de Vehículo',
        path: '/tipos-vehiculo',
        icon: CreditCard,
        requiredRole: 'SUPER_ADMIN',
      },
      {
        id: 'categorias-licencia',
        label: 'Categoría de Licencia',
        path: '/categorias-licencia',
        icon: FileBadge,
        requiredRole: 'SUPER_ADMIN',
      },
      {
        id: 'monedas',
        label: 'Monedas',
        path: '/monedas',
        icon: Banknote,
        requiredRole: 'SUPER_ADMIN',
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
        requiredRole: 'ADMIN',
      },
      {
        id: 'choferes',
        label: 'Choferes',
        path: '/choferes',
        icon: UserCog,
        requiredRole: 'ADMIN',
      },
      {
        id: 'recorridos',
        label: 'Recorridos',
        path: '/recorridos',
        icon: Route,
        requiredRole: null,
      },
      {
        id: 'tarjetas-combustible',
        label: 'Tarjetas de Combustible',
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
