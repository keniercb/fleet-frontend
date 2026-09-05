import { useTranslation } from 'react-i18next';
import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { featuresApi } from '@/api/endpoints';
import type { FeatureRequest, FeatureResponse } from '@/types';

export default function FeaturePage() {
  const { t } = useTranslation(['catalogs', 'common']);

  const columns: ColumnDef<FeatureResponse>[] = [
    { key: 'name', label: t('common:field.name') },
    { key: 'descripcion', label: t('common:field.description') },
  ];

  const formFields: FormFieldDef[] = [
    {
      key: 'name',
      label: t('common:field.name'),
      type: 'text',
      placeholder: t('catalogs:feature.form.name.placeholder'),
      required: true,
    },
    {
      key: 'descripcion',
      label: t('common:field.description'),
      type: 'textarea',
      placeholder: t('catalogs:feature.form.description.placeholder'),
      colSpan: 2,
    },
  ];

  const config: CrudPageConfig<FeatureRequest, FeatureResponse> = {
    title: t('catalogs:feature.title'),
    singular: t('catalogs:feature.singular'),
    description: t('catalogs:feature.description'),
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

  return <CrudPage config={config} />;
}
