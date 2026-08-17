import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { empresasApi } from '@/api/endpoints';
import type { EmpresaRequest, EmpresaResponse } from '@/types';

const columns: ColumnDef<EmpresaResponse>[] = [
  { key: 'codigo', label: 'Código' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'email', label: 'Email' },
];

const formFields: FormFieldDef[] = [
  {
    key: 'codigo',
    label: 'Código',
    type: 'text',
    placeholder: 'Ej: EMP-001',
    required: true,
  },
  {
    key: 'nombre',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Ej: Transportes del Sur S.A.',
    required: true,
  },
  {
    key: 'direccion',
    label: 'Dirección',
    type: 'text',
    placeholder: 'Ej: Calle 5 #123, Habana',
    colSpan: 2,
  },
  {
    key: 'telefono',
    label: 'Teléfono',
    type: 'text',
    placeholder: 'Ej: +53 5 1234567',
  },
  {
    key: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'Ej: contacto@empresa.cu',
  },
];

const config: CrudPageConfig<EmpresaRequest, EmpresaResponse> = {
  title: 'Empresas',
  singular: 'Empresa',
  description: 'Gestión de las empresas del sistema',
  permission: 'EMPRESAS_READ',
  api: empresasApi,
  columns,
  formFields,
  getFormDefaultValues: () => ({ codigo: '', nombre: '', direccion: '', telefono: '', email: '' }),
  getFormValuesFromEntity: (e) => ({
    codigo: e.codigo,
    nombre: e.nombre,
    direccion: e.direccion ?? '',
    telefono: e.telefono ?? '',
    email: e.email ?? '',
  }),
  getId: (e) => e.id,
  getIsActive: (e) => e.activo,
};

export default function EmpresaPage() {
  return <CrudPage config={config} />;
}
