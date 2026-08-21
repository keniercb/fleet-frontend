import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, ChevronDown } from 'lucide-react';
import { useCrud } from '@/hooks/useCrud';
import { useToast } from '@/contexts/ToastContext';
import { tarjetasCombustibleApi, currenciesApi, empresasApi } from '@/api/endpoints';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import type {
  TarjetaCombustibleRequest,
  TarjetaCombustibleResponse,
  CurrencyResponse,
  EmpresaResponse,
} from '@/types';

// ---- Types ----

interface FormData {
  numero: string;
  saldo: string;
  currencyId: number;
  empresaId: number;
}

const EMPTY_FORM: FormData = {
  numero: '',
  saldo: '',
  currencyId: 0,
  empresaId: 0,
};

// ---- Component ----

export default function TarjetaCombustiblePage() {
  const {
    data, loading, saving, totalPages, totalElements, page, size, error,
    setPage, createItem, updateItem, deleteItem,
  } = useCrud<TarjetaCombustibleRequest, TarjetaCombustibleResponse>(tarjetasCombustibleApi);

  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<TarjetaCombustibleResponse | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<TarjetaCombustibleResponse | null>(null);

  // Dropdowns
  const [currencies, setCurrencies] = useState<CurrencyResponse[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaResponse[]>([]);

  useEffect(() => {
    if (error) {
      addToast({ type: 'error', title: 'Error', message: error });
    }
  }, [error, addToast]);

  const fetchCurrencies = useCallback(async () => {
    try {
      const res = await currenciesApi.findAll({ page: 0, perPage: 200 });
      setCurrencies(res.data.content.filter((c) => c.activo));
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No se pudieron cargar las monedas.' });
    }
  }, [addToast]);

  const fetchEmpresas = useCallback(async () => {
    try {
      const res = await empresasApi.findAll({ page: 0, perPage: 500 });
      setEmpresas(res.data.content.filter((e) => e.activo));
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No se pudieron cargar las empresas.' });
    }
  }, [addToast]);

  useEffect(() => {
    fetchCurrencies();
    fetchEmpresas();
  }, [fetchCurrencies, fetchEmpresas]);

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
      empresaId: entity.empresa.id,
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
        empresaId: formData.empresaId,
      };
      if (editingEntity) {
        await updateItem(editingEntity.id, payload);
        addToast({ type: 'success', title: 'Tarjeta actualizada', message: 'El registro se ha actualizado correctamente.' });
      } else {
        await createItem(payload);
        addToast({ type: 'success', title: 'Tarjeta creada', message: 'El nuevo registro se ha creado correctamente.' });
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
      addToast({ type: 'success', title: 'Tarjeta eliminada', message: 'El registro se ha eliminado correctamente.' });
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
      <PageHeader title="Tarjetas de Combustible" description="Gestión de tarjetas de combustible">
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
                <th className="table-header px-4 py-3">Número</th>
                <th className="table-header px-4 py-3">Empresa</th>
                <th className="table-header px-4 py-3">Moneda</th>
                <th className="table-header px-4 py-3 text-right">Saldo</th>
                <th className="table-header px-4 py-3 text-right">Estado</th>
                <th className="table-header px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
                      Cargando...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-12 text-center text-gray-400">
                    {search ? 'No se encontraron resultados' : 'No hay registros'}
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
                      <span className="table-cell block">{item.saldo.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
        title={editingEntity ? 'Editar Tarjeta' : 'Nueva Tarjeta'}
        onClose={() => setShowForm(false)}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="numero" className="block text-sm font-medium text-gray-700 mb-1.5">
                Número<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="numero"
                type="text"
                value={formData.numero}
                onChange={(e) => handleFieldChange('numero', e.target.value)}
                className="input-field"
                placeholder="Ej: TC-001"
                required
              />
            </div>
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
                  <option value="0">Seleccionar empresa...</option>
                  {empresas.map((e) => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label htmlFor="currencyId" className="block text-sm font-medium text-gray-700 mb-1.5">
                Moneda<span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <select
                  id="currencyId"
                  value={formData.currencyId}
                  onChange={(e) => handleFieldChange('currencyId', Number(e.target.value))}
                  className="input-field appearance-none pr-8"
                  required
                >
                  <option value="0">Seleccionar moneda...</option>
                  {currencies.map((c) => (
                    <option key={c.id} value={c.id}>{c.isoCode} — {c.descripcion}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label htmlFor="saldo" className="block text-sm font-medium text-gray-700 mb-1.5">
                Saldo<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="saldo"
                type="number"
                min="0"
                step="0.01"
                value={formData.saldo}
                onChange={(e) => handleFieldChange('saldo', e.target.value)}
                className="input-field"
                placeholder="Ej: 1000.00"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
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
        title="Eliminar Tarjeta"
        message="¿Está seguro que desea eliminar esta tarjeta? Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Eliminar"
        danger
      />
    </div>
  );
}
