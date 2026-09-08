import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileDown, Loader2 } from 'lucide-react';
import CrudPage, { type CrudPageConfig, type ColumnDef, type FormFieldDef } from '@/components/common/CrudPage';
import PageHeader from '@/components/common/PageHeader';
import { empresasApi, provinciasApi, municipiosApi } from '@/api/endpoints';
import { useToast } from '@/contexts/ToastContext';
import { isToastAlreadyShown } from '@/api/toastBridge';
import type { EmpresaRequest, EmpresaResponse } from '@/types';

export default function EmpresaPage() {
  const { t } = useTranslation(['catalogs', 'common']);
  const { addToast } = useToast();
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const res = await empresasApi.reportePdf();
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `empresas_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      addToast({ type: 'success', title: t('common:state.success'), message: t('catalogs:company.generatePdf') });
    } catch (err) {
      if (!isToastAlreadyShown(err)) {
        addToast({ type: 'error', title: t('common:state.error'), message: t('catalogs:company.exportingPdf') });
      }
    } finally {
      setExportingPdf(false);
    }
  };

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

  // Renderizar CrudPage sin el header propio (lo renderizamos nosotros con el boton PDF)
  return (
    <div>
      <PageHeader title={config.title} description={config.description}>
        <button
          onClick={handleExportPdf}
          disabled={exportingPdf}
          className="btn-secondary flex items-center gap-2"
        >
          {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          {exportingPdf ? t('catalogs:company.exportingPdf') : t('catalogs:company.generatePdf')}
        </button>
      </PageHeader>
      <CrudPage config={{ ...config, title: '', description: '' }} />
    </div>
  );
}
