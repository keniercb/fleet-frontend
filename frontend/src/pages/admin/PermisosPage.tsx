import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { permissionsApi } from '@/api/endpoints';
import type { PermissionRequest, PermissionResponse } from '@/types';

const columns: ColumnDef<PermissionResponse>[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'description', label: 'Descripción' },
];

const formFields: FormFieldDef[] = [
  {
    key: 'name',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Ej: USUARIOS_CREATE',
    required: true,
  },
  {
    key: 'description',
    label: 'Descripción',
    type: 'text',
    placeholder: 'Ej: Permite crear nuevos usuarios',
    colSpan: 2,
  },
];

const config: CrudPageConfig<PermissionRequest, PermissionResponse> = {
  title: 'Permisos',
  singular: 'Permiso',
  description: 'Gestión de los permisos del sistema',
  permission: 'PERMISOS_READ',
  api: permissionsApi,
  columns,
  formFields,
  getFormDefaultValues: () => ({ name: '', description: '' }),
  getFormValuesFromEntity: (e) => ({
    name: e.name,
    description: e.description ?? '',
  }),
  getId: (e) => e.id,
  getIsActive: (e) => e.activo,
};

export default function PermisosPage() {
  return <CrudPage config={config} />;
}
