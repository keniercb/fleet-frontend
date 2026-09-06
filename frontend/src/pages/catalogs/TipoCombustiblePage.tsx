import { useTranslation } from 'react-i18next';
import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { tiposCombustibleApi } from '@/api/endpoints';
import type { TipoCombustibleRequest, TipoCombustibleResponse } from '@/types';

export default function TipoCombustiblePage() {
  const { t } = useTranslation(['catalogs', 'common']);

  const columns: ColumnDef<TipoCombustibleResponse>[] = [
    { key: 'codigo', label: t('common:field.code') },
    { key: 'denominacion', label: t('catalogs:fuelType.table.denomination') },
    { key: 'descripcion', label: t('common:field.description') },
  ];

  const formFields: FormFieldDef[] = [
    {
      key: 'codigo',
      label: t('common:field.code'),
      type: 'text',
      placeholder: t('catalogs:fuelType.form.code.placeholder'),
      required: true,
    },
    {
      key: 'denominacion',
      label: t('catalogs:fuelType.form.denomination.label'),
      type: 'text',
      placeholder: t('catalogs:fuelType.form.denomination.placeholder'),
      required: true,
    },
    {
      key: 'descripcion',
      label: t('common:field.description'),
      type: 'textarea',
      placeholder: t('catalogs:fuelType.form.description.placeholder'),
      colSpan: 2,
    },
  ];

  const config: CrudPageConfig<TipoCombustibleRequest, TipoCombustibleResponse> = {
    title: t('catalogs:fuelType.title'),
    singular: t('catalogs:fuelType.singular'),
    description: t('catalogs:fuelType.description'),
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

  return <CrudPage config={config} />;
}
