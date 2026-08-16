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
  Link2,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  permission: string | null;
}

export const navigationConfig: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    permission: null,
  },
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
    id: 'empresas',
    label: 'Empresas',
    path: '/empresas',
    icon: Building2,
    permission: 'EMPRESAS_READ',
  },
  {
    id: 'marcas',
    label: 'Marcas',
    path: '/marcas',
    icon: Tag,
    permission: 'MARCAS_READ',
  },
  {
    id: 'tipos-vehiculo',
    label: 'Tipos de Vehículo',
    path: '/tipos-vehiculo',
    icon: CreditCard,
    permission: 'TIPOS_VEHICULO_READ',
  },
  {
    id: 'tipos-combustible',
    label: 'Tipos de Combustible',
    path: '/tipos-combustible',
    icon: Fuel,
    permission: 'TIPOS_COMBUSTIBLE_READ',
  },
  {
    id: 'categorias-licencia',
    label: 'Categorías Licencia',
    path: '/categorias-licencia',
    icon: FileBadge,
    permission: 'CATEGORIAS_LICENCIA_READ',
  },
  {
    id: 'users',
    label: 'Usuarios',
    path: '/usuarios',
    icon: Users,
    permission: 'USUARIOS_READ',
  },
  {
    id: 'roles',
    label: 'Roles',
    path: '/roles',
    icon: Shield,
    permission: 'ROLES_READ',
  },
  {
    id: 'permissions',
    label: 'Permisos',
    path: '/permisos',
    icon: Key,
    permission: 'PERMISOS_READ',
  },
  {
    id: 'choferes-categorias',
    label: 'Licencias Choferes',
    path: '/choferes-categorias',
    icon: Link2,
    permission: 'CHOFERES_CATEGORIAS_READ',
  },
];

export function getFilteredNavigation(
  hasPermission: (name: string) => boolean,
  isAdmin: () => boolean
): NavItem[] {
  if (isAdmin()) {
    return navigationConfig;
  }
  return navigationConfig.filter(
    (item) => item.permission === null || hasPermission(item.permission)
  );
}
