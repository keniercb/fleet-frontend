import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, ChevronDown, Eye, BarChart3, ChevronRight } from 'lucide-react';
import { useCrud } from '@/hooks/useCrud';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  vehiculosApi,
  tiposVehiculoApi,
  marcasApi,
  tiposCombustibleApi,
  choferesApi,
} from '@/api/endpoints';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import type {
  VehiculoRequest,
  VehiculoResponse,
  TipoVehiculoResponse,
  MarcaResponse,
  TipoCombustibleResponse,
  ChoferResponse,
  ReporteMovimientoMensualResponse,
  PageParams,
} from '@/types';

// ---- Types ----

interface Dropdowns {
  tiposVehiculo: TipoVehiculoResponse[];
  marcas: MarcaResponse[];
  tiposCombustible: TipoCombustibleResponse[];
}

interface FormData {
  tipoVehiculoId: number;
  marcaId: number;
  choferId: number;
  tipoCombustibleId: number;
  modelo: string;
  matricula: string;
  numeroMotor: string;
  odometro: number;
  combustible: number;
  ultimoMantenimiento: string;
  odometroUltimoMantenimiento: string;
  indiceConsumo: string;
}

const EMPTY_FORM: FormData = {
  tipoVehiculoId: 0,
  marcaId: 0,
  choferId: 0,
  tipoCombustibleId: 0,
  modelo: '',
  matricula: '',
  numeroMotor: '',
  odometro: 0,
  combustible: 0,
  ultimoMantenimiento: '',
  odometroUltimoMantenimiento: '',
  indiceConsumo: '',
};

// ---- Componentes auxiliares ----

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900 font-medium">{value}</dd>
    </div>
  );
}

// ---- Component ----

