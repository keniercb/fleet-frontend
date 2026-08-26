import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { provinciasApi } from '@/api/endpoints';
import type { ProvinciaRequest, ProvinciaResponse } from '@/types';

const columns: ColumnDef<ProvinciaResponse>[] = [
  { key: 'codigo', label: 'Codigo' },
  { key: 'nombre', label: 'Nombre' },
];

const formFields: FormFieldDef[] = [
  {
    key: 'codigo',
    label: 'Codigo',
    type: 'number',
    placeholder: 'Ej: 1',
    required: true,
  },
  {
    key: 'nombre',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Ej: La Habana',
    required: true,
  },
];

const config: CrudPageConfig<ProvinciaRequest, ProvinciaResponse> = {
  title: 'Provincias',
  singular: 'Provincia',
  description: 'Gestion de las provincias',
  permission: 'PROVINCIAS_READ',
  api: provinciasApi,
  columns,
  formFields,
  getFormDefaultValues: () => ({ codigo: 0, nombre: '' }),
  getFormValuesFromEntity: (e) => ({
    codigo: e.codigo,
    nombre: e.nombre,
  }),
  getId: (e) => e.id,
  getIsActive: (e) => e.activo,
};

export default function ProvinciaPage() {
  return <CrudPage config={config} />;
}
