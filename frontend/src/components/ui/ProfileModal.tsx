import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, User, Building2, CreditCard, Calendar, Car, Users, Clock, Activity } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionsApi } from '@/api/endpoints';
import { formatDate } from '@/utils/format';
import { useSubscriptionStatusInfo } from '@/utils/statusLabels';
import type { SubscriptionResponse } from '@/types';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { t } = useTranslation('auth');
  const { user, empresa } = useAuth();
  const navigate = useNavigate();
  const getStatusInfo = useSubscriptionStatusInfo();
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    subscriptionsApi
      .getMyCompanySubscription()
      .then((res) => setSubscription(res.data))
      .catch(() => setError(t('profile.loadError')))
      .finally(() => setLoading(false));
  }, [open, t]);

  if (!open) return null;

  const statusInfo = subscription ? getStatusInfo(subscription.status) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{t('profile.title')}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {/* User Info Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {t('profile.userData')}
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email || '-'}
                  </p>
                  <p className="text-xs text-gray-500">{t('profile.email')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-primary-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {empresa?.nombre || t('profile.noCompany')}
                  </p>
                  <p className="text-xs text-gray-500">{t('profile.company')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Info Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {t('profile.subscriptionActive')}
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-2" />
                <span className="text-sm text-gray-400">{t('profile.loading')}</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : subscription ? (
              <div className="bg-primary-50/50 border border-primary-100 rounded-xl p-4 space-y-3">
                {/* Plan name */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {subscription.plan.nombre}
                    </p>
                    <p className="text-xs text-gray-500">{t('profile.plan')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Max Usuarios */}
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">{t('profile.maxUsers')}</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {subscription.plan.maxUsuarios}
                    </p>
                  </div>

                  {/* Max Vehiculos */}
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Car className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">{t('profile.maxVehicles')}</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {subscription.plan.maxVehiculos}
                    </p>
                  </div>

                  {/* Duracion */}
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">{t('profile.validity')}</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {subscription.plan.duracion} {t('profile.days')}
                    </p>
                  </div>

                  {/* Estado */}
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">{t('profile.state')}</span>
                    </div>
                    {statusInfo && (
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusInfo.badgeClass}`}>
                        {statusInfo.label}
                      </span>
                    )}
                  </div>

                  {/* Current User Count */}
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">{t('profile.userCount')}</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {subscription.currentUserCount}
                    </p>
                  </div>

                  {/* Current Vehicle Count */}
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Car className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">{t('profile.vehicleCount')}</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {subscription.currentVehicleCount}
                    </p>
                  </div>
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDate(subscription.startDate, 'long')}
                      </p>
                      <p className="text-xs text-gray-500">{t('profile.startDate')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDate(subscription.endDate, 'long')}
                      </p>
                      <p className="text-xs text-gray-500">{t('profile.endDate')}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500">{t('profile.noSubscription')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {subscription && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={() => { onClose(); navigate('/comprar-plan'); }}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t('profile.upgradePlan')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
