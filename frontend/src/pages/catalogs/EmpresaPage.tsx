import { useTranslation } from 'react-i18next';
import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { empresasApi, provinciasApi, municipiosApi } from '@/api/endpoints';
import type { EmpresaRequest, EmpresaResponse } from '@/types';

export default function EmpresaPage() {
  const { t } = useTranslation(['catalogs', 'common']);

  const columns: ColumnDef<EmpresaResponse>[] = [
    { key: 'codigo', label: t('common:field.code') },
    { key: 'nombre', label: t('common:field.name') },
    { key: 'provincia', label: t('catalogs:company.table.province'), render: (item) => item.provincia?.nombre ?? '—' },
    { key: 'municipio', label: t('catalogs:company.table.municipality'), render: (item) => item.municipio?.nombre ?? '—' },
    { key: 'direccion', label: t('catalogs:company.table.address') },
    { key: 'telefono', label: t('catalogs:company.table.phone') },
    { key: 'email', label: t('catalogs:company.table.email') },
  ];

  const formFields: FormFieldDef[] = [
    {
      key: 'codigo',
      label: t('common:field.code'),
      type: 'text',
      placeholder: t('catalogs:company.form.code.placeholder'),
      required: true,
    },
    {
      key: 'nombre',
      label: t('common:field.name'),
      type: 'text',
      placeholder: t('catalogs:company.form.name.placeholder'),
      required: true,
      colSpan: 2,
    },
    {
      key: 'provinciaId',
      label: t('catalogs:company.form.provinceId.label'),
      type: 'select',
      asyncOptions: async () => {
        try {
          const res = await provinciasApi.findAll({ page: 0, perPage: 500 });
          return res.data.content.filter((p) => p.activo).map((p) => ({ label: p.nombre, value: p.id }));
        } catch { return []; }
      },
      onChange: () => {
        // When provincia changes, reload municipio options
        return;
      },
    },
    {
      key: 'municipioId',
      label: t('catalogs:company.form.municipioId.label'),
      type: 'select',
      asyncOptions: async () => {
        try {
          const res = await municipiosApi.findAll({ page: 0, perPage: 999 });
          return res.data.content.filter((m) => m.activo).map((m) => ({ label: m.nombre, value: m.id }));
        } catch { return []; }
      },
    },
    {
      key: 'direccion',
      label: t('catalogs:company.form.address.label'),
      type: 'text',
      placeholder: t('catalogs:company.form.address.placeholder'),
      colSpan: 2,
    },
    {
      key: 'telefono',
      label: t('catalogs:company.form.phone.label'),
      type: 'text',
      placeholder: t('catalogs:company.form.phone.placeholder'),
    },
    {
      key: 'email',
      label: t('catalogs:company.form.email.label'),
      type: 'email',
      placeholder: t('catalogs:company.form.email.placeholder'),
    },
  ];

  const config: CrudPageConfig<EmpresaRequest, EmpresaResponse> = {
    title: t('catalogs:company.title'),
    singular: t('catalogs:company.singular'),
    description: t('catalogs:company.description'),
    permission: 'EMPRESAS_READ',
    api: empresasApi,
    columns,
    formFields,
    getFormDefaultValues: () => ({ codigo: '', nombre: '', direccion: '', telefono: '', email: '' }),
    getFormValuesFromEntity: (e) => ({
      codigo: e.codigo,
      nombre: e.nombre,
      direccion: e.direccion ?? '',
      telefono: e.telefono ?? '',
      email: e.email ?? '',
      provinciaId: e.provincia?.id,
      municipioId: e.municipio?.id,
    }),
    getId: (e) => e.id,
    getIsActive: (e) => e.activo,
  };

  return <CrudPage config={config} />;
}
