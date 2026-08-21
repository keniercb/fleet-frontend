import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, X, ChevronDown } from 'lucide-react';
import { useCrud } from '@/hooks/useCrud';
import { useToast } from '@/contexts/ToastContext';
import { choferesApi, empresasApi, categoriasLicenciaApi } from '@/api/endpoints';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import type { ChoferRequest, ChoferResponse, EmpresaResponse, CategoriaLicenciaResponse } from '@/types';

// ---- Types ----

interface CategoriaFormRow {
  tempId: number;
  categoriaLicenciaId: number;
  fechaEmision: string;
}

interface FormData {
  empresaId: number;
  nombre: string;
  apellidos: string;
  carneIdentidad: string;
  numeroLicencia: string;
  fechaNacimiento: string;
  categorias: CategoriaFormRow[];
}

const EMPTY_FORM: FormData = {
  empresaId: 0,
  nombre: '',
  apellidos: '',
  carneIdentidad: '',
  numeroLicencia: '',
  fechaNacimiento: '',
  categorias: [],
};

let nextTempId = 1;
function getTempId() {
  return nextTempId++;
}

// ---- Component ----

export default function ChoferesPage() {
  const {
    data, loading, saving, totalPages, totalElements, page, size, error,
    setPage, createItem, updateItem, deleteItem,
  } = useCrud<ChoferRequest, ChoferResponse>(choferesApi);

  const { addToast } = useToast();

  // Dropdown data
  const [empresas, setEmpresas] = useState<EmpresaResponse[]>([]);
  const [categoriasLicencia, setCategoriasLicencia] = useState<CategoriaLicenciaResponse[]>([]);

  // UI state
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<ChoferResponse | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<ChoferResponse | null>(null);

  // Show error as toast
  useEffect(() => {
    if (error) {
      addToast({ type: 'error', title: 'Error', message: error });
    }
  }, [error, addToast]);

  // Fetch dropdown data on mount
  const fetchDropdowns = useCallback(async () => {
    try {
      const [empRes, catRes] = await Promise.all([
        empresasApi.findAll({ page: 0, perPage: 200 }),
        categoriasLicenciaApi.findAll({ page: 0, perPage: 200 }),
      ]);
      setEmpresas(empRes.data.content);
      setCategoriasLicencia(catRes.data.content);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No se pudieron cargar las empresas o categorías de licencia.' });
    }
  }, [addToast]);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  // ---- Form helpers ----

  const handleOpenCreate = () => {
    setEditingEntity(null);
    setFormData({ ...EMPTY_FORM, categorias: [] });
    setShowForm(true);
  };

  const handleOpenEdit = (entity: ChoferResponse) => {
    setEditingEntity(entity);
    setFormData({
      empresaId: entity.empresa.id,
      nombre: entity.nombre,
      apellidos: entity.apellidos,
      carneIdentidad: entity.carneIdentidad,
      numeroLicencia: entity.numeroLicencia,
      fechaNacimiento: entity.fechaNacimiento,
      categorias: entity.categorias
        .filter((c) => c.activo)
        .map((c) => ({
          tempId: getTempId(),
          categoriaLicenciaId: c.categoriaLicencia.id,
          fechaEmision: c.fechaEmision,
        })),
    });
    setShowForm(true);
  };

  const handleFieldChange = (key: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Categorías sub-form
  const handleAddCategoria = () => {
    setFormData((prev) => ({
      ...prev,
      categorias: [...prev.categorias, { tempId: getTempId(), categoriaLicenciaId: 0, fechaEmision: '' }],
    }));
  };

  const handleRemoveCategoria = (tempId: number) => {
    setFormData((prev) => ({
      ...prev,
      categorias: prev.categorias.filter((c) => c.tempId !== tempId),
    }));
  };

  const handleCategoriaChange = (tempId: number, field: 'categoriaLicenciaId' | 'fechaEmision', value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      categorias: prev.categorias.map((c) =>
        c.tempId === tempId ? { ...c, [field]: value } : c
      ),
    }));
  };

  // Build the request payload
  const buildRequestPayload = (): ChoferRequest => {
    const validCategorias = formData.categorias
      .filter((c) => c.categoriaLicenciaId > 0 && c.fechaEmision)
      .map((c) => ({
        categoriaLicenciaId: c.categoriaLicenciaId,
        fechaEmision: c.fechaEmision,
      }));

    return {
      empresaId: formData.empresaId,
      nombre: formData.nombre,
      apellidos: formData.apellidos,
      carneIdentidad: formData.carneIdentidad,
      numeroLicencia: formData.numeroLicencia,
      fechaNacimiento: formData.fechaNacimiento,
      categorias: validCategorias.length > 0 ? validCategorias : undefined,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = buildRequestPayload();
      if (editingEntity) {
        await updateItem(editingEntity.id, payload);
        addToast({ type: 'success', title: 'Chofer actualizado', message: 'El registro se ha actualizado correctamente.' });
      } else {
        await createItem(payload);
        addToast({ type: 'success', title: 'Chofer creado', message: 'El nuevo registro se ha creado correctamente.' });
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
      addToast({ type: 'success', title: 'Chofer eliminado', message: 'El registro se ha eliminado correctamente.' });
      setDeleteTarget(null);
    } catch {
      // error handled by useCrud → toast via useEffect
    }
  };

  // Filter data for search
  const filteredData = search
    ? data.filter((item) => {
        const searchStr = `${item.nombre} ${item.apellidos} ${item.carneIdentidad} ${item.numeroLicencia} ${item.empresa.nombre}`.toLowerCase();
        return searchStr.includes(search.toLowerCase());
      })
    : data;

  // ---- Render ----

  return (
    <div>
      <PageHeader title="Choferes" description="Gestión de los choferes del sistema">
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
                <th className="table-header px-4 py-3">Nombre</th>
                <th className="table-header px-4 py-3">Apellidos</th>
                <th className="table-header px-4 py-3">Carné Identidad</th>
                <th className="table-header px-4 py-3">No. Licencia</th>
                <th className="table-header px-4 py-3">Empresa</th>
                <th className="table-header px-4 py-3">F. Nacimiento</th>
                <th className="table-header px-4 py-3">Categorías</th>
                <th className="table-header px-4 py-3 text-right">Estado</th>
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
                      <span className="table-cell block">{item.nombre}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="table-cell block">{item.apellidos}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="table-cell block">{item.carneIdentidad}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="table-cell block">{item.numeroLicencia}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="table-cell block">{item.empresa.nombre}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="table-cell block">{item.fechaNacimiento}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {item.categorias.filter((c) => c.activo).length > 0
                          ? item.categorias
                              .filter((c) => c.activo)
                              .map((c) => (
                                <span
                                  key={c.id}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700"
                                >
                                  {c.categoriaLicencia.codigo}
                                </span>
                              ))
                          : <span className="text-gray-400 text-sm">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.activo ? (
                        <span className="badge-active">Activo</span>
                      ) : (
                        <span className="badge-inactive">Inactivo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
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
        title={editingEntity ? 'Editar Chofer' : 'Nuevo Chofer'}
        onClose={() => setShowForm(false)}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Empresa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="empresaId" className="block text-sm font-medium text-gray-700 mb-1.5">
                Empresa<span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <select
                  id="empresaId"
                  value={formData.empresaId}
                  onChange={(e) => handleFieldChange('empresaId', Number(e.target.value))}
                  className="input-field appearance-none pr-8"
                  required
                >
                  <option value={0}>Seleccionar...</option>
                  {empresas
                    .filter((emp) => emp.activo)
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nombre}
                      </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Fecha Nacimiento */}
            <div>
              <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-700 mb-1.5">
                Fecha de Nacimiento<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="fechaNacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => handleFieldChange('fechaNacimiento', e.target.value)}
                className="input-field"
                required
              />
            </div>

            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="nombre"
                type="text"
                value={formData.nombre}
                onChange={(e) => handleFieldChange('nombre', e.target.value)}
                className="input-field"
                placeholder="Ej: Carlos"
                required
              />
            </div>

            {/* Apellidos */}
            <div>
              <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 mb-1.5">
                Apellidos<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="apellidos"
                type="text"
                value={formData.apellidos}
                onChange={(e) => handleFieldChange('apellidos', e.target.value)}
                className="input-field"
                placeholder="Ej: Pérez García"
                required
              />
            </div>

            {/* Carné Identidad */}
            <div>
              <label htmlFor="carneIdentidad" className="block text-sm font-medium text-gray-700 mb-1.5">
                Carné de Identidad<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="carneIdentidad"
                type="text"
                value={formData.carneIdentidad}
                onChange={(e) => handleFieldChange('carneIdentidad', e.target.value)}
                className="input-field"
                placeholder="Ej: 90010112345"
                required
              />
            </div>

            {/* Número Licencia */}
            <div>
              <label htmlFor="numeroLicencia" className="block text-sm font-medium text-gray-700 mb-1.5">
                Número de Licencia<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="numeroLicencia"
                type="text"
                value={formData.numeroLicencia}
                onChange={(e) => handleFieldChange('numeroLicencia', e.target.value)}
                className="input-field"
                placeholder="Ej: L-123456"
                required
              />
            </div>
          </div>

          {/* Categorías de Licencia - Sub-form */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Categorías de Licencia
              </label>
              <button
                type="button"
                onClick={handleAddCategoria}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar
              </button>
            </div>

            {formData.categorias.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-3 px-4 bg-gray-50 rounded-lg">
                No hay categorías agregadas. Haga clic en &quot;Agregar&quot; para añadir una.
              </p>
            ) : (
              <div className="space-y-2">
                {formData.categorias.map((cat, index) => (
                  <div key={cat.tempId} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs font-medium text-gray-400 w-5 shrink-0">{index + 1}</span>
                    <div className="relative flex-1">
                      <select
                        value={cat.categoriaLicenciaId}
                        onChange={(e) => handleCategoriaChange(cat.tempId, 'categoriaLicenciaId', Number(e.target.value))}
                        className="input-field text-sm py-2 appearance-none pr-8"
                      >
                        <option value={0}>Categoría...</option>
                        {categoriasLicencia
                          .filter((c) => c.activo)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.codigo} - {c.denominacion}
                            </option>
                          ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                    <input
                      type="date"
                      value={cat.fechaEmision}
                      onChange={(e) => handleCategoriaChange(cat.tempId, 'fechaEmision', e.target.value)}
                      className="input-field text-sm py-2 w-40 shrink-0"
                      title="Fecha de emisión"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCategoria(cat.tempId)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      title="Quitar categoría"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
        title="Eliminar Chofer"
        message="¿Está seguro que desea eliminar este registro? Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Eliminar"
        danger
      />
    </div>
  );
}
