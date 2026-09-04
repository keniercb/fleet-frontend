import { useTranslation } from 'react-i18next';
import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { tiposVehiculoApi } from '@/api/endpoints';
import type { TipoVehiculoRequest, TipoVehiculoResponse } from '@/types';

export default function TipoVehiculoPage() {
  const { t } = useTranslation(['catalogs', 'common']);

  const columns: ColumnDef<TipoVehiculoResponse>[] = [
    { key: 'nombre', label: t('common:field.name') },
    { key: 'descripcion', label: t('common:field.description') },
  ];

  const formFields: FormFieldDef[] = [
    {
      key: 'nombre',
      label: t('common:field.name'),
      type: 'text',
      placeholder: t('catalogs:vehicleType.form.name.placeholder'),
      required: true,
    },
    {
      key: 'descripcion',
      label: t('common:field.description'),
      type: 'textarea',
      placeholder: t('catalogs:vehicleType.form.description.placeholder'),
      colSpan: 2,
    },
  ];

  const config: CrudPageConfig<TipoVehiculoRequest, TipoVehiculoResponse> = {
    title: t('catalogs:vehicleType.title'),
    singular: t('catalogs:vehicleType.singular'),
    description: t('catalogs:vehicleType.description'),
    permission: 'TIPOS_VEHICULO_READ',
    api: tiposVehiculoApi,
    columns,
    formFields,
    getFormDefaultValues: () => ({ nombre: '', descripcion: '' }),
    getFormValuesFromEntity: (e) => ({
      nombre: e.nombre,
      descripcion: e.descripcion ?? '',
    }),
    getId: (e) => e.id,
    getIsActive: (e) => e.activo,
  };

  return <CrudPage config={config} />;
}
