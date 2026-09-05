import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CreditCard, Car, Users, Clock, Calendar, Tag, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { subscriptionsApi, plansApi } from '@/api/endpoints';
import PageHeader from '@/components/common/PageHeader';
import { formatDate, formatCurrency, formatNumber } from '@/utils/format';
import { useSubscriptionStatusInfo } from '@/utils/statusLabels';
import type { SubscriptionResponse, PlanResponse } from '@/types';

export default function ComprarPlanesPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { empresa } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const getStatusInfo = useSubscriptionStatusInfo();

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

  const statusInfo = subscription ? getStatusInfo(subscription.status) : null;

  return (
    <div>
      <PageHeader title={t('admin:comprarPlanes.title')} description={t('admin:comprarPlanes.description')}>
        <button onClick={() => navigate(-1)} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> {t('admin:comprarPlanes.back')}
        </button>
      </PageHeader>

      {/* Current Subscription */}
      <div className="card mb-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{t('admin:comprarPlanes.currentSubscription')}</h3>
        {subLoading ? (
          <div className="flex items-center gap-2 py-4 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" /> {t('admin:comprarPlanes.loadingSubscription')}
          </div>
        ) : subscription ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-primary-50/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-primary-600" />
                <span className="text-xs text-gray-500">{t('admin:comprarPlanes.labels.plan')}</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{subscription.plan.nombre}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{t('admin:comprarPlanes.labels.users')}</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{subscription.currentUserCount} / {subscription.plan.maxUsuarios}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Car className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{t('admin:comprarPlanes.labels.vehicles')}</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{subscription.currentVehicleCount} / {subscription.plan.maxVehiculos}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{t('admin:comprarPlanes.labels.expiration')}</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{formatDate(subscription.endDate, 'long')}</p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-sm text-yellow-800">{t('admin:comprarPlanes.noSubscription', { company: empresa?.nombre ?? '' })}</p>
          </div>
        )}
      </div>

      {/* Plan Selection */}
      <div className="card mb-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{t('admin:comprarPlanes.selectPlan')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="plan-select" className="block text-sm font-medium text-gray-700 mb-1.5">{t('admin:comprarPlanes.plan')} <span className="text-red-500">*</span></label>
            {plansLoading ? (
              <div className="flex items-center gap-2 py-2.5 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" /> {t('admin:comprarPlanes.loadingPlans')}
              </div>
            ) : (
              <select
                id="plan-select"
                value={selectedPlanId ?? ''}
                onChange={(e) => setSelectedPlanId(e.target.value ? Number(e.target.value) : undefined)}
                className="input-field"
              >
                <option value="">{t('admin:comprarPlanes.selectPlaceholder')}</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre} - {formatCurrency(p.precioMensual)}/mes</option>
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
              {t('admin:comprarPlanes.annualBilling')}
              {selectedPlan && selectedPlan.porcientoDescuentoAnual != null && selectedPlan.porcientoDescuentoAnual > 0 && (
                <span className="ml-2 text-xs text-green-600 font-semibold">{t('admin:comprarPlanes.annualDiscount', { percent: selectedPlan.porcientoDescuentoAnual })}</span>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Selected Plan Details */}
      {selectedPlan && (
        <div className="card mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{t('admin:comprarPlanes.selectedPlanDetails')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{t('admin:comprarPlanes.maxUsers')}</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{selectedPlan.maxUsuarios}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Car className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{t('admin:comprarPlanes.maxVehicles')}</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{selectedPlan.maxVehiculos}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{t('admin:comprarPlanes.duration')}</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatNumber(duracion ?? selectedPlan.duracion)} {t('admin:comprarPlanes.days')}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{t('admin:comprarPlanes.monthlyPrice')}</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedPlan.precioMensual)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{t('admin:comprarPlanes.features')}</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{selectedPlan.features?.length ?? 0}</p>
            </div>
          </div>

          {/* Features list */}
          {selectedPlan.features && selectedPlan.features.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('admin:comprarPlanes.includedFeatures')}</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('admin:comprarPlanes.costToPay')}</label>
              {importeLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                  <span className="text-gray-400">{t('admin:comprarPlanes.calculating')}</span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-primary-700">{formatCurrency(importe)}</p>
              )}
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('admin:comprarPlanes.subscriptionDuration')}</label>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(duracion ?? selectedPlan.duracion)} {t('admin:comprarPlanes.days')}</p>
              {facturacionAnual && (
                <p className="text-xs text-green-600 mt-1">{t('admin:comprarPlanes.annualBillingNote')}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200 mt-4">
            <button
              type="button"
              className="btn-primary flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" /> {t('admin:comprarPlanes.buy')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
