import { useTranslation } from 'react-i18next';
import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { permissionsApi } from '@/api/endpoints';
import type { PermissionRequest, PermissionResponse } from '@/types';

export default function PermisosPage() {
  const { t } = useTranslation(['catalogs', 'common']);

  const columns: ColumnDef<PermissionResponse>[] = [
    { key: 'name', label: t('common:field.name') },
    { key: 'description', label: t('common:field.description') },
  ];

  const formFields: FormFieldDef[] = [
    {
      key: 'name',
      label: t('common:field.name'),
      type: 'text',
      placeholder: t('catalogs:permission.form.name.placeholder'),
      required: true,
    },
    {
      key: 'description',
      label: t('common:field.description'),
      type: 'text',
      placeholder: t('catalogs:permission.form.description.placeholder'),
      colSpan: 2,
    },
  ];

  const config: CrudPageConfig<PermissionRequest, PermissionResponse> = {
    title: t('catalogs:permission.title'),
    singular: t('catalogs:permission.singular'),
    description: t('catalogs:permission.description'),
    permission: 'PERMISOS_READ',
    api: permissionsApi,
    columns,
    formFields,
    getFormDefaultValues: () => ({ name: '', description: '' }),
    getFormValuesFromEntity: (e) => ({
      name: e.name,
      description: e.description ?? '',
    }),
    getId: (e) => e.id,
    getIsActive: (e) => e.activo,
  };

  return <CrudPage config={config} />;
}
