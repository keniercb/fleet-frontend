import { useTranslation } from 'react-i18next';
import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { marcasApi } from '@/api/endpoints';
import type { MarcaRequest, MarcaResponse } from '@/types';

export default function MarcaPage() {
  const { t } = useTranslation(['catalogs', 'common']);

  const columns: ColumnDef<MarcaResponse>[] = [
    { key: 'nombre', label: t('common:field.name') },
    { key: 'descripcion', label: t('common:field.description') },
    { key: 'paisOrigen', label: t('catalogs:brand.table.originCountry') },
  ];

  const formFields: FormFieldDef[] = [
    {
      key: 'nombre',
      label: t('catalogs:brand.form.name.label'),
      type: 'text',
      placeholder: t('catalogs:brand.form.name.placeholder'),
      required: true,
    },
    {
      key: 'paisOrigen',
      label: t('catalogs:brand.form.originCountry.label'),
      type: 'text',
      placeholder: t('catalogs:brand.form.originCountry.placeholder'),
    },
    {
      key: 'descripcion',
      label: t('common:field.description'),
      type: 'textarea',
      placeholder: t('catalogs:brand.form.description.placeholder'),
      colSpan: 2,
    },
  ];

  const config: CrudPageConfig<MarcaRequest, MarcaResponse> = {
    title: t('catalogs:brand.title'),
    singular: t('catalogs:brand.singular'),
    description: t('catalogs:brand.description'),
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

  return <CrudPage config={config} />;
}
