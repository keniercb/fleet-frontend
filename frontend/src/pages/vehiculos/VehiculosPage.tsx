import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, ChevronDown } from 'lucide-react';
import { useCrud } from '@/hooks/useCrud';
import { useToast } from '@/contexts/ToastContext';
import {
  vehiculosApi,
  empresasApi,
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
  EmpresaResponse,
  TipoVehiculoResponse,
  MarcaResponse,
  TipoCombustibleResponse,
  ChoferResponse,
} from '@/types';

// ---- Types ----

interface Dropdowns {
  empresas: EmpresaResponse[];
  tiposVehiculo: TipoVehiculoResponse[];
  marcas: MarcaResponse[];
  tiposCombustible: TipoCombustibleResponse[];
}

interface FormData {
  empresaId: number;
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
  empresaId: 0,
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

// ---- Component ----

export default function VehiculosPage() {
  const {
    data, loading, saving, totalPages, totalElements, page, size, error,
    setPage, createItem, updateItem, deleteItem,
  } = useCrud<VehiculoRequest, VehiculoResponse>(vehiculosApi);

  const { addToast } = useToast();

  // Dropdown data
  const [dropdowns, setDropdowns] = useState<Dropdowns>({
    empresas: [],
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
  const [editingEntity, setEditingEntity] = useState<VehiculoResponse | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<VehiculoResponse | null>(null);

  // Show error as toast
  useEffect(() => {
    if (error) {
      addToast({ type: 'error', title: 'Error', message: error });
    }
  }, [error, addToast]);

  // Fetch static dropdowns (no choferes — those are loaded by empresa)
  const fetchDropdowns = useCallback(async () => {
    try {
      const [empRes, tvRes, marRes, tcRes] = await Promise.all([
        empresasApi.findAll({ page: 0, perPage: 200 }),
        tiposVehiculoApi.findAll({ page: 0, perPage: 200 }),
        marcasApi.findAll({ page: 0, perPage: 200 }),
        tiposCombustibleApi.findAll({ page: 0, perPage: 200 }),
      ]);
      setDropdowns({
        empresas: empRes.data.content.filter((e) => e.activo),
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
    setChoferes([]);
    setShowForm(true);
  };

  const handleOpenEdit = async (entity: VehiculoResponse) => {
    setEditingEntity(entity);
    // Load choferes for the entity's empresa before setting form data
    await fetchChoferesByEmpresa(entity.empresa.id);
    setFormData({
      empresaId: entity.empresa.id,
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
    if (key === 'empresaId') {
      // Reset chofer when empresa changes and reload choferes list
      setFormData((prev) => ({ ...prev, empresaId: value as number, choferId: 0 }));
      fetchChoferesByEmpresa(value as number);
    } else {
      setFormData((prev) => ({ ...prev, [key]: value }));
    }
  };

  const buildRequestPayload = (): VehiculoRequest => ({
    empresaId: formData.empresaId,
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
                <th className="table-header px-4 py-3">No. Motor</th>
                <th className="table-header px-4 py-3">Empresa</th>
                <th className="table-header px-4 py-3">Tipo</th>
                <th className="table-header px-4 py-3">Marca</th>
                <th className="table-header px-4 py-3">Modelo</th>
                <th className="table-header px-4 py-3">Combustible</th>
                <th className="table-header px-4 py-3">Chofer</th>
                <th className="table-header px-4 py-3 text-right">Odómetro (km)</th>
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
                      <span className="table-cell block">{item.numeroMotor}</span>
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
              'empresaId', 'Empresa', formData.empresaId,
              (v) => handleFieldChange('empresaId', v),
              dropdowns.empresas.map((e) => ({ id: e.id, label: e.nombre })),
            )}
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
                  <option value={0}>{!formData.empresaId ? 'Seleccione empresa primero' : loadingChoferes ? 'Cargando...' : 'Sin chofer asignado'}</option>
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
