import { useMemo } from 'react';
import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import { municipiosApi, provinciasApi } from '@/api/endpoints';
import type { MunicipioRequest, MunicipioResponse, PageParams, PageResponse } from '@/types';
import type { AxiosResponse } from 'axios';

const columns: ColumnDef<MunicipioResponse>[] = [
  { key: 'codigo', label: 'Codigo' },
  { key: 'nombre', label: 'Nombre' },
  {
    key: 'provincia',
    label: 'Provincia',
    render: (item) => item.provincia?.nombre ?? '—',
  },
];

const formFields: FormFieldDef[] = [
  {
    key: 'provinciaId',
    label: 'Provincia',
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
    label: 'Codigo',
    type: 'number',
    placeholder: 'Ej: 101',
    required: true,
  },
  {
    key: 'nombre',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Ej: Arroyo Naranjo',
    required: true,
  },
];

function createMunicipioConfig(filterProvinciaId: number | undefined): CrudPageConfig<MunicipioRequest, MunicipioResponse> {
  const api = useMemo(() => {
    const base = { ...municipiosApi };
    if (filterProvinciaId) {
      base.findAll = (params?: PageParams): Promise<AxiosResponse<PageResponse<MunicipioResponse>>> =>
        municipiosApi.findByProvinciaId(filterProvinciaId, params);
    }
    return base;
  }, [filterProvinciaId]);

  return {
    title: 'Municipios',
    singular: 'Municipio',
    description: 'Gestion de los municipios',
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
}

export default function MunicipioPage() {
  // TODO: Add provincia filter dropdown at top if needed
  const config = useMemo(() => createMunicipioConfig(undefined), []);
  return <CrudPage config={config} />;
}
