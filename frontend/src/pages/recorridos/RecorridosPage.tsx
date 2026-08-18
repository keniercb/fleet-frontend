import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, ChevronDown, FilterX } from 'lucide-react';
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
  const [allVehiculos, setAllVehiculos] = useState<VehiculoResponse[]>([]);

  // Filters
  const [filterEmpresaId, setFilterEmpresaId] = useState<number>(0);
  const [filterVehiculoId, setFilterVehiculoId] = useState<number>(0);
  const [search, setSearch] = useState('');

  // Table data & pagination
  const [data, setData] = useState<RecorridoResponse[]>([]);
  const [loading, setLoading] = useState(true);
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

  // ---- Computed: vehiculos filtered by empresa ----

  const filteredVehiculos = filterEmpresaId
    ? allVehiculos.filter((v) => v.empresa.id === filterEmpresaId && v.activo)
    : allVehiculos.filter((v) => v.activo);

  // ---- Fetch dropdowns ----

  const fetchEmpresas = useCallback(async () => {
    try {
      const res = await empresasApi.findAll({ page: 0, perPage: 500 });
      setEmpresas(res.data.content.filter((e) => e.activo));
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No se pudieron cargar las empresas.' });
    }
  }, [addToast]);

  const fetchVehiculos = useCallback(async () => {
    try {
      const res = await vehiculosApi.findAll({ page: 0, perPage: 500 });
      setAllVehiculos(res.data.content);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No se pudieron cargar los vehiculos.' });
    }
  }, [addToast]);

  useEffect(() => {
    fetchEmpresas();
    fetchVehiculos();
  }, [fetchEmpresas, fetchVehiculos]);

  // ---- Fetch recorridos (server-side) ----

  const fetchRecorridos = useCallback(async (p: number, vId?: number) => {
    setLoading(true);
    try {
      let res: AxiosResponse<PageResponse<RecorridoResponse>>;
      if (vId && vId > 0) {
        res = await recorridosApi.findByVehiculoId(vId, { page: p, perPage: size });
      } else {
        res = await recorridosApi.findAll({ page: p, perPage: size });
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

  // Initial load & page changes
  useEffect(() => {
    fetchRecorridos(page, filterVehiculoId);
  }, [page, filterVehiculoId, fetchRecorridos]);

  // When empresa changes, reset vehiculo filter and go to page 0
  const handleEmpresaChange = (empresaId: number) => {
    setFilterEmpresaId(empresaId);
    setFilterVehiculoId(0);
    setPage(0);
  };

  // When vehiculo changes, go to page 0
  const handleVehiculoChange = (vehiculoId: number) => {
    setFilterVehiculoId(vehiculoId);
    setPage(0);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilterEmpresaId(0);
    setFilterVehiculoId(0);
    setSearch('');
    setPage(0);
  };

  const hasActiveFilters = filterEmpresaId !== 0 || filterVehiculoId !== 0 || search !== '';

  // Client-side search + empresa filter (vehiculo is server-side)
  const filteredData = data.filter((item) => {
    // Empresa client-side filter
    if (filterEmpresaId > 0 && item.vehiculo.empresa.id !== filterEmpresaId) {
      return false;
    }
    // Text search
    if (search) {
      const str = `${item.vehiculo.matricula} ${item.vehiculo.empresa.nombre} ${item.lugarAbastecimiento} ${item.numeroChip} ${item.fecha}`.toLowerCase();
      if (!str.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  // ---- Form helpers ----

  const handleOpenCreate = () => {
    setEditingEntity(null);
    setFormData({ ...EMPTY_FORM, fecha: todayISO() });
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
      fetchRecorridos(page, filterVehiculoId);
    } catch {
      // error shown via toast inside catch
      const err = new Error();
      addToast({ type: 'error', title: 'Error', message: err.message || 'Error al guardar el recorrido.' });
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
      fetchRecorridos(page, filterVehiculoId);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Error al eliminar el recorrido.' });
    } finally {
      setSaving(false);
    }
  };

  // ---- Render ----

  return (
    <div>
      <PageHeader title="Recorridos" description="Gestion de recorridos y abastecimientos de vehiculos">
        <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </PageHeader>

      {/* Filter Bar */}
      <div className="card mb-4 !py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Empresa Select */}
          <div className="relative w-full sm:w-56">
            <label htmlFor="filter-empresa" className="block text-xs font-medium text-gray-500 mb-1">
              Empresa
            </label>
            <select
              id="filter-empresa"
              value={filterEmpresaId}
              onChange={(e) => handleEmpresaChange(Number(e.target.value))}
              className="input-field appearance-none pr-8 py-2 text-sm"
            >
              <option value="0">Todas las empresas</option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.nombre}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Vehiculo Select */}
          <div className="relative w-full sm:w-72">
            <label htmlFor="filter-vehiculo" className="block text-xs font-medium text-gray-500 mb-1">
              Vehiculo
            </label>
            <select
              id="filter-vehiculo"
              value={filterVehiculoId}
              onChange={(e) => handleVehiculoChange(Number(e.target.value))}
              className="input-field appearance-none pr-8 py-2 text-sm"
            >
              <option value="0">Todos los vehiculos</option>
              {filteredVehiculos.map((v) => (
                <option key={v.id} value={v.id}>{vehiculoLabel(v)}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Search */}
          <div className="relative flex-1 w-full sm:w-auto">
            <label htmlFor="filter-search" className="block text-xs font-medium text-gray-500 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="filter-search"
                type="text"
                placeholder="Matricula, lugar, chip..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-9 py-2 text-sm"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="self-end">
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
                <th className="table-header px-4 py-3">Empresa</th>
                <th className="table-header px-4 py-3">Vehiculo</th>
                <th className="table-header px-4 py-3 text-right">Km Recorridos</th>
                <th className="table-header px-4 py-3 text-right">Odometro Inicial</th>
                <th className="table-header px-4 py-3 text-right">Consumo</th>
                <th className="table-header px-4 py-3 text-right">Litros</th>
                <th className="table-header px-4 py-3">N Chip</th>
                <th className="table-header px-4 py-3">Lugar</th>
                <th className="table-header px-4 py-3 text-right">Estado</th>
                <th className="table-header px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
                      Cargando...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-400">
                    {hasActiveFilters ? 'No se encontraron resultados con los filtros aplicados' : 'No hay registros'}
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="table-cell block font-medium text-gray-900">{formatDate(item.fecha)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="table-cell block">{item.vehiculo.empresa.nombre}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="table-cell block">{item.vehiculo.matricula}</span>
                      <span className="table-cell-sub block text-xs text-gray-500">{item.vehiculo.marca.nombre} {item.vehiculo.modelo || ''}</span>
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
                      {item.activo
                        ? <span className="badge-active">Activo</span>
                        : <span className="badge-inactive">Inactivo</span>}
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

        {/* Pagination - only show when no text search (client-side filter breaks pagination) */}
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
        title={editingEntity ? 'Editar Recorrido' : 'Nuevo Recorrido'}
        onClose={() => setShowForm(false)}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vehiculo */}
            <div className="sm:col-span-2">
              <label htmlFor="vehiculoId" className="block text-sm font-medium text-gray-700 mb-1.5">
                Vehiculo<span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <select
                  id="vehiculoId"
                  value={formData.vehiculoId}
                  onChange={(e) => handleFieldChange('vehiculoId', Number(e.target.value))}
                  className="input-field appearance-none pr-8"
                  required
                >
                  <option value="0">Seleccionar vehiculo...</option>
                  {allVehiculos.filter((v) => v.activo).map((v) => (
                    <option key={v.id} value={v.id}>{vehiculoLabel(v)} ({v.empresa.nombre})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Fecha */}
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

            {/* Kilometros */}
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

            {/* Litros Abastecidos */}
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

            {/* Numero Chip */}
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

            {/* Lugar Abastecimiento */}
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

          {/* Actions */}
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
