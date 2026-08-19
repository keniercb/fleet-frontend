import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, FilterX, Search } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { recorridosApi, vehiculosApi, empresasApi } from '@/api/endpoints';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import type {
  RecorridoRequest,
  RecorridoResponse,
  VehiculoResponse,
  EmpresaResponse,
  PageResponse,
} from '@/types';
import type { AxiosResponse } from 'axios';

// ---- Types ----

interface FormData {
  vehiculoId: number;
  fecha: string;
  kilometros: number;
  litrosAbastecidos: string;
  numeroChip: string;
  lugarAbastecimiento: string;
}

const EMPTY_FORM: FormData = {
  vehiculoId: 0,
  fecha: '',
  kilometros: 0,
  litrosAbastecidos: '',
  numeroChip: '',
  lugarAbastecimiento: '',
};

// ---- Helpers ----

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function vehiculoLabel(v: VehiculoResponse): string {
  return `${v.matricula} — ${v.marca.nombre} ${v.modelo || ''}`;
}

// ---- Component ----

export default function RecorridosPage() {
  const { addToast } = useToast();

  // Dropdown data
  const [empresas, setEmpresas] = useState<EmpresaResponse[]>([]);
  const [vehiculosByEmpresa, setVehiculosByEmpresa] = useState<VehiculoResponse[]>([]);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);

  // Filters
  const [filterEmpresaId, setFilterEmpresaId] = useState<number>(0);
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

  // Both filters must be set to load data
  const canLoadData = filterEmpresaId > 0 && filterVehiculoId > 0;
  const hasDateRange = !!filterFechaFrom || !!filterFechaTo;

  // ---- Fetch empresas ----

  const fetchEmpresas = useCallback(async () => {
    try {
      const res = await empresasApi.findAll({ page: 0, perPage: 500 });
      setEmpresas(res.data.content.filter((e) => e.activo));
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No se pudieron cargar las empresas.' });
    }
  }, [addToast]);

  useEffect(() => {
    fetchEmpresas();
  }, [fetchEmpresas]);

  // ---- Fetch vehiculos only when empresa is selected ----

  const fetchVehiculosByEmpresa = useCallback(async (empresaId: number) => {
    if (!empresaId) {
      setVehiculosByEmpresa([]);
      return;
    }
    setLoadingVehiculos(true);
    try {
      const res = await vehiculosApi.findAll({ page: 0, perPage: 500 });
      setVehiculosByEmpresa(res.data.content.filter((v) => v.empresa.id === empresaId && v.activo));
    } catch {
      setVehiculosByEmpresa([]);
      addToast({ type: 'error', title: 'Error', message: 'No se pudieron cargar los vehiculos.' });
    } finally {
      setLoadingVehiculos(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchVehiculosByEmpresa(filterEmpresaId);
  }, [filterEmpresaId, fetchVehiculosByEmpresa]);

  // ---- Fetch recorridos ----

  const fetchRecorridos = useCallback(async (
    p: number,
    vId: number,
    from?: string,
    to?: string,
  ) => {
    setLoading(true);
    try {
      let res: AxiosResponse<PageResponse<RecorridoResponse>>;

      if (from || to) {
        res = await recorridosApi.findByVehiculoIdAndFechaBetween(vId, {
          page: p,
          perPage: size,
          from: from || undefined,
          to: to || undefined,
        });
      } else {
        res = await recorridosApi.findByVehiculoId(vId, { page: p, perPage: size });
      }

      const pageData = res.data;
      setData(pageData.content);
      setTotalPages(pageData.totalPages);
      setTotalElements(pageData.totalElements);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error al cargar los recorridos';
      addToast({ type: 'error', title: 'Error', message });
      setData([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [size, addToast]);

  useEffect(() => {
    if (canLoadData) {
      fetchRecorridos(page, filterVehiculoId, filterFechaFrom || undefined, filterFechaTo || undefined);
    } else {
      setData([]);
      setTotalPages(0);
      setTotalElements(0);
      setLoading(false);
    }
  }, [page, filterVehiculoId, filterFechaFrom, filterFechaTo, canLoadData, fetchRecorridos]);

  // ---- Filter handlers ----

  const handleEmpresaChange = (empresaId: number) => {
    setFilterEmpresaId(empresaId);
    setFilterVehiculoId(0);
    setFilterFechaFrom('');
    setFilterFechaTo('');
    setPage(0);
  };

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
    setFilterEmpresaId(0);
    setFilterVehiculoId(0);
    setFilterFechaFrom('');
    setFilterFechaTo('');
    setPage(0);
  };

  const hasActiveFilters = filterEmpresaId !== 0 || filterVehiculoId !== 0 || hasDateRange;

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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = buildRequestPayload();
      if (editingEntity) {
        await recorridosApi.update(editingEntity.id, payload);
        addToast({ type: 'success', title: 'Recorrido actualizado', message: 'El registro se ha actualizado correctamente.' });
      } else {
        await recorridosApi.create(payload);
        addToast({ type: 'success', title: 'Recorrido creado', message: 'El nuevo registro se ha creado correctamente.' });
      }
      setShowForm(false);
      if (canLoadData) fetchRecorridos(page, filterVehiculoId, filterFechaFrom || undefined, filterFechaTo || undefined);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Error al guardar el recorrido.' });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await recorridosApi.delete(deleteTarget.id);
      addToast({ type: 'success', title: 'Recorrido eliminado', message: 'El registro se ha eliminado correctamente.' });
      setDeleteTarget(null);
      if (canLoadData) fetchRecorridos(page, filterVehiculoId, filterFechaFrom || undefined, filterFechaTo || undefined);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Error al eliminar el recorrido.' });
    } finally {
      setSaving(false);
    }
  };

  const colCount = 8; // table columns

  // ---- Render ----

  return (
    <div>
      <PageHeader title="Recorridos" description="Gestion de recorridos y abastecimientos de vehiculos">
        <button
          onClick={handleOpenCreate}
          disabled={!filterVehiculoId}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title={!filterVehiculoId ? 'Seleccione un vehiculo para adicionar' : 'Nuevo recorrido'}
        >
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </PageHeader>

      {/* Filter Bar */}
      <div className="card mb-4 !py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          {/* Empresa */}
          <div className="relative w-full sm:w-48">
            <label htmlFor="filter-empresa" className="block text-xs font-medium text-gray-500 mb-1">
              Empresa<span className="text-red-500 ml-0.5">*</span>
            </label>
            <select
              id="filter-empresa"
              value={filterEmpresaId}
              onChange={(e) => handleEmpresaChange(Number(e.target.value))}
              className="input-field appearance-none pr-8 py-2 text-sm"
            >
              <option value="0">Seleccionar empresa...</option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.nombre}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Vehiculo */}
          <div className="relative w-full sm:w-64">
            <label htmlFor="filter-vehiculo" className="block text-xs font-medium text-gray-500 mb-1">
              Vehiculo<span className="text-red-500 ml-0.5">*</span>
            </label>
            <select
              id="filter-vehiculo"
              value={filterVehiculoId}
              onChange={(e) => handleVehiculoChange(Number(e.target.value))}
              className="input-field appearance-none pr-8 py-2 text-sm"
              disabled={!filterEmpresaId || loadingVehiculos}
            >
              <option value="0">
                {!filterEmpresaId
                  ? 'Seleccione empresa primero'
                  : loadingVehiculos
                    ? 'Cargando...'
                    : 'Seleccionar vehiculo...'}
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
              Fecha desde
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
              Fecha hasta
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
                title="Limpiar filtros"
              >
                <FilterX className="w-4 h-4" />
                Limpiar
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
                <th className="table-header px-4 py-3">Fecha</th>
                <th className="table-header px-4 py-3 text-right">Km Recorridos</th>
                <th className="table-header px-4 py-3 text-right">Odometro Inicial</th>
                <th className="table-header px-4 py-3 text-right">Consumo</th>
                <th className="table-header px-4 py-3 text-right">Litros</th>
                <th className="table-header px-4 py-3">N Chip</th>
                <th className="table-header px-4 py-3">Lugar</th>
                <th className="table-header px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!canLoadData ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-gray-300" />
                      <p className="text-sm">Seleccione una empresa y un vehiculo para ver los recorridos</p>
                    </div>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
                      Cargando...
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-12 text-center text-gray-400">
                    {hasDateRange ? 'No se encontraron recorridos en el rango de fechas' : 'No hay recorridos para este vehiculo'}
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="table-cell block font-medium text-gray-900">{formatDate(item.fecha)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="table-cell block">{item.kilometros.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="table-cell block">{item.odometroInicial.toLocaleString()}</span>
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
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar"
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
        title={editingEntity ? 'Editar Recorrido' : 'Nuevo Recorrido'}
        onClose={() => setShowForm(false)}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalVehiculo && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-gray-500 mb-0.5">Vehiculo</p>
              <p className="text-sm font-semibold text-gray-900">{modalVehiculo.matricula} — {modalVehiculo.marca.nombre} {modalVehiculo.modelo || ''}</p>
              <p className="text-xs text-gray-500">{modalVehiculo.empresa.nombre}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1.5">
                Fecha<span className="text-red-500 ml-0.5">*</span>
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
                Kilometros Recorridos<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="kilometros"
                type="number"
                min="0"
                step="0.1"
                value={formData.kilometros}
                onChange={(e) => handleFieldChange('kilometros', e.target.value === '' ? 0 : Number(e.target.value))}
                className="input-field"
                placeholder="Ej: 150.5"
                required
              />
            </div>
            <div>
              <label htmlFor="litrosAbastecidos" className="block text-sm font-medium text-gray-700 mb-1.5">
                Litros Abastecidos
              </label>
              <input
                id="litrosAbastecidos"
                type="number"
                min="0"
                step="0.01"
                value={formData.litrosAbastecidos}
                onChange={(e) => handleFieldChange('litrosAbastecidos', e.target.value)}
                className="input-field"
                placeholder="Ej: 25.5"
              />
            </div>
            <div>
              <label htmlFor="numeroChip" className="block text-sm font-medium text-gray-700 mb-1.5">
                Numero de Chip
              </label>
              <input
                id="numeroChip"
                type="text"
                value={formData.numeroChip}
                onChange={(e) => handleFieldChange('numeroChip', e.target.value)}
                className="input-field"
                placeholder="Ej: CHIP-001"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="lugarAbastecimiento" className="block text-sm font-medium text-gray-700 mb-1.5">
                Lugar de Abastecimiento
              </label>
              <input
                id="lugarAbastecimiento"
                type="text"
                value={formData.lugarAbastecimiento}
                onChange={(e) => handleFieldChange('lugarAbastecimiento', e.target.value)}
                className="input-field"
                placeholder="Ej: Estacion Servi Centro"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : editingEntity ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar Recorrido"
        message="Esta seguro que desea eliminar este recorrido? Esta accion no se puede deshacer."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Eliminar"
        danger
      />
    </div>
  );
}
