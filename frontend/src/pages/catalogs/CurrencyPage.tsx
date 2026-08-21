import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { currenciesApi } from '@/api/endpoints';
import type { CurrencyRequest, CurrencyResponse } from '@/types';

const columns: ColumnDef<CurrencyResponse>[] = [
  { key: 'isoCode', label: 'Código ISO' },
  { key: 'descripcion', label: 'Descripción' },
];

const formFields: FormFieldDef[] = [
  {
    key: 'isoCode',
    label: 'Código ISO',
    type: 'text',
    placeholder: 'Ej: CUP, USD, EUR',
    required: true,
  },
  {
    key: 'descripcion',
    label: 'Descripción',
    type: 'text',
    placeholder: 'Ej: Peso Cubano',
    required: true,
  },
];

const config: CrudPageConfig<CurrencyRequest, CurrencyResponse> = {
  title: 'Monedas',
  singular: 'Moneda',
  description: 'Gestión de monedas del sistema',
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

export default function CurrencyPage() {
  return <CrudPage config={config} />;
}
