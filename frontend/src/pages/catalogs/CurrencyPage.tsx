import { useTranslation } from 'react-i18next';
import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { currenciesApi } from '@/api/endpoints';
import type { CurrencyRequest, CurrencyResponse } from '@/types';

export default function CurrencyPage() {
  const { t } = useTranslation(['catalogs', 'common']);

  const columns: ColumnDef<CurrencyResponse>[] = [
    { key: 'isoCode', label: t('catalogs:currency.table.isoCode') },
    { key: 'descripcion', label: t('common:field.description') },
  ];

  const formFields: FormFieldDef[] = [
    {
      key: 'isoCode',
      label: t('catalogs:currency.form.isoCode.label'),
      type: 'text',
      placeholder: t('catalogs:currency.form.isoCode.placeholder'),
      required: true,
    },
    {
      key: 'descripcion',
      label: t('common:field.description'),
      type: 'text',
      placeholder: t('catalogs:currency.form.description.placeholder'),
      required: true,
    },
  ];

  const config: CrudPageConfig<CurrencyRequest, CurrencyResponse> = {
    title: t('catalogs:currency.title'),
    singular: t('catalogs:currency.singular'),
    description: t('catalogs:currency.description'),
    permission: 'CURRENCIES_READ',
    api: currenciesApi,
    columns,
    formFields,
    getFormDefaultValues: () => ({ isoCode: '', descripcion: '' }),
    getFormValuesFromEntity: (e) => ({
      isoCode: e.isoCode,
      descripcion: e.descripcion,
    }),
    getId: (e) => e.id,
    getIsActive: (e) => e.activo,
  };

  return <CrudPage config={config} />;
}
