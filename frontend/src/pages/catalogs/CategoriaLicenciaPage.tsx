import { useTranslation } from 'react-i18next';
import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { categoriasLicenciaApi } from '@/api/endpoints';
import type { CategoriaLicenciaRequest, CategoriaLicenciaResponse } from '@/types';

export default function CategoriaLicenciaPage() {
  const { t } = useTranslation(['catalogs', 'common']);

  const columns: ColumnDef<CategoriaLicenciaResponse>[] = [
    { key: 'codigo', label: t('common:field.code') },
    { key: 'denominacion', label: t('catalogs:licenseCategory.table.denomination') },
    { key: 'descripcion', label: t('common:field.description') },
  ];

  const formFields: FormFieldDef[] = [
    {
      key: 'codigo',
      label: t('common:field.code'),
      type: 'text',
      placeholder: t('catalogs:licenseCategory.form.code.placeholder'),
      required: true,
    },
    {
      key: 'denominacion',
      label: t('catalogs:licenseCategory.form.denomination.label'),
      type: 'text',
      placeholder: t('catalogs:licenseCategory.form.denomination.placeholder'),
      required: true,
    },
    {
      key: 'descripcion',
      label: t('common:field.description'),
      type: 'textarea',
      placeholder: t('catalogs:licenseCategory.form.description.placeholder'),
      colSpan: 2,
    },
  ];

  const config: CrudPageConfig<CategoriaLicenciaRequest, CategoriaLicenciaResponse> = {
    title: t('catalogs:licenseCategory.title'),
    singular: t('catalogs:licenseCategory.singular'),
    description: t('catalogs:licenseCategory.description'),
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

  return <CrudPage config={config} />;
}
