import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, FilterX } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { subscriptionsApi, empresasApi, plansApi } from '@/api/endpoints';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import type { SubscriptionRequest, SubscriptionResponse, SubscriptionStatus, EmpresaResponse, PlanResponse, PageParams } from '@/types';

interface FormData {
  empresaId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  currentVehicleCount: string;
}

const EMPTY_FORM: FormData = {
  empresaId: '', planId: '', startDate: '', endDate: '', status: 'ACTIVE', currentVehicleCount: '',
};

const STATUS_OPTIONS: { value: SubscriptionStatus; label: string; className: string }[] = [
  { value: 'TRIAL', label: 'Trial', className: 'bg-blue-100 text-blue-800' },
  { value: 'ACTIVE', label: 'Activa', className: 'bg-green-100 text-green-800' },
  { value: 'PAST_DUE', label: 'Vencida', className: 'bg-yellow-100 text-yellow-800' },
  { value: 'CANCELED', label: 'Cancelada', className: 'bg-red-100 text-red-800' },
  { value: 'EXPIRED', label: 'Expirada', className: 'bg-gray-100 text-gray-800' },
];

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return dateStr.length === 10 ? dateStr : dateStr.split('T')[0];
}

export default function SubscriptionsPage() {
  const { addToast } = useToast();
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
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
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
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Error al cargar las suscripciones.' });
      setData([]);
    } finally { setLoading(false); }
  }, [size, addToast]);

  useEffect(() => {
    const empId = filterEmpresaId ? Number(filterEmpresaId) : undefined;
    const planId = filterPlanId ? Number(filterPlanId) : undefined;
    setPage(0);
    fetchData(0, empId, planId);
  }, [filterEmpresaId, filterPlanId, fetchData]);

  const handleClearFilters = () => { setFilterEmpresaId(''); setFilterPlanId(''); setPage(0); };
  const hasActiveFilters = !!filterEmpresaId || !!filterPlanId;

  const handleOpenEdit = (entity: SubscriptionResponse) => {
    setEditingEntity(entity);
    setFormData({
      empresaId: String(entity.empresa?.id ?? ''),
      planId: String(entity.plan?.id ?? ''),
      startDate: entity.startDate ? entity.startDate.split('T')[0] : '',
      endDate: entity.endDate ? entity.endDate.split('T')[0] : '',
      status: entity.status,
      currentVehicleCount: entity.currentVehicleCount != null ? String(entity.currentVehicleCount) : '',
    });
    setShowForm(true);
  };

  const handleFieldChange = (key: keyof FormData, value: string) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntity) return;
    setSaving(true);
    try {
      const payload: SubscriptionRequest = {
        empresaId: Number(formData.empresaId),
        planId: Number(formData.planId),
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        currentVehicleCount: formData.currentVehicleCount ? Number(formData.currentVehicleCount) : undefined,
      };
      await subscriptionsApi.update(editingEntity.id, payload);
      addToast({ type: 'success', title: 'Suscripción actualizada', message: 'El registro se ha actualizado correctamente.' });
      setShowForm(false);
      fetchData(page, filterEmpresaId ? Number(filterEmpresaId) : undefined, filterPlanId ? Number(filterPlanId) : undefined);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Error al actualizar la suscripción.' });
    } finally { setSaving(false); }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await subscriptionsApi.delete(deleteTarget.id);
      addToast({ type: 'success', title: 'Suscripción eliminada', message: 'El registro se ha eliminado correctamente.' });
      setDeleteTarget(null);
      fetchData(page, filterEmpresaId ? Number(filterEmpresaId) : undefined, filterPlanId ? Number(filterPlanId) : undefined);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Error al eliminar la suscripción.' });
    } finally { setSaving(false); }
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    const found = STATUS_OPTIONS.find((s) => s.value === status);
    if (!found) return <span className="text-sm text-gray-500">{status}</span>;
    return <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${found.className}`}>{found.label}</span>;
  };

  return (
    <div>
      <PageHeader title="Suscripciones" description="Gestión de suscripciones de empresas a planes" />

      <div className="card mb-4 !py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="w-full sm:w-64">
            <label htmlFor="filter-empresa" className="block text-xs font-medium text-gray-500 mb-1">Empresa</label>
            <select id="filter-empresa" value={filterEmpresaId} onChange={(e) => setFilterEmpresaId(e.target.value)} className="input-field py-2 text-sm">
              <option value="">Todas las empresas</option>
              {empresas.map((emp) => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
            </select>
          </div>
          <div className="w-full sm:w-64">
            <label htmlFor="filter-plan" className="block text-xs font-medium text-gray-500 mb-1">Plan</label>
            <select id="filter-plan" value={filterPlanId} onChange={(e) => setFilterPlanId(e.target.value)} className="input-field py-2 text-sm">
              <option value="">Todos los planes</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          {hasActiveFilters && (
            <div>
              <button onClick={handleClearFilters} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Limpiar filtros">
                <FilterX className="w-4 h-4" /> Limpiar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header px-4 py-3">Empresa</th>
                <th className="table-header px-4 py-3">Plan</th>
                <th className="table-header px-4 py-3">Estado</th>
                <th className="table-header px-4 py-3">Fecha Inicio</th>
                <th className="table-header px-4 py-3">Fecha Fin</th>
                <th className="table-header px-4 py-3 text-right">Vehículos</th>
                <th className="table-header px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" /> Cargando...
                  </div>
                </td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  {hasActiveFilters ? 'No se encontraron resultados para los filtros aplicados' : 'No hay registros'}
                </td></tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="table-cell block font-medium text-gray-900">{item.empresa?.nombre ?? '—'}</span>
                      {item.empresa?.codigo && <span className="text-xs text-gray-400">{item.empresa.codigo}</span>}
                    </td>
                    <td className="px-4 py-3"><span className="table-cell block">{item.plan?.nombre ?? '—'}</span></td>
                    <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-3"><span className="table-cell block">{formatDate(item.startDate)}</span></td>
                    <td className="px-4 py-3"><span className="table-cell block">{formatDate(item.endDate)}</span></td>
                    <td className="px-4 py-3 text-right"><span className="table-cell block">{item.currentVehicleCount ?? '—'}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleOpenEdit(item)} className="p-1.5 hover:bg-primary-50 rounded-lg text-gray-400 hover:text-primary-600 transition-colors" title="Editar"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget(item)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4"><Pagination page={page} totalPages={totalPages} totalElements={totalElements} size={size} onPageChange={setPage} /></div>
      </div>

      <Modal open={showForm} title="Editar Suscripción" onClose={() => setShowForm(false)} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="empresaId" className="block text-sm font-medium text-gray-700 mb-1.5">Empresa</label>
              <select id="empresaId" value={formData.empresaId} onChange={(e) => handleFieldChange('empresaId', e.target.value)} className="input-field" required disabled>
                <option value="">Seleccionar...</option>
                {empresas.map((emp) => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="planId" className="block text-sm font-medium text-gray-700 mb-1.5">Plan</label>
              <select id="planId" value={formData.planId} onChange={(e) => handleFieldChange('planId', e.target.value)} className="input-field" required>
                <option value="">Seleccionar...</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
              <select id="status" value={formData.status} onChange={(e) => handleFieldChange('status', e.target.value)} className="input-field" required>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="currentVehicleCount" className="block text-sm font-medium text-gray-700 mb-1.5">Vehículos Actuales</label>
              <input id="currentVehicleCount" type="number" min="0" value={formData.currentVehicleCount} onChange={(e) => handleFieldChange('currentVehicleCount', e.target.value)} className="input-field" placeholder="Ej: 5" />
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1.5">Fecha Inicio<span className="text-red-500 ml-0.5">*</span></label>
              <input id="startDate" type="date" value={formData.startDate} onChange={(e) => handleFieldChange('startDate', e.target.value)} className="input-field" required />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1.5">Fecha Fin<span className="text-red-500 ml-0.5">*</span></label>
              <input id="endDate" type="date" value={formData.endDate} onChange={(e) => handleFieldChange('endDate', e.target.value)} className="input-field" required />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Actualizar'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal open={!!deleteTarget} title="Eliminar Suscripción" message="¿Está seguro que desea eliminar esta suscripción? Esta acción no se puede deshacer." onConfirm={handleConfirmDelete} onCancel={() => setDeleteTarget(null)} confirmText="Eliminar" danger />
    </div>
  );
}
