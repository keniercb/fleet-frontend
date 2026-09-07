import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { useCrud } from '@/hooks/useCrud';
import { useToast } from '@/contexts/ToastContext';
import { rolesApi, permissionsApi } from '@/api/endpoints';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import type { RoleRequest, RoleResponse, PermissionResponse } from '@/types';
import { isToastAlreadyShown } from '@/api/toastBridge';

// ---- Types ----

interface FormData {
  name: string;
  description: string;
  permissionIds: number[];
}

const EMPTY_FORM: FormData = {
  name: '',
  description: '',
  permissionIds: [],
};

// ---- Component ----

export default function RolesPage() {
  const { t } = useTranslation(['admin', 'common', 'crud']);
  const {
    data, loading, saving, totalPages, totalElements, page, size, error,
    setPage, createItem, updateItem, deleteItem,
  } = useCrud<RoleRequest, RoleResponse>(rolesApi);

  const { addToast } = useToast();

  // Permissions for the multi-select
  const [allPermissions, setAllPermissions] = useState<PermissionResponse[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  // UI state
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<RoleResponse | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<RoleResponse | null>(null);

  // Show error as toast
  useEffect(() => {
    if (error) {
      addToast({ type: 'error', title: t('common:state.error'), message: error });
    }
  }, [error, addToast, t]);

  // Fetch all permissions for the multi-select
  const fetchPermissions = useCallback(async () => {
    setLoadingPermissions(true);
    try {
      const res = await permissionsApi.findAll({ page: 0, perPage: 500 });
      setAllPermissions(res.data.content.filter((p) => p.activo));
    } catch (err) {
      if (!isToastAlreadyShown(err)) {
      addToast({ type: 'error', title: t('common:state.error'), message: t('admin:roles.toast.permissionsLoadError') });
      }
    } finally {
      setLoadingPermissions(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // ---- Handlers ----

  const handleOpenCreate = () => {
    setEditingEntity(null);
    setFormData({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const handleOpenEdit = (entity: RoleResponse) => {
    setEditingEntity(entity);
    setFormData({
      name: entity.name,
      description: entity.description ?? '',
      permissionIds: entity.permissions.map((p) => p.id),
    });
    setShowForm(true);
  };

  const handleTogglePermission = (permissionId: number) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: RoleRequest = {
        name: formData.name,
        description: formData.description || undefined,
        permissionIds: formData.permissionIds.length > 0 ? formData.permissionIds : undefined,
      };
      if (editingEntity) {
        await updateItem(editingEntity.id, payload);
        addToast({ type: 'success', title: t('admin:roles.toast.updated'), message: t('crud:toast.updated') });
      } else {
        await createItem(payload);
        addToast({ type: 'success', title: t('admin:roles.toast.created'), message: t('crud:toast.created') });
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
      addToast({ type: 'success', title: t('admin:roles.toast.deleted'), message: t('crud:toast.deleted') });
      setDeleteTarget(null);
    } catch {
      // error handled by useCrud → toast via useEffect
    }
  };

  // Search
  const filteredData = search
    ? data.filter((item) => {
        const searchStr = `${item.name} ${item.description}`.toLowerCase();
        return searchStr.includes(search.toLowerCase());
      })
    : data;

  return (
    <div>
      <PageHeader title={t('admin:roles.title')} description={t('admin:roles.description')}>
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
                <th className="table-header px-4 py-3">{t('admin:roles.table.name')}</th>
                <th className="table-header px-4 py-3">{t('admin:roles.table.description')}</th>
                <th className="table-header px-4 py-3">{t('admin:roles.table.permissions')}</th>
                <th className="table-header px-4 py-3 text-right">{t('admin:roles.table.state')}</th>
                <th className="table-header px-4 py-3 text-right">{t('admin:roles.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
                      {t('crud:states.loading')}
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    {search ? t('crud:states.noResults') : t('crud:states.empty')}
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="table-cell block font-medium text-gray-900">{item.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="table-cell block">{item.description || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="table-cell block">
                        {item.permissions.length > 0
                          ? item.permissions.map((p) => p.name).join(', ')
                          : <span className="text-gray-400">{t('admin:roles.form.noPermissions')}</span>}
                      </span>
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
        title={editingEntity ? t('admin:roles.form.editTitle') : t('admin:roles.form.newTitle')}
        onClose={() => setShowForm(false)}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('admin:roles.form.name.label')}<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="input-field"
                placeholder={t('admin:roles.form.name.placeholder')}
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('admin:roles.form.description.label')}
              </label>
              <input
                id="description"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="input-field"
                placeholder={t('admin:roles.form.description.placeholder')}
              />
            </div>
          </div>

          {/* Permissions multi-select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('admin:roles.form.permissions.label')}
            </label>
            {loadingPermissions ? (
              <div className="flex items-center gap-2 text-gray-400 py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600" />
                {t('admin:roles.form.loadingPermissions')}
              </div>
            ) : allPermissions.length === 0 ? (
              <p className="text-gray-400 text-sm py-2">{t('admin:roles.form.noPermissionsAvailable')}</p>
            ) : (
              <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
                {allPermissions.map((perm) => {
                  const isSelected = formData.permissionIds.includes(perm.id);
                  return (
                    <button
                      key={perm.id}
                      type="button"
                      onClick={() => handleTogglePermission(perm.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                        isSelected
                          ? 'bg-primary-50 text-primary-700 border border-primary-200'
                          : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-primary-600 border-primary-600'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className="font-medium">{perm.name}</span>
                      </span>
                      <span className="text-xs text-gray-500 truncate ml-2 max-w-[200px]">
                        {perm.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {formData.permissionIds.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs text-gray-500">{t('admin:roles.form.permissionsSelected', { count: formData.permissionIds.length })}</span>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, permissionIds: [] }))}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" />
                  {t('admin:roles.form.clear')}
                </button>
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
        title={t('admin:roles.delete.title')}
        message={t('admin:roles.delete.confirm')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText={t('common:actions.delete')}
        danger
      />
    </div>
  );
}
