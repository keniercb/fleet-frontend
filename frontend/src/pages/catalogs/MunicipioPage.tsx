import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { municipiosApi, provinciasApi } from '@/api/endpoints';
import type { MunicipioRequest, MunicipioResponse, PageParams, PageResponse } from '@/types';
import type { AxiosResponse } from 'axios';

export default function MunicipioPage() {
  const { t } = useTranslation(['catalogs', 'common']);
  const filterProvinciaId = undefined;

  const columns: ColumnDef<MunicipioResponse>[] = [
    { key: 'codigo', label: t('catalogs:municipality.table.code') },
    { key: 'nombre', label: t('common:field.name') },
    {
      key: 'provincia',
      label: t('catalogs:municipality.table.province'),
      render: (item) => item.provincia?.nombre ?? '—',
    },
  ];

  const formFields: FormFieldDef[] = [
    {
      key: 'provinciaId',
      label: t('catalogs:municipality.form.provinceId.label'),
      type: 'select',
      required: true,
      asyncOptions: async () => {
        try {
          const res = await provinciasApi.findAll({ page: 0, perPage: 500 });
          return res.data.content.filter((p) => p.activo).map((p) => ({ label: p.nombre, value: p.id }));
        } catch { return []; }
      },
    },
    {
      key: 'codigo',
      label: t('catalogs:municipality.form.code.label'),
      type: 'number',
      placeholder: t('catalogs:municipality.form.code.placeholder'),
      required: true,
    },
    {
      key: 'nombre',
      label: t('catalogs:municipality.form.name.label'),
      type: 'text',
      placeholder: t('catalogs:municipality.form.name.placeholder'),
      required: true,
    },
  ];

  const config = useMemo<CrudPageConfig<MunicipioRequest, MunicipioResponse>>(() => {
    const api = (() => {
      const base = { ...municipiosApi };
      if (filterProvinciaId) {
        base.findAll = (params?: PageParams): Promise<AxiosResponse<PageResponse<MunicipioResponse>>> =>
          municipiosApi.findByProvinciaId(filterProvinciaId, params);
      }
      return base;
    })();

    return {
      title: t('catalogs:municipality.title'),
      singular: t('catalogs:municipality.singular'),
      description: t('catalogs:municipality.description'),
      permission: 'MUNICIPIOS_READ',
      api,
      columns,
      formFields,
      getFormDefaultValues: () => ({ provinciaId: 0, codigo: 0, nombre: '' }),
      getFormValuesFromEntity: (e) => ({
        provinciaId: e.provincia?.id ?? 0,
        codigo: e.codigo,
        nombre: e.nombre,
      }),
      getId: (e) => e.id,
      getIsActive: (e) => e.activo,
    };
  }, [t]);

  return <CrudPage config={config} />;
}
