import { useTranslation } from 'react-i18next';
import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { provinciasApi } from '@/api/endpoints';
import type { ProvinciaRequest, ProvinciaResponse } from '@/types';

export default function ProvinciaPage() {
  const { t } = useTranslation(['catalogs', 'common']);

  const columns: ColumnDef<ProvinciaResponse>[] = [
    { key: 'codigo', label: t('catalogs:province.table.code') },
    { key: 'nombre', label: t('common:field.name') },
  ];

  const formFields: FormFieldDef[] = [
    {
      key: 'codigo',
      label: t('catalogs:province.form.code.label'),
      type: 'number',
      placeholder: t('catalogs:province.form.code.placeholder'),
      required: true,
    },
    {
      key: 'nombre',
      label: t('catalogs:province.form.name.label'),
      type: 'text',
      placeholder: t('catalogs:province.form.name.placeholder'),
      required: true,
    },
  ];

  const config: CrudPageConfig<ProvinciaRequest, ProvinciaResponse> = {
    title: t('catalogs:province.title'),
    singular: t('catalogs:province.singular'),
    description: t('catalogs:province.description'),
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

  return <CrudPage config={config} />;
}
