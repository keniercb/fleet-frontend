import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { tiposCombustibleApi } from '@/api/endpoints';
import type { TipoCombustibleRequest, TipoCombustibleResponse } from '@/types';

const columns: ColumnDef<TipoCombustibleResponse>[] = [
  { key: 'codigo', label: 'Código' },
  { key: 'denominacion', label: 'Denominación' },
  { key: 'descripcion', label: 'Descripción' },
];

const formFields: FormFieldDef[] = [
  {
    key: 'codigo',
    label: 'Código',
    type: 'text',
    placeholder: 'Ej: DIESEL',
    required: true,
  },
  {
    key: 'denominacion',
    label: 'Denominación',
    type: 'text',
    placeholder: 'Ej: Diésel',
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

const config: CrudPageConfig<TipoCombustibleRequest, TipoCombustibleResponse> = {
  title: 'Tipos de Combustible',
  description: 'Gestión de los tipos de combustible del sistema',
  permission: 'TIPOS_COMBUSTIBLE_READ',
  api: tiposCombustibleApi,
  columns,
  formFields,
  getFormDefaultValues: () => ({ codigo: '', denominacion: '', descripcion: '' }),
  getFormValuesFromEntity: (e) => ({
    codigo: e.codigo,
    denominacion: e.denominacion,
    descripcion: e.descripcion ?? '',
  }),
  getId: (e) => e.id,
  getIsActive: (e) => e.activo,
};

export default function TipoCombustiblePage() {
  return <CrudPage config={config} />;
}
