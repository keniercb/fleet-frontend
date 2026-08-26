import { useState, useEffect } from 'react';
import { X, User, Building2, CreditCard, Calendar, Car, Users, Clock, Activity } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionsApi } from '@/api/endpoints';
import type { SubscriptionResponse } from '@/types';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  TRIAL: { label: 'Prueba', color: 'bg-blue-100 text-blue-800' },
  ACTIVE: { label: 'Activa', color: 'bg-green-100 text-green-800' },
  PAST_DUE: { label: 'Vencida', color: 'bg-yellow-100 text-yellow-800' },
  CANCELED: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
  EXPIRED: { label: 'Expirada', color: 'bg-gray-100 text-gray-800' },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user, empresa } = useAuth();
  const navigate = useNavigate();
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
      .catch(() => setError('No se pudo cargar la información de suscripción.'))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const statusInfo = subscription ? statusLabels[subscription.status] || { label: subscription.status, color: 'bg-gray-100 text-gray-800' } : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Mi Perfil</h2>
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
              Datos de Usuario
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
                  <p className="text-xs text-gray-500">Email</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-primary-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {empresa?.nombre || 'Sin empresa'}
                  </p>
                  <p className="text-xs text-gray-500">Empresa</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Info Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Suscripción Activa
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-2" />
                <span className="text-sm text-gray-400">Cargando...</span>
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
                    <p className="text-xs text-gray-500">Plan</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Max Usuarios */}
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Limite de Usuarios</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {subscription.plan.maxUsuarios}
                    </p>
                  </div>

                  {/* Max Vehiculos */}
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Car className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Limite de Vehículos</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {subscription.plan.maxVehiculos}
                    </p>
                  </div>

                  {/* Duracion */}
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Vigencia</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {subscription.plan.duracion} días
                    </p>
                  </div>

                  {/* Estado */}
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Estado</span>
                    </div>
                    {statusInfo && (
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    )}
                  </div>

                  {/* Current User Count */}
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Cant. Usuarios</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {subscription.currentUserCount}
                    </p>
                  </div>

                  {/* Current Vehicle Count */}
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Car className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Cant. Vehículos</span>
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
                        {formatDate(subscription.startDate)}
                      </p>
                      <p className="text-xs text-gray-500">Fecha de inicio</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDate(subscription.endDate)}
                      </p>
                      <p className="text-xs text-gray-500">Fecha de fin</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500">No hay suscripción activa para su empresa.</p>
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
              Actualizar plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
