import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { marcasApi } from '@/api/endpoints';
import type { MarcaRequest, MarcaResponse } from '@/types';

const columns: ColumnDef<MarcaResponse>[] = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'paisOrigen', label: 'País de Origen' },
];

const formFields: FormFieldDef[] = [
  {
    key: 'nombre',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Ej: Toyota',
    required: true,
  },
  {
    key: 'paisOrigen',
    label: 'País de Origen',
    type: 'text',
    placeholder: 'Ej: Japón',
  },
  {
    key: 'descripcion',
    label: 'Descripción',
    type: 'textarea',
    placeholder: 'Descripción opcional',
    colSpan: 2,
  },
];

const config: CrudPageConfig<MarcaRequest, MarcaResponse> = {
  title: 'Marcas',
  description: 'Gestión de las marcas de vehículos',
  permission: 'MARCAS_READ',
  api: marcasApi,
  columns,
  formFields,
  getFormDefaultValues: () => ({ nombre: '', descripcion: '', paisOrigen: '' }),
  getFormValuesFromEntity: (e) => ({
    nombre: e.nombre,
    descripcion: e.descripcion ?? '',
    paisOrigen: e.paisOrigen ?? '',
  }),
  getId: (e) => e.id,
  getIsActive: (e) => e.activo,
};

export default function MarcaPage() {
  return <CrudPage config={config} />;
}
