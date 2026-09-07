import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, ChevronDown, FilterX, Search } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { recorridosApi, vehiculosApi, tarjetasCombustibleApi } from '@/api/endpoints';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { formatDate as formatDateHelper, formatNumber } from '@/utils/format';
import { isToastAlreadyShown } from '@/api/toastBridge';
import type {
  RecorridoRequest,
  RecorridoResponse,
  VehiculoResponse,
  TarjetaCombustibleResponse,
} from '@/types';

// ---- Types ----

interface FormData {
  vehiculoId: number;
  fecha: string;
  kilometros: number;
  litrosAbastecidos: string;
  numeroChip: string;
  lugarAbastecimiento: string;
  tarjetaCombustibleId: number;
  importeAbastecido: string;
}

const EMPTY_FORM: FormData = {
  vehiculoId: 0,
  fecha: '',
  kilometros: 0,
  litrosAbastecidos: '',
  numeroChip: '',
  lugarAbastecimiento: '',
  tarjetaCombustibleId: 0,
  importeAbastecido: '',
};

// ---- Helpers ----

function todayISO(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

function vehiculoLabel(v: VehiculoResponse): string {
  return `${v.matricula} — ${v.marca.nombre} ${v.modelo || ''}`;
}

// ---- Component ----

export default function RecorridosPage() {
  const { t } = useTranslation(['recorridos', 'common', 'crud']);
  const { addToast } = useToast();
  const { empresaId } = useAuth();

  // Dropdown data
  const [vehiculosByEmpresa, setVehiculosByEmpresa] = useState<VehiculoResponse[]>([]);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);

  // Filters
  const [filterVehiculoId, setFilterVehiculoId] = useState<number>(0);
  const [filterFechaFrom, setFilterFechaFrom] = useState('');
  const [filterFechaTo, setFilterFechaTo] = useState('');

  // Table data & pagination
  const [data, setData] = useState<RecorridoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(15);

  // Form modal state
  const [showForm, setShowForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<RecorridoResponse | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<RecorridoResponse | null>(null);

  // Tarjetas de combustible dropdown (filtered by empresa)
  const [tarjetas, setTarjetas] = useState<TarjetaCombustibleResponse[]>([]);

  const fetchTarjetasByEmpresa = useCallback(async () => {
    if (!empresaId) {
      setTarjetas([]);
      return;
    }
    try {
      const res = await tarjetasCombustibleApi.findByEmpresaId(empresaId, { page: 0, perPage: 500 });
      setTarjetas(res.data.content.filter((t) => t.activo));
    } catch {
      setTarjetas([]);
    }
  }, [empresaId]);

  useEffect(() => {
    fetchTarjetasByEmpresa();
  }, [fetchTarjetasByEmpresa]);

  // Vehiculo filter must be set to load data
  const canLoadData = filterVehiculoId > 0;
  const hasDateRange = !!filterFechaFrom || !!filterFechaTo;

  // ---- Fetch vehiculos by empresa from context ----

  const fetchVehiculosByEmpresa = useCallback(async () => {
    if (!empresaId) {
      setVehiculosByEmpresa([]);
      return;
    }
    setLoadingVehiculos(true);
    try {
      const res = await vehiculosApi.findByEmpresaId(empresaId, { page: 0, perPage: 500 });
      setVehiculosByEmpresa(res.data.content.filter((v) => v.activo));
    } catch {
      setVehiculosByEmpresa([]);
      addToast({ type: 'error', title: t('common:state.error'), message: t('recorridos:toast.saveError') });
    } finally {
      setLoadingVehiculos(false);
    }
  }, [empresaId, addToast, t]);

  useEffect(() => {
    fetchVehiculosByEmpresa();
  }, [fetchVehiculosByEmpresa]);

  // ---- Fetch recorridos ----

  const fetchRecorridos = useCallback(async (
    p: number,
    vId: number,
    from: string,
    to: string,
  ) => {
    setLoading(true);
    try {
      const res = await recorridosApi.findByVehiculoId(vId, {
        page: p,
        perPage: size,
        from: from || '',
        to: to || '',
      });

      const pageData = res.data;
      setData(pageData.content);
      setTotalPages(pageData.totalPages);
      setTotalElements(pageData.totalElements);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t('errors:crud.load');
      addToast({ type: 'error', title: t('common:state.error'), message });
      setData([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [size, addToast, t]);

  useEffect(() => {
    if (canLoadData) {
      fetchRecorridos(page, filterVehiculoId, filterFechaFrom, filterFechaTo);
    } else {
      setData([]);
      setTotalPages(0);
      setTotalElements(0);
      setLoading(false);
    }
  }, [page, filterVehiculoId, filterFechaFrom, filterFechaTo, canLoadData, fetchRecorridos]);

  // ---- Filter handlers ----

  const handleVehiculoChange = (vehiculoId: number) => {
    setFilterVehiculoId(vehiculoId);
    setPage(0);
  };

  const handleFechaFromChange = (val: string) => {
    setFilterFechaFrom(val);
    setPage(0);
  };

  const handleFechaToChange = (val: string) => {
    setFilterFechaTo(val);
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilterVehiculoId(0);
    setFilterFechaFrom('');
    setFilterFechaTo('');
    setPage(0);
  };

  const hasActiveFilters = filterVehiculoId !== 0 || hasDateRange;

  // ---- Form helpers ----

  const selectedVehiculo = filterVehiculoId
    ? vehiculosByEmpresa.find((v) => v.id === filterVehiculoId) ?? null
    : null;

  const modalVehiculo = showForm
    ? (editingEntity
        ? editingEntity.vehiculo
        : selectedVehiculo)
    : null;

  const handleOpenCreate = () => {
    if (!filterVehiculoId) return;
    setEditingEntity(null);
    setFormData({ ...EMPTY_FORM, vehiculoId: filterVehiculoId, fecha: todayISO() });
    setShowForm(true);
  };

  const handleOpenEdit = (entity: RecorridoResponse) => {
    setEditingEntity(entity);
    setFormData({
      vehiculoId: entity.vehiculo.id,
      fecha: entity.fecha ? entity.fecha.split('T')[0] : '',
      kilometros: entity.kilometros,
      litrosAbastecidos: entity.litrosAbastecidos ? String(entity.litrosAbastecidos) : '',
      numeroChip: entity.numeroChip || '',
      lugarAbastecimiento: entity.lugarAbastecimiento || '',
      tarjetaCombustibleId: entity.tarjetaCombustible?.id || 0,
      importeAbastecido: entity.importeAbastecido ? String(entity.importeAbastecido) : '',
    });
    setShowForm(true);
  };

  const handleFieldChange = (key: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const buildRequestPayload = (): RecorridoRequest => ({
    vehiculoId: formData.vehiculoId,
    fecha: formData.fecha,
    kilometros: formData.kilometros,
    litrosAbastecidos: formData.litrosAbastecidos ? Number(formData.litrosAbastecidos) : undefined,
    numeroChip: formData.numeroChip || undefined,
    lugarAbastecimiento: formData.lugarAbastecimiento || undefined,
    tarjetaCombustibleId: formData.tarjetaCombustibleId || undefined,
    importeAbastecido: formData.importeAbastecido ? Number(formData.importeAbastecido) : undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = buildRequestPayload();
      if (editingEntity) {
        await recorridosApi.update(editingEntity.id, payload);
        addToast({ type: 'success', title: t('recorridos:toast.updated'), message: t('crud:toast.updated') });
      } else {
        await recorridosApi.create(payload);
        addToast({ type: 'success', title: t('recorridos:toast.created'), message: t('crud:toast.created') });
      }
      setShowForm(false);
      if (canLoadData) fetchRecorridos(page, filterVehiculoId, filterFechaFrom, filterFechaTo);
    } catch (err) {
      if (!isToastAlreadyShown(err)) {
      addToast({ type: 'error', title: t('common:state.error'), message: t('recorridos:toast.saveError') });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await recorridosApi.delete(deleteTarget.id);
      addToast({ type: 'success', title: t('recorridos:toast.deleted'), message: t('crud:toast.deleted') });
      setDeleteTarget(null);
      if (canLoadData) fetchRecorridos(page, filterVehiculoId, filterFechaFrom, filterFechaTo);
    } catch (err) {
      if (!isToastAlreadyShown(err)) {
      addToast({ type: 'error', title: t('common:state.error'), message: t('recorridos:toast.deleteError') });
      }
    } finally {
      setSaving(false);
    }
  };

  const colCount = 10; // table columns

  // ---- Render ----

  return (
    <div>
      <PageHeader title={t('recorridos:title')} description={t('recorridos:description')}>
        <button
          onClick={handleOpenCreate}
          disabled={!filterVehiculoId}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title={!filterVehiculoId ? t('recorridos:selectVehicle') : t('crud:actions.new')}
        >
          <Plus className="w-4 h-4" />
          {t('crud:actions.new')}
        </button>
      </PageHeader>

      {/* Filter Bar */}
      <div className="card mb-4 !py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          {/* Vehiculo */}
          <div className="relative w-full sm:w-64">
            <label htmlFor="filter-vehiculo" className="block text-xs font-medium text-gray-500 mb-1">
              {t('recorridos:filters.vehicle')}<span className="text-red-500 ml-0.5">*</span>
            </label>
            <select
              id="filter-vehiculo"
              value={filterVehiculoId}
              onChange={(e) => handleVehiculoChange(Number(e.target.value))}
              className="input-field appearance-none pr-8 py-2 text-sm"
              disabled={loadingVehiculos}
            >
              <option value="0">
                {loadingVehiculos
                  ? t('recorridos:states.loading')
                  : t('recorridos:selectVehiclePlaceholder')}
              </option>
              {vehiculosByEmpresa.map((v) => (
                <option key={v.id} value={v.id}>{vehiculoLabel(v)}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Fecha Desde */}
          <div className="w-full sm:w-40">
            <label htmlFor="filter-from" className="block text-xs font-medium text-gray-500 mb-1">
              {t('recorridos:filters.fromDate')}
            </label>
            <input
              id="filter-from"
              type="date"
              value={filterFechaFrom}
              onChange={(e) => handleFechaFromChange(e.target.value)}
              className="input-field py-2 text-sm"
              disabled={!canLoadData}
            />
          </div>

          {/* Fecha Hasta */}
          <div className="w-full sm:w-40">
            <label htmlFor="filter-to" className="block text-xs font-medium text-gray-500 mb-1">
              {t('recorridos:filters.toDate')}
            </label>
            <input
              id="filter-to"
              type="date"
              value={filterFechaTo}
              onChange={(e) => handleFechaToChange(e.target.value)}
              className="input-field py-2 text-sm"
              disabled={!canLoadData}
            />
          </div>

          {/* Clear */}
          {hasActiveFilters && (
            <div>
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title={t('common:actions.clear')}
              >
                <FilterX className="w-4 h-4" />
                {t('common:actions.clear')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header px-4 py-3">{t('recorridos:table.date')}</th>
                <th className="table-header px-4 py-3 text-right">{t('recorridos:table.kmTraveled')}</th>
                <th className="table-header px-4 py-3 text-right">{t('recorridos:table.odometerStart')}</th>
                <th className="table-header px-4 py-3 text-right">{t('recorridos:table.consumption')}</th>
                <th className="table-header px-4 py-3 text-right">{t('recorridos:table.liters')}</th>
                <th className="table-header px-4 py-3">{t('recorridos:table.chipNumber')}</th>
                <th className="table-header px-4 py-3">{t('recorridos:table.place')}</th>
                <th className="table-header px-4 py-3">{t('recorridos:table.card')}</th>
                <th className="table-header px-4 py-3 text-right">{t('recorridos:table.amount')}</th>
                <th className="table-header px-4 py-3 text-right">{t('recorridos:table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {!canLoadData ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-gray-300" />
                      <p className="text-sm">{t('recorridos:selectVehicle')}</p>
                    </div>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
                      {t('recorridos:states.loading')}
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-12 text-center text-gray-400">
                    {hasDateRange ? t('recorridos:states.noDataRange') : t('recorridos:states.noDataVehicle')}
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="table-cell block font-medium text-gray-900">{formatDateHelper(item.fecha, 'short')}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="table-cell block">{formatNumber(item.kilometros)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="table-cell block">{formatNumber(item.odometroInicial)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="table-cell block">{item.consumo} km/L</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="table-cell block">{item.litrosAbastecidos || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="table-cell block">{item.numeroChip || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="table-cell block">{item.lugarAbastecimiento || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="table-cell block">{item.tarjetaCombustible?.numero || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="table-cell block">{item.importeAbastecido ? formatNumber(item.importeAbastecido, 2) : '—'}</span>
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

        {canLoadData && (
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
        title={editingEntity ? t('recorridos:form.editTitle') : t('recorridos:form.newTitle')}
        onClose={() => setShowForm(false)}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalVehiculo && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-gray-500 mb-0.5">{t('recorridos:filters.vehicle')}</p>
              <p className="text-sm font-semibold text-gray-900">{modalVehiculo.matricula} — {modalVehiculo.marca.nombre} {modalVehiculo.modelo || ''}</p>
              <p className="text-xs text-gray-500">{modalVehiculo.empresa.nombre}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('recorridos:form.date.label')}<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => handleFieldChange('fecha', e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label htmlFor="kilometros" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('recorridos:form.kmTraveled.label')}<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="kilometros"
                type="number"
                min="0"
                step="0.1"
                value={formData.kilometros}
                onChange={(e) => handleFieldChange('kilometros', e.target.value === '' ? 0 : Number(e.target.value))}
                className="input-field"
                placeholder={t('recorridos:form.kmTraveled.placeholder')}
                required
              />
            </div>
            <div>
              <label htmlFor="litrosAbastecidos" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('recorridos:form.liters.label')}
              </label>
              <input
                id="litrosAbastecidos"
                type="number"
                min="0"
                step="0.01"
                value={formData.litrosAbastecidos}
                onChange={(e) => handleFieldChange('litrosAbastecidos', e.target.value)}
                className="input-field"
                placeholder={t('recorridos:form.liters.placeholder')}
              />
            </div>
            <div>
              <label htmlFor="numeroChip" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('recorridos:form.chipNumber.label')}
              </label>
              <input
                id="numeroChip"
                type="text"
                value={formData.numeroChip}
                onChange={(e) => handleFieldChange('numeroChip', e.target.value)}
                className="input-field"
                placeholder={t('recorridos:form.chipNumber.placeholder')}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="lugarAbastecimiento" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('recorridos:form.place.label')}
              </label>
              <input
                id="lugarAbastecimiento"
                type="text"
                value={formData.lugarAbastecimiento}
                onChange={(e) => handleFieldChange('lugarAbastecimiento', e.target.value)}
                className="input-field"
                placeholder={t('recorridos:form.place.placeholder')}
              />
            </div>
            <div>
              <label htmlFor="tarjetaCombustibleId" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('recorridos:form.fuelCard.label')}
              </label>
              <div className="relative">
                <select
                  id="tarjetaCombustibleId"
                  value={formData.tarjetaCombustibleId}
                  onChange={(e) => handleFieldChange('tarjetaCombustibleId', Number(e.target.value))}
                  className="input-field appearance-none pr-8"
                >
                  <option value="0">{t('recorridos:noCard')}</option>
                  {tarjetas.map((tt) => (
                    <option key={tt.id} value={tt.id}>{tt.numero} ({tt.currency.isoCode})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label htmlFor="importeAbastecido" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('recorridos:form.amount.label')}
              </label>
              <input
                id="importeAbastecido"
                type="number"
                min="0"
                step="0.01"
                value={formData.importeAbastecido}
                onChange={(e) => handleFieldChange('importeAbastecido', e.target.value)}
                className="input-field"
                placeholder={t('recorridos:form.amount.placeholder')}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary"
            >
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
        title={t('crud:modal.delete', { singular: t('recorridos:title') })}
        message={t('recorridos:toast.deleteConfirm')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText={t('common:actions.delete')}
        danger
      />
    </div>
  );
}
