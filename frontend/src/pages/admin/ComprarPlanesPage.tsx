import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, CreditCard, Car, Users, Clock, Calendar, Tag, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { subscriptionsApi, plansApi } from '@/api/endpoints';
import PageHeader from '@/components/common/PageHeader';
import type { SubscriptionResponse, PlanResponse, SubscriptionStatus } from '@/types';

const statusLabels: Record<string, { label: string; color: string }> = {
  TRIAL: { label: 'Prueba', color: 'bg-blue-100 text-blue-800' },
  ACTIVE: { label: 'Activa', color: 'bg-green-100 text-green-800' },
  PAST_DUE: { label: 'Vencida', color: 'bg-yellow-100 text-yellow-800' },
  CANCELED: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
  EXPIRED: { label: 'Expirada', color: 'bg-gray-100 text-gray-800' },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatCurrency(val: number | undefined | null): string {
  if (val == null) return '-';
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ComprarPlanesPage() {
  const { empresa } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<number | undefined>();
  const [facturacionAnual, setFacturacionAnual] = useState(false);
  const [importe, setImporte] = useState<number | null>(null);
  const [importeLoading, setImporteLoading] = useState(false);

  // Fetch current subscription
  useEffect(() => {
    setSubLoading(true);
    subscriptionsApi
      .getMyCompanySubscription()
      .then((res) => setSubscription(res.data))
      .catch(() => setSubscription(null))
      .finally(() => setSubLoading(false));
  }, []);

  // Fetch active plans
  useEffect(() => {
    setPlansLoading(true);
    plansApi
      .findAll({ page: 0, perPage: 500 })
      .then((res) => {
        const active = res.data.content.filter((p) => p.activo);
        setPlans(active);
        if (active.length > 0 && !selectedPlanId) {
          setSelectedPlanId(active[0].id);
        }
      })
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId),
    [plans, selectedPlanId],
  );

  const duracion = useMemo(() => {
    if (!selectedPlan) return null;
    return facturacionAnual ? 360 : selectedPlan.duracion;
  }, [selectedPlan, facturacionAnual]);

  // Fetch importe when plan or billing changes
  useEffect(() => {
    if (!selectedPlanId) { setImporte(null); return; }
    setImporteLoading(true);
    plansApi
      .calcularImporte(selectedPlanId, facturacionAnual)
      .then((res) => setImporte(res.data.importe))
      .catch(() => setImporte(null))
      .finally(() => setImporteLoading(false));
  }, [selectedPlanId, facturacionAnual]);

  const statusInfo = subscription
    ? statusLabels[subscription.status] || { label: subscription.status, color: 'bg-gray-100 text-gray-800' }
    : null;

  return (
    <div>
      <PageHeader title="Comprar Planes" description="Gestiona la suscripcion de tu empresa">
        <button onClick={() => navigate(-1)} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
      </PageHeader>

      {/* Current Subscription */}
      <div className="card mb-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Suscripcion Actual</h3>
        {subLoading ? (
          <div className="flex items-center gap-2 py-4 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" /> Cargando suscripcion...
          </div>
        ) : subscription ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-primary-50/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-primary-600" />
                <span className="text-xs text-gray-500">Plan</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{subscription.plan.nombre}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Usuarios</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{subscription.currentUserCount} / {subscription.plan.maxUsuarios}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Car className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Vehiculos</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{subscription.currentVehicleCount} / {subscription.plan.maxVehiculos}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Vencimiento</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{formatDate(subscription.endDate)}</p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-sm text-yellow-800">{empresa?.nombre ?? 'Su empresa'} no tiene una suscripcion activa.</p>
          </div>
        )}
      </div>

      {/* Plan Selection */}
      <div className="card mb-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Seleccionar Plan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="plan-select" className="block text-sm font-medium text-gray-700 mb-1.5">Plan <span className="text-red-500">*</span></label>
            {plansLoading ? (
              <div className="flex items-center gap-2 py-2.5 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando planes...
              </div>
            ) : (
              <select
                id="plan-select"
                value={selectedPlanId ?? ''}
                onChange={(e) => setSelectedPlanId(e.target.value ? Number(e.target.value) : undefined)}
                className="input-field"
              >
                <option value="">Seleccionar...</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre} - ${formatCurrency(p.precioMensual)}/mes</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-3 pb-1">
            <input
              id="facturacion-anual"
              type="checkbox"
              checked={facturacionAnual}
              onChange={(e) => setFacturacionAnual(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="facturacion-anual" className="text-sm font-medium text-gray-700">
              Facturacion anual
              {selectedPlan && selectedPlan.porcientoDescuentoAnual != null && selectedPlan.porcientoDescuentoAnual > 0 && (
                <span className="ml-2 text-xs text-green-600 font-semibold">({selectedPlan.porcientoDescuentoAnual}% descuento)</span>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Selected Plan Details */}
      {selectedPlan && (
        <div className="card mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Datos del Plan Seleccionado</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Max Usuarios</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{selectedPlan.maxUsuarios}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Car className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Max Vehiculos</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{selectedPlan.maxVehiculos}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Duracion</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{duracion ?? selectedPlan.duracion} dias</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Precio Mensual</span>
              </div>
              <p className="text-lg font-bold text-gray-900">${formatCurrency(selectedPlan.precioMensual)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Features</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{selectedPlan.features?.length ?? 0}</p>
            </div>
          </div>

          {/* Features list */}
          {selectedPlan.features && selectedPlan.features.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Caracteristicas incluidas</p>
              <div className="flex flex-wrap gap-2">
                {selectedPlan.features.map((f) => (
                  <span key={f.id} className="inline-block bg-primary-50 text-primary-700 text-xs px-3 py-1 rounded-full font-medium">{f.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Cost and Duration Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Costo a Pagar</label>
              {importeLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                  <span className="text-gray-400">Calculando...</span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-primary-700">${formatCurrency(importe)}</p>
              )}
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duracion de la Suscripcion</label>
              <p className="text-2xl font-bold text-gray-900">{duracion ?? selectedPlan.duracion} dias</p>
              {facturacionAnual && (
                <p className="text-xs text-green-600 mt-1">Facturacion anual (360 dias)</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
