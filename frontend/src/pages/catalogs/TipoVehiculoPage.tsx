import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { tiposVehiculoApi } from '@/api/endpoints';
import type { TipoVehiculoRequest, TipoVehiculoResponse } from '@/types';

const columns: ColumnDef<TipoVehiculoResponse>[] = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'descripcion', label: 'Descripción' },
];

const formFields: FormFieldDef[] = [
  {
    key: 'nombre',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Ej: Camioneta',
    required: true,
  },
  {
    key: 'descripcion',
    label: 'Descripción',
    type: 'textarea',
    placeholder: 'Descripción opcional',
    colSpan: 2,
  },
];

const config: CrudPageConfig<TipoVehiculoRequest, TipoVehiculoResponse> = {
  title: 'Tipos de Vehículo',
  singular: 'Tipo de vehículo',
  description: 'Gestión de los tipos de vehículos del sistema',
  permission: 'TIPOS_VEHICULO_READ',
  api: tiposVehiculoApi,
  columns,
  formFields,
  getFormDefaultValues: () => ({ nombre: '', descripcion: '' }),
  getFormValuesFromEntity: (e) => ({
    nombre: e.nombre,
    descripcion: e.descripcion ?? '',
  }),
  getId: (e) => e.id,
  getIsActive: (e) => e.activo,
};

export default function TipoVehiculoPage() {
  return <CrudPage config={config} />;
}
