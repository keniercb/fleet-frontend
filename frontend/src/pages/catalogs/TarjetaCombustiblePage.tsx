import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Search, ChevronDown } from 'lucide-react';
import { useCrud } from '@/hooks/useCrud';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { tarjetasCombustibleApi, currenciesApi } from '@/api/endpoints';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { formatNumber } from '@/utils/format';
import { isToastAlreadyShown } from '@/api/toastBridge';
import type {
  TarjetaCombustibleRequest,
  TarjetaCombustibleResponse,
  CurrencyResponse,
  PageParams,
} from '@/types';

// ---- Types ----

interface FormData {
  numero: string;
  saldo: string;
  currencyId: number;
}

const EMPTY_FORM: FormData = {
  numero: '',
  saldo: '',
  currencyId: 0,
};

// ---- Component ----

export default function TarjetaCombustiblePage() {
  const { t } = useTranslation(['catalogs', 'common']);
  const { addToast } = useToast();
  const { empresaId } = useAuth();

  const tarjetasApiScoped = useMemo(() => ({
    ...tarjetasCombustibleApi,
    findAll: (params?: PageParams) => tarjetasCombustibleApi.findByEmpresaId(empresaId, params),
  }), [empresaId]);

  const {
    data, loading, saving, totalPages, totalElements, page, size, error,
    setPage, createItem, updateItem, deleteItem, fetchData,
  } = useCrud<TarjetaCombustibleRequest, TarjetaCombustibleResponse>(tarjetasApiScoped);

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<TarjetaCombustibleResponse | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<TarjetaCombustibleResponse | null>(null);

  // Re-fetch when empresaId changes
  useEffect(() => {
    if (empresaId) {
      setPage(0);
      fetchData();
    }
  }, [empresaId]);

  // Dropdowns
  const [currencies, setCurrencies] = useState<CurrencyResponse[]>([]);

  useEffect(() => {
    if (error) {
      addToast({ type: 'error', title: t('common:state.error'), message: error });
    }
  }, [error, addToast]);

  const fetchCurrencies = useCallback(async () => {
    try {
      const res = await currenciesApi.findAll({ page: 0, perPage: 200 });
      setCurrencies(res.data.content.filter((c) => c.activo));
    } catch (err) {
      if (!isToastAlreadyShown(err)) {
      addToast({ type: 'error', title: t('common:state.error'), message: t('catalogs:fuelCard.toast.selectCurrenciesError') });
      }
    }
  }, [addToast, t]);

  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  // ---- Handlers ----

  const handleOpenCreate = () => {
    setEditingEntity(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
  };

  const handleOpenEdit = (entity: TarjetaCombustibleResponse) => {
    setEditingEntity(entity);
    setFormData({
      numero: entity.numero,
      saldo: String(entity.saldo),
      currencyId: entity.currency.id,
    });
    setShowForm(true);
  };

  const handleFieldChange = (key: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: TarjetaCombustibleRequest = {
        numero: formData.numero,
        saldo: formData.saldo ? Number(formData.saldo) : 0,
        currencyId: formData.currencyId,
        empresaId,
      };
      if (editingEntity) {
        await updateItem(editingEntity.id, payload);
        addToast({ type: 'success', title: t('catalogs:fuelCard.toast.updated'), message: t('catalogs:fuelCard.toast.updatedMessage') });
      } else {
        await createItem(payload);
        addToast({ type: 'success', title: t('catalogs:fuelCard.toast.created'), message: t('catalogs:fuelCard.toast.createdMessage') });
      }
      setShowForm(false);
    } catch {
      // error handled by hook
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem(deleteTarget.id);
      addToast({ type: 'success', title: t('catalogs:fuelCard.toast.deleted'), message: t('catalogs:fuelCard.toast.deletedMessage') });
      setDeleteTarget(null);
    } catch {
      // error handled by hook
    }
  };

  const filteredData = search
    ? data.filter((item) =>
        [item.numero, item.currency?.isoCode, item.currency?.descripcion, item.empresa?.nombre].some(
          (val) => val != null && String(val).toLowerCase().includes(search.toLowerCase())
        )
      )
    : data;

  const colCount = 6;

  return (
    <div>
      <PageHeader title={t('catalogs:fuelCard.title')} description={t('catalogs:fuelCard.description')}>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('crud:actions.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 py-2 text-sm"
          />
        </div>
        <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('crud:actions.new')}
        </button>
      </PageHeader>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header px-4 py-3">{t('catalogs:fuelCard.table.number')}</th>
                <th className="table-header px-4 py-3">{t('catalogs:fuelCard.table.company')}</th>
                <th className="table-header px-4 py-3">{t('catalogs:fuelCard.table.currency')}</th>
                <th className="table-header px-4 py-3 text-right">{t('catalogs:fuelCard.table.balance')}</th>
                <th className="table-header px-4 py-3 text-right">{t('catalogs:fuelCard.table.state')}</th>
                <th className="table-header px-4 py-3 text-right">{t('catalogs:fuelCard.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
                      {t('crud:states.loading')}
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-12 text-center text-gray-400">
                    {search ? t('crud:states.noResults') : t('crud:states.empty')}
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="table-cell block font-medium text-gray-900">{item.numero}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="table-cell block">{item.empresa?.nombre || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="table-cell block">{item.currency?.isoCode} — {item.currency?.descripcion}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="table-cell block">{formatNumber(item.saldo, 2)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.activo
                        ? <span className="badge-active">{t('crud:badges.active')}</span>
                        : <span className="badge-inactive">{t('crud:badges.inactive')}</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 hover:bg-primary-50 rounded-lg text-gray-400 hover:text-primary-600 transition-colors"
                          title={t('common:actions.edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                          title={t('common:actions.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!search && (
          <div className="px-4 pb-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              size={size}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={showForm}
        title={editingEntity ? t('catalogs:fuelCard.modal.edit') : t('catalogs:fuelCard.modal.create')}
        onClose={() => setShowForm(false)}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="numero" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('catalogs:fuelCard.form.numero.label')}<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="numero"
                type="text"
                value={formData.numero}
                onChange={(e) => handleFieldChange('numero', e.target.value)}
                className="input-field"
                placeholder={t('catalogs:fuelCard.form.numero.placeholder')}
                required
              />
            </div>
            <div>
              <label htmlFor="currencyId" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('catalogs:fuelCard.form.currencyId.label')}<span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <select
                  id="currencyId"
                  value={formData.currencyId}
                  onChange={(e) => handleFieldChange('currencyId', Number(e.target.value))}
                  className="input-field appearance-none pr-8"
                  required
                >
                  <option value="0">{t('catalogs:fuelCard.form.selectCurrency')}</option>
                  {currencies.map((c) => (
                    <option key={c.id} value={c.id}>{c.isoCode} — {c.descripcion}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label htmlFor="saldo" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('catalogs:fuelCard.form.saldo.label')}<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="saldo"
                type="number"
                min="0"
                step="0.01"
                value={formData.saldo}
                onChange={(e) => handleFieldChange('saldo', e.target.value)}
                className="input-field"
                placeholder={t('catalogs:fuelCard.form.saldo.placeholder')}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              {t('common:actions.cancel')}
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? t('common:actions.saving') : editingEntity ? t('common:actions.update') : t('common:actions.create')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        title={t('crud:modal.delete', { singular: t('catalogs:fuelCard.singular') })}
        message={t('catalogs:fuelCard.deleteConfirm')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText={t('common:actions.delete')}
        danger
      />
    </div>
  );
}
