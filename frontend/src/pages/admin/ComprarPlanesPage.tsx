import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CreditCard, Car, Users, Clock, Calendar, Tag, CheckCircle2, Loader2, QrCode, Copy, RotateCw, XCircle, RefreshCw, CheckCircle, AlertTriangle, Clock3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { subscriptionsApi, plansApi, paymentsApi } from '@/api/endpoints';
import PageHeader from '@/components/common/PageHeader';
import Modal from '@/components/ui/Modal';
import { formatDate, formatCurrency, formatNumber } from '@/utils/format';
import { useSubscriptionStatusInfo } from '@/utils/statusLabels';
import type { SubscriptionResponse, PlanResponse, PaymentResponse, PaymentType, PaymentStatus } from '@/types';

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

  // Payment (Enzona QR) state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // ---- Payment helpers ----

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const getPaymentStatusInfo = useCallback((status: PaymentStatus) => {
    const map: Record<PaymentStatus, { color: string; icon: typeof CheckCircle }> = {
      PENDIENTE: { color: 'text-amber-600', icon: Clock3 },
      QR_GENERADO: { color: 'text-blue-600', icon: QrCode },
      PAGADO: { color: 'text-emerald-600', icon: CheckCircle },
      FALLIDO: { color: 'text-red-600', icon: AlertTriangle },
      EXPIRADO: { color: 'text-gray-500', icon: Clock3 },
      CANCELADO: { color: 'text-red-600', icon: XCircle },
    };
    return map[status] || { color: 'text-gray-500', icon: Clock3 };
  }, []);

  const startPolling = useCallback((paymentId: number) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await paymentsApi.getStatus(paymentId);
        const updated = res.data;
        setPayment(updated);
        if (updated.status === 'PAGADO') {
          stopPolling();
          addToast({ type: 'success', title: t('common:state.success'), message: t('admin:payment.toast.paid') });
          // Refresh subscription to reflect new plan
          subscriptionsApi.getMyCompanySubscription()
            .then((r) => { if (r.data) setSubscription(r.data); })
            .catch(() => {});
        } else if (updated.status === 'EXPIRADO' || updated.status === 'FALLIDO' || updated.status === 'CANCELADO') {
          stopPolling();
          if (updated.status === 'EXPIRADO') {
            addToast({ type: 'warning', title: t('common:state.warning'), message: t('admin:payment.toast.expired') });
          } else if (updated.status === 'FALLIDO') {
            addToast({ type: 'error', title: t('common:state.error'), message: t('admin:payment.toast.failed') });
          }
        }
      } catch {
        // silent — keep polling
      }
    }, 5000);
  }, [stopPolling, addToast, t]);

  const handleBuy = useCallback(async () => {
    if (!selectedPlanId) return;
    setCreatingPayment(true);
    try {
      const paymentType: PaymentType = subscription ? 'RENOVACION' : 'NUEVA_SUSCRIPCION';
      const payload = {
        planId: selectedPlanId,
        type: paymentType,
        subscriptionId: subscription?.id,
      };
      const res = await paymentsApi.create(payload);
      setPayment(res.data);
      setPaymentModalOpen(true);
      addToast({ type: 'success', title: t('common:state.success'), message: t('admin:payment.toast.paymentCreated') });
      // Start polling for status updates
      startPolling(res.data.id);
    } catch {
      addToast({ type: 'error', title: t('common:state.error'), message: t('admin:payment.toast.createError') });
    } finally {
      setCreatingPayment(false);
    }
  }, [selectedPlanId, subscription, addToast, t, startPolling]);

  const handleCheckStatus = useCallback(async () => {
    if (!payment) return;
    setActionLoading(true);
    try {
      const res = await paymentsApi.getStatus(payment.id);
      setPayment(res.data);
      if (res.data.status === 'PAGADO') {
        stopPolling();
        addToast({ type: 'success', title: t('common:state.success'), message: t('admin:payment.toast.paid') });
        subscriptionsApi.getMyCompanySubscription()
          .then((r) => { if (r.data) setSubscription(r.data); })
          .catch(() => {});
      } else {
        addToast({ type: 'info', title: t('common:state.info'), message: t('admin:payment.toast.statusUpdated') });
      }
    } catch {
      addToast({ type: 'error', title: t('common:state.error'), message: t('admin:payment.toast.statusError') });
    } finally {
      setActionLoading(false);
    }
  }, [payment, addToast, t, stopPolling]);

  const handleRetryPayment = useCallback(async () => {
    if (!payment) return;
    setActionLoading(true);
    try {
      const res = await paymentsApi.retry(payment.id);
      setPayment(res.data);
      addToast({ type: 'success', title: t('common:state.success'), message: t('admin:payment.toast.retried') });
      startPolling(res.data.id);
    } catch {
      addToast({ type: 'error', title: t('common:state.error'), message: t('admin:payment.toast.retryError') });
    } finally {
      setActionLoading(false);
    }
  }, [payment, addToast, t, startPolling]);

  const handleCancelPayment = useCallback(async () => {
    if (!payment) return;
    setActionLoading(true);
    try {
      const res = await paymentsApi.cancel(payment.id);
      setPayment(res.data);
      stopPolling();
      addToast({ type: 'info', title: t('common:state.info'), message: t('admin:payment.toast.cancelled') });
    } catch {
      addToast({ type: 'error', title: t('common:state.error'), message: t('admin:payment.toast.cancelError') });
    } finally {
      setActionLoading(false);
    }
  }, [payment, addToast, t, stopPolling]);

  const handleClosePaymentModal = useCallback(() => {
    stopPolling();
    setPaymentModalOpen(false);
    setPayment(null);
  }, [stopPolling]);

  const handleCopyQr = useCallback(async () => {
    if (!payment?.qrCode) return;
    try {
      await navigator.clipboard.writeText(payment.qrCode);
      addToast({ type: 'info', title: t('admin:payment.modal.copyQr'), message: t('admin:payment.toast.copied') });
    } catch {
      // Fallback: usar execCommand si clipboard API no esta disponible
      try {
        const textarea = document.createElement('textarea');
        textarea.value = payment.qrCode;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        addToast({ type: 'info', title: t('admin:payment.modal.copyQr'), message: t('admin:payment.toast.copied') });
      } catch {
        addToast({ type: 'error', title: t('common:state.error'), message: t('admin:payment.toast.copyError') });
      }
    }
  }, [payment, addToast, t]);

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
              <p className="text-sm font-bold text-gray-900">{subscription?.plan?.nombre ?? '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{t('admin:comprarPlanes.labels.users')}</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{subscription?.currentUserCount ?? 0} / {subscription?.plan?.maxUsuarios ?? '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Car className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{t('admin:comprarPlanes.labels.vehicles')}</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{subscription?.currentVehicleCount ?? 0} / {subscription?.plan?.maxVehiculos ?? '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{t('admin:comprarPlanes.labels.expiration')}</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{formatDate(subscription?.endDate, 'long')}</p>
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
              onClick={handleBuy}
              disabled={creatingPayment || !selectedPlanId}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {creatingPayment ? t('admin:payment.toast.creatingPayment') : t('admin:comprarPlanes.buy')}
            </button>
          </div>
        </div>
      )}

      {/* Payment QR Modal (Enzona) */}
      <Modal
        open={paymentModalOpen}
        title={t('admin:payment.modal.title')}
        onClose={handleClosePaymentModal}
        size="md"
      >
        {payment && (
          <div className="space-y-4">
            {/* Subtitle / instructions */}
            <p className="text-sm text-gray-500 text-center">
              {t('admin:payment.modal.subtitle')}
            </p>

            {/* QR Image */}
            <div className="flex flex-col items-center">
              {payment.qrImageBase64 ? (
                <img
                  src={payment.qrImageBase64.startsWith('data:')
                    ? payment.qrImageBase64
                    : `data:image/png;base64,${payment.qrImageBase64}`}
                  alt="QR Enzona"
                  className="w-64 h-64 border-2 border-gray-200 rounded-lg"
                />
              ) : payment.qrCode ? (
                <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-4 text-center">
                  <QrCode className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500 font-mono break-all">{payment.qrCode}</p>
                </div>
              ) : (
                <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-2" />
                  <p className="text-xs text-gray-400">{t('admin:payment.toast.creatingPayment')}</p>
                </div>
              )}
            </div>

            {/* Status badge */}
            <div className="flex justify-center">
              {(() => {
                const info = getPaymentStatusInfo(payment.status);
                const Icon = info.icon;
                return (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${info.color} bg-gray-50`}>
                    <Icon className="w-4 h-4" />
                    {t(`admin:payment.status.${payment.status}` as const)}
                  </span>
                );
              })()}
            </div>

            {/* Payment details */}
            <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
              <div>
                <p className="text-xs text-gray-500">{t('admin:payment.modal.amountLabel')}</p>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(payment.amount, payment.currency)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('admin:payment.modal.planLabel')}</p>
                <p className="text-sm font-semibold text-gray-900">{payment?.plan?.nombre ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('admin:payment.modal.transactionIdLabel')}</p>
                <p className="text-sm font-mono text-gray-700 truncate">{payment.externalTransactionId || payment.id}</p>
              </div>
              {payment.expiresAt && (
                <div>
                  <p className="text-xs text-gray-500">{t('admin:payment.modal.expiresAtLabel')}</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(payment.expiresAt, 'long')}</p>
                </div>
              )}
            </div>

            {/* Error message if any */}
            {payment.errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{payment.errorMessage}</p>
              </div>
            )}

            {/* Copy QR button */}
            {payment.qrCode && (
              <button
                type="button"
                onClick={handleCopyQr}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                {t('admin:payment.modal.copyQr')}
              </button>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
              {/* Primary action depends on status */}
              {payment.status === 'QR_GENERADO' || payment.status === 'PENDIENTE' ? (
                <button
                  type="button"
                  onClick={handleCheckStatus}
                  disabled={actionLoading}
                  className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {t('admin:payment.modal.checkStatus')}
                </button>
              ) : null}

              {payment.status === 'FALLIDO' || payment.status === 'EXPIRADO' ? (
                <button
                  type="button"
                  onClick={handleRetryPayment}
                  disabled={actionLoading}
                  className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                  {t('admin:payment.modal.retryPayment')}
                </button>
              ) : null}

              {payment.status !== 'PAGADO' && payment.status !== 'CANCELADO' && (
                <button
                  type="button"
                  onClick={handleCancelPayment}
                  disabled={actionLoading}
                  className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  {t('admin:payment.modal.cancelPayment')}
                </button>
              )}

              {payment.status === 'PAGADO' && (
                <button
                  type="button"
                  onClick={handleClosePaymentModal}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t('admin:payment.modal.closeModal')}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
