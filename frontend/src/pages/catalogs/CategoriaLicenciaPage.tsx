import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { categoriasLicenciaApi } from '@/api/endpoints';
import type { CategoriaLicenciaRequest, CategoriaLicenciaResponse } from '@/types';

const columns: ColumnDef<CategoriaLicenciaResponse>[] = [
  { key: 'codigo', label: 'Código' },
  { key: 'denominacion', label: 'Denominación' },
  { key: 'descripcion', label: 'Descripción' },
];

const formFields: FormFieldDef[] = [
  {
    key: 'codigo',
    label: 'Código',
    type: 'text',
    placeholder: 'Ej: B1',
    required: true,
  },
  {
    key: 'denominacion',
    label: 'Denominación',
    type: 'text',
    placeholder: 'Ej: Autobús',
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

const config: CrudPageConfig<CategoriaLicenciaRequest, CategoriaLicenciaResponse> = {
  title: 'Categorías de Licencia',
  singular: 'Categoría de licencia',
  description: 'Gestión de las categorías de licencia de conducir',
  permission: 'CATEGORIAS_LICENCIA_READ',
  api: categoriasLicenciaApi,
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

export default function CategoriaLicenciaPage() {
  return <CrudPage config={config} />;
}
