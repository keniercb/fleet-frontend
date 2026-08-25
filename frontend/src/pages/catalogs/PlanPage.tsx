import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { plansApi, featuresApi } from '@/api/endpoints';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import type { PlanRequest, PlanResponse, FeatureResponse } from '@/types';

interface FormData {
  nombre: string;
  precioMensual: string;
  maxUsuarios: string;
  maxVehiculos: string;
  duracion: string;
  porcientoDescuentoAnual: string;
  featureIds: number[];
}

const EMPTY_FORM: FormData = {
  nombre: '',
  precioMensual: '',
  maxUsuarios: '',
  maxVehiculos: '',
  duracion: '',
  porcientoDescuentoAnual: '',
  featureIds: [],
};

function formatCurrency(val: number | undefined | null): string {
  if (val == null) return '—';
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PlanPage() {
  const { addToast } = useToast();
  const [data, setData] = useState<PlanResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(15);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [viewEntity, setViewEntity] = useState<PlanResponse | null>(null);
  const [editingEntity, setEditingEntity] = useState<PlanResponse | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<PlanResponse | null>(null);
  const [allFeatures, setAllFeatures] = useState<FeatureResponse[]>([]);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await plansApi.findAll({ page: p, perPage: size });
      setData(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } catch {
      setError('Error al cargar los planes');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [size]);

  useEffect(() => { fetchData(page); }, [page, fetchData]);

  const fetchFeatures = useCallback(async () => {
    try {
      const res = await featuresApi.findAll({ page: 0, perPage: 200 });
      setAllFeatures(res.data.content.filter((f) => f.activo));
    } catch { setAllFeatures([]); }
  }, []);

  useEffect(() => { fetchFeatures(); }, [fetchFeatures]);
  useEffect(() => { if (error) addToast({ type: 'error', title: 'Error', message: error }); }, [error, addToast]);

  const handleOpenCreate = () => { setEditingEntity(null); setFormData(EMPTY_FORM); setShowForm(true); };

  const handleOpenEdit = (entity: PlanResponse) => {
    setEditingEntity(entity);
    setFormData({
      nombre: entity.nombre,
      precioMensual: entity.precioMensual != null ? String(entity.precioMensual) : '',
      maxUsuarios: entity.maxUsuarios != null ? String(entity.maxUsuarios) : '',
      maxVehiculos: entity.maxVehiculos != null ? String(entity.maxVehiculos) : '',
      duracion: entity.duracion != null ? String(entity.duracion) : '',
      porcientoDescuentoAnual: entity.porcientoDescuentoAnual != null ? String(entity.porcientoDescuentoAnual) : '',
      featureIds: entity.features?.map((f) => f.id) ?? [],
    });
    setShowForm(true);
  };

  const handleFieldChange = (key: keyof FormData, value: string | number[]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleFeature = (featureId: number) => {
    setFormData((prev) => ({
      ...prev,
      featureIds: prev.featureIds.includes(featureId)
        ? prev.featureIds.filter((id) => id !== featureId)
        : [...prev.featureIds, featureId],
    }));
  };

  const buildPayload = (): PlanRequest => ({
    nombre: formData.nombre,
    precioMensual: formData.precioMensual ? Number(formData.precioMensual) : undefined,
    maxUsuarios: formData.maxUsuarios ? Number(formData.maxUsuarios) : undefined,
    maxVehiculos: formData.maxVehiculos ? Number(formData.maxVehiculos) : undefined,
    duracion: formData.duracion ? Number(formData.duracion) : undefined,
    porcientoDescuentoAnual: formData.porcientoDescuentoAnual ? Number(formData.porcientoDescuentoAnual) : undefined,
    featureIds: formData.featureIds.length > 0 ? formData.featureIds : undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingEntity) {
        await plansApi.update(editingEntity.id, payload);
        addToast({ type: 'success', title: 'Plan actualizado', message: 'El plan se ha actualizado correctamente.' });
      } else {
        await plansApi.create(payload);
        addToast({ type: 'success', title: 'Plan creado', message: 'El nuevo plan se ha creado correctamente.' });
      }
      setShowForm(false);
      fetchData(page);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Error al guardar el plan.' });
    } finally { setSaving(false); }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await plansApi.delete(deleteTarget.id);
      addToast({ type: 'success', title: 'Plan eliminado', message: 'El plan se ha eliminado correctamente.' });
      setDeleteTarget(null);
      fetchData(page);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Error al eliminar el plan.' });
    } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="Planes" description="Gestión de los planes de suscripción">
        <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </PageHeader>

      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header px-4 py-3">Nombre</th>
                <th className="table-header px-4 py-3 text-right">Precio Mensual</th>
                <th className="table-header px-4 py-3 text-right">Max Usuarios</th>
                <th className="table-header px-4 py-3 text-right">Max Vehículos</th>
                <th className="table-header px-4 py-3 text-right">Duración (días)</th>
                <th className="table-header px-4 py-3 text-right">Dto. Anual %</th>
                <th className="table-header px-4 py-3">Features</th>
                <th className="table-header px-4 py-3 text-right">Estado</th>
                <th className="table-header px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" /> Cargando...
                  </div>
                </td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">No hay registros</td></tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3"><span className="table-cell block font-medium text-gray-900">{item.nombre}</span></td>
                    <td className="px-4 py-3 text-right"><span className="table-cell block">${formatCurrency(item.precioMensual)}</span></td>
                    <td className="px-4 py-3 text-right"><span className="table-cell block">{item.maxUsuarios ?? '—'}</span></td>
                    <td className="px-4 py-3 text-right"><span className="table-cell block">{item.maxVehiculos ?? '—'}</span></td>
                    <td className="px-4 py-3 text-right"><span className="table-cell block">{item.duracion ?? '—'}</span></td>
                    <td className="px-4 py-3 text-right"><span className="table-cell block">{item.porcientoDescuentoAnual != null ? item.porcientoDescuentoAnual + "%" : "—"}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {item.features?.length ? item.features.map((f) => (
                          <span key={f.id} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">{f.name}</span>
                        )) : <span className="text-gray-400 text-sm">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.activo ? <span className="badge-active">Activo</span> : <span className="badge-inactive">Inactivo</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setViewEntity(item); setShowView(true); }} className="p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition-colors" title="Ver detalles"><Eye className="w-4 h-4" /></button>
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

      <Modal open={showForm} title={editingEntity ? 'Editar Plan' : 'Nuevo Plan'} onClose={() => setShowForm(false)} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1.5">Nombre<span className="text-red-500 ml-0.5">*</span></label>
              <input id="nombre" type="text" value={formData.nombre} onChange={(e) => handleFieldChange('nombre', e.target.value)} className="input-field" placeholder="Ej: Plan Premium" required />
            </div>
            <div>
              <label htmlFor="precioMensual" className="block text-sm font-medium text-gray-700 mb-1.5">Precio Mensual</label>
              <input id="precioMensual" type="number" min="0" step="0.01" value={formData.precioMensual} onChange={(e) => handleFieldChange('precioMensual', e.target.value)} className="input-field" placeholder="Ej: 99.99" />
            </div>
            <div>
              <label htmlFor="porcientoDescuentoAnual" className="block text-sm font-medium text-gray-700 mb-1.5">Descuento Anual (%)</label>
              <input id="porcientoDescuentoAnual" type="number" min="0" max="100" step="0.01" value={formData.porcientoDescuentoAnual} onChange={(e) => handleFieldChange('porcientoDescuentoAnual', e.target.value)} className="input-field" placeholder="Ej: 10" />
            </div>
            <div>
              <label htmlFor="duracion" className="block text-sm font-medium text-gray-700 mb-1.5">Duración (días)</label>
              <input id="duracion" type="number" min="1" step="1" value={formData.duracion} onChange={(e) => handleFieldChange('duracion', e.target.value)} className="input-field" placeholder="Ej: 30" />
            </div>
            <div>
              <label htmlFor="maxUsuarios" className="block text-sm font-medium text-gray-700 mb-1.5">Max Usuarios</label>
              <input id="maxUsuarios" type="number" min="1" step="1" value={formData.maxUsuarios} onChange={(e) => handleFieldChange('maxUsuarios', e.target.value)} className="input-field" placeholder="Ej: 10" />
            </div>
            <div>
              <label htmlFor="maxVehiculos" className="block text-sm font-medium text-gray-700 mb-1.5">Max Vehículos</label>
              <input id="maxVehiculos" type="number" min="1" step="1" value={formData.maxVehiculos} onChange={(e) => handleFieldChange('maxVehiculos', e.target.value)} className="input-field" placeholder="Ej: 50" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Características</label>
            {allFeatures.length === 0 ? (
              <p className="text-sm text-gray-400">No hay características disponibles</p>
            ) : (
              <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto p-3 space-y-2">
                {allFeatures.map((f) => (
                  <label key={f.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                    <input type="checkbox" checked={formData.featureIds.includes(f.id)} onChange={() => toggleFeature(f.id)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm text-gray-700">{f.name}</span>
                    {f.descripcion && <span className="text-xs text-gray-400 ml-1">— {f.descripcion}</span>}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : editingEntity ? 'Actualizar' : 'Crear'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={showView} title={`Plan: ${viewEntity?.nombre ?? ''}`} onClose={() => setShowView(false)} size="md">
        {viewEntity && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">Precio Mensual</p><p className="text-sm font-semibold">${formatCurrency(viewEntity.precioMensual)}</p></div>
              <div><p className="text-xs text-gray-500">Duración</p><p className="text-sm font-semibold">{viewEntity.duracion ?? '—'} días</p></div>
              <div><p className="text-xs text-gray-500">Descuento Anual</p><p className="text-sm font-semibold">{viewEntity.porcientoDescuentoAnual != null ? viewEntity.porcientoDescuentoAnual + "%" : "—"}</p></div>
              <div><p className="text-xs text-gray-500">Max Usuarios</p><p className="text-sm font-semibold">{viewEntity.maxUsuarios ?? '—'}</p></div>
              <div><p className="text-xs text-gray-500">Max Vehículos</p><p className="text-sm font-semibold">{viewEntity.maxVehiculos ?? '—'}</p></div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Características ({viewEntity.features?.length ?? 0})</p>
              <div className="flex flex-wrap gap-1">
                {viewEntity.features?.length ? viewEntity.features.map((f) => (
                  <span key={f.id} className="inline-block bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-full font-medium">{f.name}</span>
                )) : <span className="text-sm text-gray-400">Sin características asignadas</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Estado:</span>
              {viewEntity.activo ? <span className="badge-active">Activo</span> : <span className="badge-inactive">Inactivo</span>}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!deleteTarget} title="Eliminar Plan" message="¿Está seguro que desea eliminar este plan? Esta acción no se puede deshacer." onConfirm={handleConfirmDelete} onCancel={() => setDeleteTarget(null)} confirmText="Eliminar" danger />
    </div>
  );
}
