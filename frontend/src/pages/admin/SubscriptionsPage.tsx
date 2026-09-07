import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, FilterX, AlertTriangle } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { subscriptionsApi, empresasApi, plansApi } from '@/api/endpoints';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useSubscriptionStatusInfo } from '@/utils/statusLabels';
import type { SubscriptionRequest, SubscriptionResponse, SubscriptionStatus, EmpresaResponse, PlanResponse, PageParams } from '@/types';
import { isToastAlreadyShown } from '@/api/toastBridge';

const STATUS_VALUES: SubscriptionStatus[] = ['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED'];

function formatLocalDate(dateStr: string): string {
  if (!dateStr) return '\u2014';
  return dateStr.length === 10 ? dateStr : dateStr.split('T')[0];
}

export default function SubscriptionsPage() {
  const { t } = useTranslation(['admin', 'common', 'crud']);
  const { addToast } = useToast();
  const getStatusInfo = useSubscriptionStatusInfo();
  const [data, setData] = useState<SubscriptionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(15);
  const [filterEmpresaId, setFilterEmpresaId] = useState<string>('');
  const [filterPlanId, setFilterPlanId] = useState<string>('');
  const [empresas, setEmpresas] = useState<EmpresaResponse[]>([]);
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<SubscriptionResponse | null>(null);
  const [formPlanId, setFormPlanId] = useState<string>('');
  const [formStatus, setFormStatus] = useState<SubscriptionStatus>('ACTIVE');
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionResponse | null>(null);

  useEffect(() => {
    empresasApi.findAll({ page: 0, perPage: 500 }).then((res) => setEmpresas(res.data.content.filter((e) => e.activo))).catch(() => setEmpresas([]));
    plansApi.findAll({ page: 0, perPage: 500 }).then((res) => setPlans(res.data.content.filter((p) => p.activo))).catch(() => setPlans([]));
  }, []);

  const fetchData = useCallback(async (p: number, empresaId?: number, planId?: number) => {
    setLoading(true);
    try {
      const params: PageParams = { page: p, perPage: size };
      let res;
      if (empresaId) {
        res = await subscriptionsApi.findByEmpresaId(empresaId, params);
      } else if (planId) {
        res = await subscriptionsApi.findByPlanId(planId, params);
      } else {
        res = await subscriptionsApi.findAll(params);
      }
      let content = res.data.content;
      if (empresaId && planId) {
        const empRes = await subscriptionsApi.findByEmpresaId(empresaId, { page: 0, perPage: 1000 });
        content = empRes.data.content.filter((s) => s.plan?.id === Number(planId));
      }
      setData(content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } catch (err) {
      if (!isToastAlreadyShown(err)) {
      addToast({ type: 'error', title: t('common:state.error'), message: t('admin:subscription.toast.loadError') });
      setData([]);
      }
    } finally { setLoading(false); }
  }, [size, addToast, t]);

  useEffect(() => {
    const empId = filterEmpresaId ? Number(filterEmpresaId) : undefined;
    const planId = filterPlanId ? Number(filterPlanId) : undefined;
    setPage(0);
    fetchData(0, empId, planId);
  }, [filterEmpresaId, filterPlanId, fetchData]);

  const handleClearFilters = () => { setFilterEmpresaId(''); setFilterPlanId(''); setPage(0); };
  const hasActiveFilters = !!filterEmpresaId || !!filterPlanId;

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === Number(formPlanId)),
    [plans, formPlanId],
  );

  const planWarnings = useMemo(() => {
    if (!editingEntity || !selectedPlan) return [];
    const w: string[] = [];
    if (selectedPlan.maxUsuarios < (editingEntity.currentUserCount ?? 0)) {
      w.push(t('admin:subscription.warnings.planLimitUsers', { max: selectedPlan.maxUsuarios, current: editingEntity.currentUserCount }));
    }
    if (selectedPlan.maxVehiculos < (editingEntity.currentVehicleCount ?? 0)) {
      w.push(t('admin:subscription.warnings.planLimitVehicles', { max: selectedPlan.maxVehiculos, current: editingEntity.currentVehicleCount }));
    }
    return w;
  }, [editingEntity, selectedPlan]);

  const canSubmit = planWarnings.length === 0;

  const handleOpenEdit = (entity: SubscriptionResponse) => {
    setEditingEntity(entity);
    setFormPlanId(String(entity.plan?.id ?? ''));
    setFormStatus(entity.status);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntity || !canSubmit) return;
    setSaving(true);
    try {
      const payload: SubscriptionRequest = {
        empresaId: editingEntity.empresa.id,
        planId: Number(formPlanId),
        status: formStatus,
      };
      await subscriptionsApi.update(editingEntity.id, payload);
      addToast({ type: 'success', title: t('admin:subscription.toast.updated'), message: t('crud:toast.updated') });
      setShowForm(false);
      fetchData(page, filterEmpresaId ? Number(filterEmpresaId) : undefined, filterPlanId ? Number(filterPlanId) : undefined);
    } catch (err) {
      if (!isToastAlreadyShown(err)) {
      addToast({ type: 'error', title: t('common:state.error'), message: t('admin:subscription.toast.updateError') });
      }
    } finally { setSaving(false); }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await subscriptionsApi.delete(deleteTarget.id);
      addToast({ type: 'success', title: t('admin:subscription.toast.deleted'), message: t('crud:toast.deleted') });
      setDeleteTarget(null);
      fetchData(page, filterEmpresaId ? Number(filterEmpresaId) : undefined, filterPlanId ? Number(filterPlanId) : undefined);
    } catch (err) {
      if (!isToastAlreadyShown(err)) {
      addToast({ type: 'error', title: t('common:state.error'), message: t('admin:subscription.toast.deleteError') });
      }
    } finally { setSaving(false); }
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    const info = getStatusInfo(status);
    if (!info) return <span className='text-sm text-gray-500'>{status}</span>;
    return <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${info.badgeClass}`}>{info.label}</span>;
  };

  return (
    <div>
      <PageHeader title={t('admin:subscription.title')} description={t('admin:subscription.description')} />

      <div className='card mb-4 !py-3'>
        <div className='flex flex-col sm:flex-row items-start sm:items-end gap-3'>
          <div className='w-full sm:w-64'>
            <label htmlFor='filter-empresa' className='block text-xs font-medium text-gray-500 mb-1'>{t('admin:subscription.filters.company')}</label>
            <select id='filter-empresa' value={filterEmpresaId} onChange={(e) => setFilterEmpresaId(e.target.value)} className='input-field py-2 text-sm'>
              <option value=''>{t('admin:subscription.filters.allCompanies')}</option>
              {empresas.map((emp) => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
            </select>
          </div>
          <div className='w-full sm:w-64'>
            <label htmlFor='filter-plan' className='block text-xs font-medium text-gray-500 mb-1'>{t('admin:subscription.filters.plan')}</label>
            <select id='filter-plan' value={filterPlanId} onChange={(e) => setFilterPlanId(e.target.value)} className='input-field py-2 text-sm'>
              <option value=''>{t('admin:subscription.filters.allPlans')}</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          {hasActiveFilters && (
            <div>
              <button onClick={handleClearFilters} className='flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors' title={t('admin:subscription.filters.clear')}>
                <FilterX className='w-4 h-4' /> {t('admin:subscription.filters.clear')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className='card !p-0 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr>
                <th className='table-header px-4 py-3'>{t('admin:subscription.table.company')}</th>
                <th className='table-header px-4 py-3'>{t('admin:subscription.table.plan')}</th>
                <th className='table-header px-4 py-3'>{t('admin:subscription.table.state')}</th>
                <th className='table-header px-4 py-3'>{t('admin:subscription.table.startDate')}</th>
                <th className='table-header px-4 py-3'>{t('admin:subscription.table.endDate')}</th>
                <th className='table-header px-4 py-3 text-right'>{t('admin:subscription.table.vehicles')}</th>
                <th className='table-header px-4 py-3 text-right'>{t('admin:subscription.table.users')}</th>
                <th className='table-header px-4 py-3 text-right'>{t('admin:subscription.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className='px-4 py-12 text-center text-gray-400'>
                  <div className='flex items-center justify-center gap-2'>
                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600' /> {t('crud:states.loading')}
                  </div>
                </td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={8} className='px-4 py-12 text-center text-gray-400'>
                  {hasActiveFilters ? t('admin:subscription.noResultsFiltered') : t('crud:states.empty')}
                </td></tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className='hover:bg-gray-50 transition-colors'>
                    <td className='px-4 py-3'>
                      <span className='table-cell block font-medium text-gray-900'>{item.empresa?.nombre ?? '\u2014'}</span>
                      {item.empresa?.codigo && <span className='text-xs text-gray-400'>{item.empresa.codigo}</span>}
                    </td>
                    <td className='px-4 py-3'>
                      <span className='table-cell block'>{item.plan?.nombre ?? '\u2014'}</span>
                    </td>
                    <td className='px-4 py-3'>{getStatusBadge(item.status)}</td>
                    <td className='px-4 py-3'><span className='table-cell block'>{formatLocalDate(item.startDate)}</span></td>
                    <td className='px-4 py-3'><span className='table-cell block'>{formatLocalDate(item.endDate)}</span></td>
                    <td className='px-4 py-3 text-right'>
                      <span className='table-cell block'>{item.currentVehicleCount ?? 0} / {item.plan?.maxVehiculos ?? '\u2014'}</span>
                    </td>
                    <td className='px-4 py-3 text-right'>
                      <span className='table-cell block'>{item.currentUserCount ?? 0} / {item.plan?.maxUsuarios ?? '\u2014'}</span>
                    </td>
                    <td className='px-4 py-3 text-right'>
                      <div className='flex items-center justify-end gap-1'>
                        <button onClick={() => handleOpenEdit(item)} className='p-1.5 hover:bg-primary-50 rounded-lg text-gray-400 hover:text-primary-600 transition-colors' title={t('common:actions.edit')}><Pencil className='w-4 h-4' /></button>
                        <button onClick={() => setDeleteTarget(item)} className='p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors' title={t('common:actions.delete')}><Trash2 className='w-4 h-4' /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className='px-4 pb-4'><Pagination page={page} totalPages={totalPages} totalElements={totalElements} size={size} onPageChange={setPage} /></div>
      </div>

      <Modal open={showForm} title={t('admin:subscription.form.editTitle')} onClose={() => setShowForm(false)} size='lg'>
        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Read-only info */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1.5'>{t('admin:subscription.form.company')}</label>
              <input type='text' value={editingEntity?.empresa?.nombre ?? ''} className='input-field bg-gray-50' disabled />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1.5'>{t('admin:subscription.form.currentPlan')}</label>
              <input type='text' value={editingEntity?.plan?.nombre ?? ''} className='input-field bg-gray-50' disabled />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1.5'>{t('admin:subscription.form.startDate')}</label>
              <input type='text' value={formatLocalDate(editingEntity?.startDate ?? '')} className='input-field bg-gray-50' disabled />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1.5'>{t('admin:subscription.form.endDate')}</label>
              <input type='text' value={formatLocalDate(editingEntity?.endDate ?? '')} className='input-field bg-gray-50' disabled />
            </div>
          </div>

          <div className='border-t border-gray-200 pt-4'>
            <p className='text-sm font-medium text-gray-700 mb-3'>{t('admin:subscription.form.editableFields')}</p>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label htmlFor='edit-planId' className='block text-sm font-medium text-gray-700 mb-1.5'>{t('admin:subscription.form.plan')} <span className='text-red-500'>*</span></label>
                <select id='edit-planId' value={formPlanId} onChange={(e) => setFormPlanId(e.target.value)} className='input-field' required>
                  <option value=''>{t('admin:subscription.form.selectPlaceholder')}</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.nombre} (Max {p.maxUsuarios} usr / {p.maxVehiculos} veh)</option>)}
                </select>
              </div>
              <div>
                <label htmlFor='edit-status' className='block text-sm font-medium text-gray-700 mb-1.5'>{t('admin:subscription.form.state')}</label>
                <select id='edit-status' value={formStatus} onChange={(e) => setFormStatus(e.target.value as SubscriptionStatus)} className='input-field'>
                  {STATUS_VALUES.map((s) => {
                    const info = getStatusInfo(s);
                    return <option key={s} value={s}>{info.label}</option>;
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Plan change warnings */}
          {planWarnings.length > 0 && (
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-1'>
              {planWarnings.map((w, i) => (
                <div key={i} className='flex items-start gap-2 text-sm text-yellow-800'>
                  <AlertTriangle className='w-4 h-4 mt-0.5 flex-shrink-0' />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Current usage summary */}
          {selectedPlan && editingEntity && (
            <div className='bg-gray-50 rounded-lg p-3'>
              <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2'>{t('admin:subscription.form.usageSummary')}</p>
              <div className='grid grid-cols-2 gap-3 text-sm'>
                <div>
                  <span className='text-gray-500'>{t('admin:subscription.form.users')}: </span>
                  <span className='font-medium'>{editingEntity.currentUserCount ?? 0}</span>
                  <span className='text-gray-400'> / {selectedPlan.maxUsuarios} {t('admin:subscription.form.max')}</span>
                </div>
                <div>
                  <span className='text-gray-500'>{t('admin:subscription.form.vehicles')}: </span>
                  <span className='font-medium'>{editingEntity.currentVehicleCount ?? 0}</span>
                  <span className='text-gray-400'> / {selectedPlan.maxVehiculos} {t('admin:subscription.form.max')}</span>
                </div>
              </div>
            </div>
          )}

          <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
            <button type='button' onClick={() => setShowForm(false)} className='btn-secondary'>{t('common:actions.cancel')}</button>
            <button type='submit' disabled={saving || !canSubmit} className='btn-primary'>
              {saving ? t('common:actions.saving') : t('common:actions.update')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal open={!!deleteTarget} title={t('admin:subscription.delete.title')} message={t('admin:subscription.delete.confirm')} onConfirm={handleConfirmDelete} onCancel={() => setDeleteTarget(null)} confirmText={t('common:actions.delete')} danger />
    </div>
  );
}