export default function VehiculosPage() {
  const { addToast } = useToast();
  const { empresaId } = useAuth();

  const vehiculosApiScoped = useMemo(() => ({
    ...vehiculosApi,
    findAll: (params?: PageParams) => vehiculosApi.findByEmpresaId(empresaId, params),
  }), [empresaId]);

  const {
    data, loading, saving, totalPages, totalElements, page, size, error,
    setPage, createItem, updateItem, deleteItem, fetchData,
  } = useCrud<VehiculoRequest, VehiculoResponse>(vehiculosApiScoped);

  // Re-fetch when empresaId changes
  useEffect(() => {
    if (empresaId) {
      setPage(0);
      fetchData();
    }
  }, [empresaId]);

  // Dropdown data
  const [dropdowns, setDropdowns] = useState<Dropdowns>({
    tiposVehiculo: [],
    marcas: [],
    tiposCombustible: [],
  });

  // Choferes filtrados por empresa
  const [choferes, setChoferes] = useState<ChoferResponse[]>([]);
  const [loadingChoferes, setLoadingChoferes] = useState(false);

  // UI state
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [viewEntity, setViewEntity] = useState<VehiculoResponse | null>(null);
  const [editingEntity, setEditingEntity] = useState<VehiculoResponse | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<VehiculoResponse | null>(null);

  // Reporte movimiento mensual
  const [reporteVehiculo, setReporteVehiculo] = useState<VehiculoResponse | null>(null);
  const [reporteData, setReporteData] = useState<ReporteMovimientoMensualResponse | null>(null);
  const [reporteLoading, setReporteLoading] = useState(false);
  const [reporteMes, setReporteMes] = useState(new Date().getMonth() + 1);
  const [reporteAnio, setReporteAnio] = useState(new Date().getFullYear());

  const MESES = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  const anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const handleOpenReporte = (vehiculo: VehiculoResponse) => {
    setReporteVehiculo(vehiculo);
    setReporteData(null);
    setReporteMes(new Date().getMonth() + 1);
    setReporteAnio(new Date().getFullYear());
  };

  const handleBuscarReporte = async () => {
    if (!reporteVehiculo) return;
    setReporteLoading(true);
    setReporteData(null);
    try {
      const res = await vehiculosApi.reporteMovimientoMensual(reporteVehiculo.id, reporteMes, reporteAnio);
      setReporteData(res.data);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No se pudo generar el reporte de movimiento.' });
    } finally {
      setReporteLoading(false);
    }
  };

  // Show error as toast
  useEffect(() => {
    if (error) {
      addToast({ type: 'error', title: 'Error', message: error });
    }
  }, [error, addToast]);

  // Fetch static dropdowns (no choferes — those are loaded by empresa)
  const fetchDropdowns = useCallback(async () => {
    try {
      const [tvRes, marRes, tcRes] = await Promise.all([
        tiposVehiculoApi.findAll({ page: 0, perPage: 200 }),
        marcasApi.findAll({ page: 0, perPage: 200 }),
        tiposCombustibleApi.findAll({ page: 0, perPage: 200 }),
      ]);
      setDropdowns({
        tiposVehiculo: tvRes.data.content.filter((e) => e.activo),
        marcas: marRes.data.content.filter((e) => e.activo),
        tiposCombustible: tcRes.data.content.filter((e) => e.activo),
      });
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No se pudieron cargar los datos de los selectores.' });
    }
  }, [addToast]);

  // Fetch choferes filtered by empresa
  const fetchChoferesByEmpresa = useCallback(async (empresaId: number) => {
    if (!empresaId) {
      setChoferes([]);
      return;
    }
    setLoadingChoferes(true);
    try {
      const res = await choferesApi.findByEmpresaId(empresaId, { page: 0, perPage: 200 });
      setChoferes(res.data.content.filter((c) => c.activo));
    } catch {
      setChoferes([]);
    } finally {
      setLoadingChoferes(false);
    }
  }, []);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  // ---- Form helpers ----

  const handleOpenCreate = () => {
    setEditingEntity(null);
    setFormData({ ...EMPTY_FORM });
    fetchChoferesByEmpresa(empresaId);
    setShowForm(true);
  };

  const handleOpenEdit = async (entity: VehiculoResponse) => {
    setEditingEntity(entity);
    // Load choferes for the entity's empresa before setting form data
    await fetchChoferesByEmpresa(empresaId);
    setFormData({
      tipoVehiculoId: entity.tipoVehiculo.id,
      marcaId: entity.marca.id,
      choferId: entity.chofer?.id ?? 0,
      tipoCombustibleId: entity.tipoCombustible.id,
      modelo: entity.modelo || '',
      matricula: entity.matricula,
      numeroMotor: entity.numeroMotor,
      odometro: entity.odometro,
      combustible: entity.combustible,
      ultimoMantenimiento: entity.ultimoMantenimiento || '',
      odometroUltimoMantenimiento: entity.odometroUltimoMantenimiento ? String(entity.odometroUltimoMantenimiento) : '',
      indiceConsumo: entity.indiceConsumo ? String(entity.indiceConsumo) : '',
    });
    setShowForm(true);
  };

  const handleFieldChange = (key: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const buildRequestPayload = (): VehiculoRequest => ({
    empresaId,
    tipoVehiculoId: formData.tipoVehiculoId,
    marcaId: formData.marcaId,
    choferId: formData.choferId || undefined,
    tipoCombustibleId: formData.tipoCombustibleId,
    modelo: formData.modelo || undefined,
    matricula: formData.matricula,
    numeroMotor: formData.numeroMotor,
    odometro: formData.odometro,
    combustible: formData.combustible,
    ultimoMantenimiento: formData.ultimoMantenimiento || undefined,
    odometroUltimoMantenimiento: formData.odometroUltimoMantenimiento ? Number(formData.odometroUltimoMantenimiento) : undefined,
    indiceConsumo: formData.indiceConsumo ? Number(formData.indiceConsumo) : undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = buildRequestPayload();
      if (editingEntity) {
        await updateItem(editingEntity.id, payload);
        addToast({ type: 'success', title: 'Vehículo actualizado', message: 'El registro se ha actualizado correctamente.' });
      } else {
        await createItem(payload);
        addToast({ type: 'success', title: 'Vehículo creado', message: 'El nuevo registro se ha creado correctamente.' });
      }
      setShowForm(false);
    } catch {
      // error handled by useCrud → toast via useEffect
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem(deleteTarget.id);
      addToast({ type: 'success', title: 'Vehículo eliminado', message: 'El registro se ha eliminado correctamente.' });
      setDeleteTarget(null);
    } catch {
      // error handled by useCrud → toast via useEffect
    }
  };

  // Search
  const filteredData = search
    ? data.filter((item) => {
        const searchStr = `${item.matricula} ${item.numeroMotor} ${item.modelo} ${item.empresa.nombre} ${item.marca.nombre} ${item.tipoVehiculo.nombre} ${item.chofer?.nombre ?? ''} ${item.chofer?.apellidos ?? ''}`.toLowerCase();
        return searchStr.includes(search.toLowerCase());
      })
    : data;

  // ---- Render helpers ----

  const renderSelect = (
    id: string,
    label: string,
    value: number,
    onChange: (v: number) => void,
    options: { id: number; label: string }[],
    required = true,
    placeholder = 'Seleccionar...',
  ) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="input-field appearance-none pr-8"
          required={required}
        >
          <option value={0}>{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );

  // ---- Render ----

  return (
    <div>
      <PageHeader title="Vehículos" description="Gestión de los vehículos del sistema">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 py-2 text-sm"
          />
        </div>
        <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </PageHeader>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header px-4 py-3">Matrícula</th>
                <th className="table-header px-4 py-3">Empresa</th>
                <th className="table-header px-4 py-3">Tipo</th>
                <th className="table-header px-4 py-3">Marca</th>
                <th className="table-header px-4 py-3">Modelo</th>
                <th className="table-header px-4 py-3">Tipo Combustible</th>
                <th className="table-header px-4 py-3 text-right">Combustible (L)</th>
                <th className="table-header px-4 py-3">Chofer</th>
                <th className="table-header px-4 py-3 text-right">Odómetro</th>
                <th className="table-header px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
                      Cargando...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    {search ? 'No se encontraron resultados' : 'No hay registros'}
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="table-cell block font-medium text-gray-900">{item.matricula}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="table-cell block">{item.empresa.nombre}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="table-cell block">{item.tipoVehiculo.nombre}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="table-cell block">{item.marca.nombre}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="table-cell block">{item.modelo || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="table-cell block">{item.tipoCombustible.denominacion}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="table-cell block">{item.combustible}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="table-cell block">
                        {item.chofer
                          ? `${item.chofer.nombre} ${item.chofer.apellidos}`
                          : <span className="text-gray-400">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="table-cell block">{item.odometro.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenReporte(item)}
                          className="p-1.5 hover:bg-purple-50 rounded-lg text-gray-400 hover:text-purple-600 transition-colors"
                          title="Reporte de Movimiento"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewEntity(item)}
                          className="p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 hover:bg-primary-50 rounded-lg text-gray-400 hover:text-primary-600 transition-colors"
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
        title={editingEntity ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        onClose={() => setShowForm(false)}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selects de relación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderSelect(
              'tipoVehiculoId', 'Tipo de Vehículo', formData.tipoVehiculoId,
              (v) => handleFieldChange('tipoVehiculoId', v),
              dropdowns.tiposVehiculo.map((e) => ({ id: e.id, label: e.nombre })),
            )}
            {renderSelect(
              'marcaId', 'Marca', formData.marcaId,
              (v) => handleFieldChange('marcaId', v),
              dropdowns.marcas.map((e) => ({ id: e.id, label: e.nombre })),
            )}
            {renderSelect(
              'tipoCombustibleId', 'Tipo de Combustible', formData.tipoCombustibleId,
              (v) => handleFieldChange('tipoCombustibleId', v),
              dropdowns.tiposCombustible.map((e) => ({ id: e.id, label: `${e.codigo} - ${e.denominacion}` })),
            )}
            <div>
              <label htmlFor="choferId" className="block text-sm font-medium text-gray-700 mb-1.5">
                Chofer (opcional)
              </label>
              <div className="relative">
                <select
                  id="choferId"
                  value={formData.choferId}
                  onChange={(e) => handleFieldChange('choferId', Number(e.target.value))}
                  className="input-field appearance-none pr-8"
                  disabled={!formData.empresaId || loadingChoferes}
                >
                  <option value="0">{!formData.empresaId ? 'Seleccione empresa primero' : loadingChoferes ? 'Cargando...' : 'Sin chofer asignado'}</option>
                  {choferes.map((c) => (
                    <option key={c.id} value={c.id}>{`${c.nombre} ${c.apellidos} — ${c.carneIdentidad}`}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Datos del vehículo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="modelo" className="block text-sm font-medium text-gray-700 mb-1.5">
                Modelo
              </label>
              <input
                id="modelo"
                type="text"
                value={formData.modelo}
                onChange={(e) => handleFieldChange('modelo', e.target.value)}
                className="input-field"
                placeholder="Ej: Corolla 2024"
              />
            </div>
            <div>
              <label htmlFor="matricula" className="block text-sm font-medium text-gray-700 mb-1.5">
                Matrícula<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="matricula"
                type="text"
                value={formData.matricula}
                onChange={(e) => handleFieldChange('matricula', e.target.value)}
                className="input-field"
                placeholder="Ej: A-123-456"
                required
              />
            </div>
            <div>
              <label htmlFor="numeroMotor" className="block text-sm font-medium text-gray-700 mb-1.5">
                No. Motor<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="numeroMotor"
                type="text"
                value={formData.numeroMotor}
                onChange={(e) => handleFieldChange('numeroMotor', e.target.value)}
                className="input-field"
                placeholder="Ej: M20240001"
                required
              />
            </div>
            <div>
              <label htmlFor="odometro" className="block text-sm font-medium text-gray-700 mb-1.5">
                Odómetro (km)<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="odometro"
                type="number"
                min="0"
                value={formData.odometro}
                onChange={(e) => handleFieldChange('odometro', e.target.value === '' ? 0 : Number(e.target.value))}
                className="input-field"
                placeholder="Ej: 50000"
                required
              />
            </div>
            <div>
              <label htmlFor="combustible" className="block text-sm font-medium text-gray-700 mb-1.5">
                Combustible (L)<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="combustible"
                type="number"
                min="0"
                step="0.1"
                value={formData.combustible}
                onChange={(e) => handleFieldChange('combustible', e.target.value === '' ? 0 : Number(e.target.value))}
                className="input-field"
                placeholder="Ej: 40.5"
                required
              />
            </div>
            <div>
              <label htmlFor="indiceConsumo" className="block text-sm font-medium text-gray-700 mb-1.5">
                Índice Consumo (km/L)
              </label>
              <input
                id="indiceConsumo"
                type="number"
                min="0"
                step="0.01"
                value={formData.indiceConsumo}
                onChange={(e) => handleFieldChange('indiceConsumo', e.target.value)}
                className="input-field"
                placeholder="Ej: 8.5"
              />
            </div>
            <div>
              <label htmlFor="ultimoMantenimiento" className="block text-sm font-medium text-gray-700 mb-1.5">
                Último Mantenimiento
              </label>
              <input
                id="ultimoMantenimiento"
                type="date"
                value={formData.ultimoMantenimiento}
                onChange={(e) => handleFieldChange('ultimoMantenimiento', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="odometroUltimoMantenimiento" className="block text-sm font-medium text-gray-700 mb-1.5">
                Odómetro Ult. Mantenimiento
              </label>
              <input
                id="odometroUltimoMantenimiento"
                type="number"
                min="0"
                value={formData.odometroUltimoMantenimiento}
                onChange={(e) => handleFieldChange('odometroUltimoMantenimiento', e.target.value)}
                className="input-field"
                placeholder="Ej: 48000"
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

      {/* View Detail Modal */}
      <Modal
        open={!!viewEntity}
        title="Detalles del Vehículo"
        onClose={() => setViewEntity(null)}
        size="xl"
      >
        {viewEntity && (
          <div className="space-y-6">
            {/* Info general */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Información General</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <DetailField label="Matrícula" value={viewEntity.matricula} />
                <DetailField label="Modelo" value={viewEntity.modelo || '—'} />
                <DetailField label="No. Motor" value={viewEntity.numeroMotor || '—'} />
                <DetailField label="Marca" value={`${viewEntity.marca.nombre}${viewEntity.marca.paisOrigen ? ` (${viewEntity.marca.paisOrigen})` : ''}`} />
                <DetailField label="Tipo de Vehículo" value={viewEntity.tipoVehiculo.nombre} />
                <DetailField label="Tipo de Combustible" value={`${viewEntity.tipoCombustible.codigo} — ${viewEntity.tipoCombustible.denominacion}`} />
              </div>
            </div>

            {/* Empresa y Chofer */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Empresa y Chofer</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailField label="Empresa" value={viewEntity.empresa.nombre} />
                <DetailField
                  label="Chofer"
                  value={viewEntity.chofer ? `${viewEntity.chofer.nombre} ${viewEntity.chofer.apellidos}` : 'Sin asignar'}
                />
              </div>
            </div>

            {/* Métricas */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Métricas y Combustible</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <DetailField label="Odómetro" value={`${viewEntity.odometro.toLocaleString()} km`} />
                <DetailField label="Combustible" value={`${viewEntity.combustible} L`} />
                <DetailField label="Índice de Consumo" value={viewEntity.indiceConsumo ? `${viewEntity.indiceConsumo} km/L` : '—'} />
              </div>
            </div>

            {/* Mantenimiento */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Mantenimiento</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailField label="Último Mantenimiento" value={viewEntity.ultimoMantenimiento ? formatDate(viewEntity.ultimoMantenimiento) : '—'} />
                <DetailField label="Odómetro Ult. Mantenimiento" value={viewEntity.odometroUltimoMantenimiento ? `${viewEntity.odometroUltimoMantenimiento.toLocaleString()} km` : '—'} />
              </div>
            </div>

            {/* Estado */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Estado</h3>
              <div className="flex items-center gap-2">
                {viewEntity.activo
                  ? <span className="badge-active">Activo</span>
                  : <span className="badge-inactive">Inactivo</span>}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button onClick={() => setViewEntity(null)} className="btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reporte Movimiento Mensual Modal */}
      <Modal
        open={!!reporteVehiculo}
        title={reporteVehiculo ? `Reporte de Movimiento — ${reporteVehiculo.matricula}` : 'Reporte de Movimiento'}
        onClose={() => { setReporteVehiculo(null); setReporteData(null); }}
        size="xl"
      >
        {reporteVehiculo && (
          <div className="space-y-5">
            {/* Filtros: Mes y Año */}
            <div className="flex flex-col sm:flex-row items-end gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-full sm:w-44">
                <label htmlFor="repo-mes" className="block text-xs font-medium text-gray-500 mb-1">Mes</label>
                <select
                  id="repo-mes"
                  value={reporteMes}
                  onChange={(e) => setReporteMes(Number(e.target.value))}
                  className="input-field appearance-none pr-8 py-2 text-sm"
                >
                  {MESES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-36">
                <label htmlFor="repo-anio" className="block text-xs font-medium text-gray-500 mb-1">Año</label>
                <select
                  id="repo-anio"
                  value={reporteAnio}
                  onChange={(e) => setReporteAnio(Number(e.target.value))}
                  className="input-field appearance-none pr-8 py-2 text-sm"
                >
                  {anios.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleBuscarReporte}
                disabled={reporteLoading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {reporteLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Buscar
              </button>
            </div>

            {/* Loading */}
            {reporteLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-3" />
                <p className="text-sm">Generando reporte...</p>
              </div>
            )}

            {/* Datos del reporte */}
            {reporteData && !reporteLoading && (
              <>
                {/* Sección 1: Datos del Vehículo */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Datos del Vehículo
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                    <DetailField label="Matrícula" value={reporteData.vehiculo.matricula} />
                    <DetailField label="Marca" value={reporteData.vehiculo.marca} />
                    <DetailField label="No. Motor" value={reporteData.vehiculo.numeroMotor || '—'} />
                    <DetailField label="Tipo Combustible" value={reporteData.vehiculo.tipoCombustible} />
                    <DetailField label="Norma de Consumo" value={`${reporteData.vehiculo.normaConsumo} km/L`} />
                    <DetailField
                      label="Chofer"
                      value={reporteData.vehiculo.chofer
                        ? `${reporteData.vehiculo.chofer.nombre} ${reporteData.vehiculo.chofer.apellidos}`
                        : 'Sin asignar'}
                    />
                  </div>
                </div>

                {/* Sección 2: Lecturas Diarias */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Lecturas Diarias
                  </h3>
                  {reporteData.lecturas.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No hay lecturas para este periodo.</p>
                  ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="table-header px-3 py-2">Día</th>
                            <th className="table-header px-3 py-2 text-right">Odómetro</th>
                            <th className="table-header px-3 py-2 text-right">Km Recorridos</th>
                            <th className="table-header px-3 py-2 text-right">Comb. en Depósito</th>
                            <th className="table-header px-3 py-2 text-right">Comb. Consumido</th>
                            <th className="table-header px-3 py-2 text-right">Comb. Abastecido</th>
                            <th className="table-header px-3 py-2 text-right">Saldo Comb.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reporteData.lecturas.map((l) => (
                            <tr key={l.dia} className="hover:bg-gray-50 transition-colors">
                              <td className="px-3 py-2 font-medium text-gray-900">{l.dia}</td>
                              <td className="px-3 py-2 text-right">{l.odometro?.toLocaleString() ?? '—'}</td>
                              <td className="px-3 py-2 text-right">{l.kilometrosRecorridos?.toLocaleString() ?? '—'}</td>
                              <td className="px-3 py-2 text-right">{l.combustibleEnDeposito ?? '—'}</td>
                              <td className="px-3 py-2 text-right">{l.combustibleConsumido ?? '—'}</td>
                              <td className="px-3 py-2 text-right">{l.combustibleAbastecido ?? '—'}</td>
                              <td className="px-3 py-2 text-right">{l.saldoCombustible ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Sección 3: Análisis de Consumo */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Análisis de Consumo
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                    <DetailField label="Combustible Inicial" value={`${reporteData.analisis.combustibleInicial} L`} />
                    <DetailField label="Combustible Recibido" value={`${reporteData.analisis.combustibleRecibido} L`} />
                    <DetailField label="Combustible Consumido" value={`${reporteData.analisis.combustibleConsumido} L`} />
                    <DetailField label="Existencia Final" value={`${reporteData.analisis.existenciaFinal} L`} />
                    <DetailField label="Km Recorridos" value={reporteData.analisis.kilometrosRecorridos.toLocaleString()} />
                    <DetailField label="Consumido según Norma" value={`${reporteData.analisis.consumidoSegunNorma} L`} />
                  </div>
                </div>
              </>
            )}

            {/* Sin datos aún */}
            {!reporteData && !reporteLoading && (
              <p className="text-sm text-gray-400 text-center py-12">Seleccione mes y año, luego presione Buscar para generar el reporte.</p>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar Vehículo"
        message="¿Está seguro que desea eliminar este registro? Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Eliminar"
        danger
      />
    </div>
  );
}
