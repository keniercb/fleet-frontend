import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { empresasApi, provinciasApi, municipiosApi } from '@/api/endpoints';
import type { EmpresaRequest, EmpresaResponse } from '@/types';

const columns: ColumnDef<EmpresaResponse>[] = [
  { key: 'codigo', label: 'Codigo' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'provincia', label: 'Provincia', render: (item) => item.provincia?.nombre ?? '—' },
  { key: 'municipio', label: 'Municipio', render: (item) => item.municipio?.nombre ?? '—' },
  { key: 'direccion', label: 'Direccion' },
  { key: 'telefono', label: 'Telefono' },
  { key: 'email', label: 'Email' },
];

const formFields: FormFieldDef[] = [
  {
    key: 'codigo',
    label: 'Codigo',
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
    colSpan: 2,
  },
  {
    key: 'provinciaId',
    label: 'Provincia',
    type: 'select',
    asyncOptions: async () => {
      try {
        const res = await provinciasApi.findAll({ page: 0, perPage: 500 });
        return res.data.content.filter((p) => p.activo).map((p) => ({ label: p.nombre, value: p.id }));
      } catch { return []; }
    },
    onChange: (value) => {
      // When provincia changes, reload municipio options
      return;
    },
  },
  {
    key: 'municipioId',
    label: 'Municipio',
    type: 'select',
    asyncOptions: async () => {
      try {
        const res = await municipiosApi.findAll({ page: 0, perPage: 999 });
        return res.data.content.filter((m) => m.activo).map((m) => ({ label: m.nombre, value: m.id }));
      } catch { return []; }
    },
  },
  {
    key: 'direccion',
    label: 'Direccion',
    type: 'text',
    placeholder: 'Ej: Calle 5 #123, Habana',
    colSpan: 2,
  },
  {
    key: 'telefono',
    label: 'Telefono',
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
  description: 'Gestion de las empresas del sistema',
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
    provinciaId: e.provincia?.id,
    municipioId: e.municipio?.id,
  }),
  getId: (e) => e.id,
  getIsActive: (e) => e.activo,
};

export default function EmpresaPage() {
  return <CrudPage config={config} />;
}
