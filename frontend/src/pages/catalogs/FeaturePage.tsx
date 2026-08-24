import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { featuresApi } from '@/api/endpoints';
import type { FeatureRequest, FeatureResponse } from '@/types';

const columns: ColumnDef<FeatureResponse>[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'descripcion', label: 'Descripción' },
];

const formFields: FormFieldDef[] = [
  {
    key: 'name',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Ej: Reportes avanzados',
    required: true,
  },
  {
    key: 'descripcion',
    label: 'Descripción',
    type: 'textarea',
    placeholder: 'Descripción opcional de la funcionalidad',
    colSpan: 2,
  },
];

const config: CrudPageConfig<FeatureRequest, FeatureResponse> = {
  title: 'Características',
  singular: 'Característica',
  description: 'Gestión de las características del sistema',
  permission: 'FEATURES_READ',
  api: featuresApi,
  columns,
  formFields,
  getFormDefaultValues: () => ({ name: '', descripcion: '' }),
  getFormValuesFromEntity: (e) => ({
    name: e.name,
    descripcion: e.descripcion ?? '',
  }),
  getId: (e) => e.id,
  getIsActive: (e) => e.activo,
};

export default function FeaturePage() {
  return <CrudPage config={config} />;
}
