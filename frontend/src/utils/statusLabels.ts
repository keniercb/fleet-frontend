import { useTranslation } from 'react-i18next';
import type { SubscriptionStatus } from '@/types';

export type SubscriptionStatusInfo = {
  label: string;
  badgeClass: string;
};

const subscriptionStatusMap: Record<SubscriptionStatus, { key: string; badgeClass: string }> = {
  TRIAL: { key: 'admin:subscription.status.TRIAL', badgeClass: 'bg-blue-100 text-blue-800' },
  ACTIVE: { key: 'admin:subscription.status.ACTIVE', badgeClass: 'bg-green-100 text-green-800' },
  PAST_DUE: { key: 'admin:subscription.status.PAST_DUE', badgeClass: 'bg-yellow-100 text-yellow-800' },
  CANCELED: { key: 'admin:subscription.status.CANCELED', badgeClass: 'bg-red-100 text-red-800' },
  EXPIRED: { key: 'admin:subscription.status.EXPIRED', badgeClass: 'bg-gray-100 text-gray-800' },
};

/**
 * Hook que devuelve una función para obtener la info (label + clase) de un estado de suscripción.
 * Usa el namespace 'admin' de i18next.
 */
export function useSubscriptionStatusInfo() {
  const { t } = useTranslation('admin');
  return (status: SubscriptionStatus): SubscriptionStatusInfo => {
    const entry = subscriptionStatusMap[status];
    if (!entry) {
      return { label: status, badgeClass: 'bg-gray-100 text-gray-800' };
    }
    return { label: t(entry.key), badgeClass: entry.badgeClass };
  };
}

/**
 * Información estática (sin traducción) de estados de mantenimiento.
 * Los valores VENCIDO / PROXIMO / VIGENTE son devueltos por el backend.
 */
export type MantenimientoStatus = 'VENCIDO' | 'PROXIMO' | 'VIGENTE' | string;

export type MantenimientoStatusInfo = {
  label: string;
  bg: string;
  text: string;
  iconClass: string;
};

const mantenimientoStatusMap: Record<string, { key: string; bg: string; text: string; iconClass: string }> = {
  VENCIDO: { key: 'reportes:mantenimiento.status.VENCIDO', bg: 'bg-red-100', text: 'text-red-700', iconClass: 'AlertTriangle' },
  PROXIMO: { key: 'reportes:mantenimiento.status.PROXIMO', bg: 'bg-amber-100', text: 'text-amber-700', iconClass: 'Clock' },
  VIGENTE: { key: 'reportes:mantenimiento.status.VIGENTE', bg: 'bg-green-100', text: 'text-green-700', iconClass: 'CheckCircle' },
};

export function useMantenimientoStatusInfo() {
  const { t } = useTranslation('reportes');
  return (estado: MantenimientoStatus): MantenimientoStatusInfo => {
    const entry = mantenimientoStatusMap[estado ?? ''];
    if (!entry) {
      return {
        label: estado ?? '—',
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        iconClass: 'Clock',
      };
    }
    return {
      label: t(entry.key),
      bg: entry.bg,
      text: entry.text,
      iconClass: entry.iconClass,
    };
  };
}
