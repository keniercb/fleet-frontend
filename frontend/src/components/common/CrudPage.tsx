import { useState, useEffect, type ReactNode } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useCrud } from '@/hooks/useCrud';
import { useToast } from '@/contexts/ToastContext';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import type { PageResponse, PageParams } from '@/types';
import type { AxiosResponse } from 'axios';

// ---- Types for the generic CRUD configuration ----

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

export interface FormFieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'email' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string | number }[];
  colSpan?: 1 | 2;
}

export interface CrudPageConfig<TReq, TRes> {
  title: string;
  singular: string;
  description: string;
  permission: string;
  api: {
    findAll: (params?: PageParams) => Promise<AxiosResponse<PageResponse<TRes>>>;
    create: (data: TReq) => Promise<AxiosResponse<TRes>>;
    update: (id: number, data: TReq) => Promise<AxiosResponse<TRes>>;
    delete: (id: number) => Promise<AxiosResponse<void>>;
  };
  columns: ColumnDef<TRes>[];
  formFields: FormFieldDef[];
  getFormDefaultValues: () => TReq;
  getFormValuesFromEntity: (entity: TRes) => TReq;
  getId: (entity: TRes) => number;
  getIsActive: (entity: TRes) => boolean;
  createPermission?: string;
  updatePermission?: string;
  deletePermission?: string;
}

interface CrudPageProps<TReq, TRes> {
  config: CrudPageConfig<TReq, TRes>;
}

export default function CrudPage<TReq, TRes extends { id: number }>({
  config,
}: CrudPageProps<TReq, TRes>) {
  const {
    title,
    singular,
    description,
    api,
    columns,
    formFields,
    getFormDefaultValues,
    getFormValuesFromEntity,
    getId,
    getIsActive,
  } = config;

  const { data, loading, saving, totalPages, totalElements, page, size, error, setPage, createItem, updateItem, deleteItem } =
    useCrud<TReq, TRes>(api);

  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<TRes | null>(null);
  const [formData, setFormData] = useState<TReq>(getFormDefaultValues());
  const [deleteTarget, setDeleteTarget] = useState<TRes | null>(null);

  // Show error as toast when it changes
  useEffect(() => {
    if (error) {
      addToast({ type: 'error', title: 'Error', message: error });
    }
  }, [error, addToast]);

  // ---- Handlers ----

  const handleOpenCreate = () => {
    setEditingEntity(null);
    setFormData(getFormDefaultValues());
    setShowForm(true);
  };

  const handleOpenEdit = (entity: TRes) => {
    setEditingEntity(entity);
    setFormData(getFormValuesFromEntity(entity));
    setShowForm(true);
  };

  const handleFormChange = (key: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEntity) {
        await updateItem(getId(editingEntity), formData);
        addToast({ type: 'success', title: `${singular} actualizado`, message: 'El registro se ha actualizado correctamente.' });
      } else {
        await createItem(formData);
        addToast({ type: 'success', title: `${singular} creado`, message: 'El nuevo registro se ha creado correctamente.' });
      }
      setShowForm(false);
    } catch {
      // error handled by hook → toast via useEffect
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem(getId(deleteTarget));
      addToast({ type: 'success', title: `${singular} eliminado`, message: 'El registro se ha eliminado correctamente.' });
      setDeleteTarget(null);
    } catch {
      // error handled by hook → toast via useEffect
    }
  };

  const filteredData = search
    ? data.filter((item) =>
        columns.some((col) => {
          const val = (item as Record<string, unknown>)[col.key];
          return val != null && String(val).toLowerCase().includes(search.toLowerCase());
        })
      )
    : data;

  return (
    <div>
      <PageHeader title={title} description={description}>
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
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`table-header px-4 py-3 ${col.className || ''}`}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="table-header px-4 py-3 text-right">Estado</th>
                <th className="table-header px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
                      Cargando...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    {search ? 'No se encontraron resultados' : 'No hay registros'}
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={getId(item)}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={col.className || ''}>
                        <span className="table-cell block">
                          {col.render
                            ? col.render(item)
                            : String((item as Record<string, unknown>)[col.key] ?? '')}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      {getIsActive(item) ? (
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
        title={editingEntity ? `Editar ${singular}` : `Nuevo ${singular}`}
        onClose={() => setShowForm(false)}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formFields.map((field) => (
              <div
                key={field.key}
                className={field.colSpan === 2 ? 'sm:col-span-2' : ''}
              >
                <label
                  htmlFor={field.key}
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={field.key}
                    rows={3}
                    value={(formData as Record<string, unknown>)[field.key] as string ?? ''}
                    onChange={(e) => handleFormChange(field.key, e.target.value)}
                    className="input-field"
                    placeholder={field.placeholder}
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={field.key}
                    value={(formData as Record<string, unknown>)[field.key] as string ?? ''}
                    onChange={(e) => handleFormChange(field.key, e.target.value)}
                    className="input-field"
                    required={field.required}
                  >
                    <option value="">Seleccionar...</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={field.key}
                    type={field.type}
                    value={(formData as Record<string, unknown>)[field.key] as string ?? ''}
                    onChange={(e) =>
                      handleFormChange(
                        field.key,
                        field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value
                      )
                    }
                    className="input-field"
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}
              </div>
            ))}
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
              {saving
                ? 'Guardando...'
                : editingEntity
                  ? 'Actualizar'
                  : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        title={`Eliminar ${singular}`}
        message={`¿Está seguro que desea eliminar este registro? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Eliminar"
        danger
      />
    </div>
  );
}
