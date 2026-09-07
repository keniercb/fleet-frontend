import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { reportesMantenimientoApi } from '@/api/endpoints';
import { useToast } from '@/contexts/ToastContext';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import { formatDate, formatNumber } from '@/utils/format';
import { useMantenimientoStatusInfo } from '@/utils/statusLabels';
import type { MantenimientoReporteResponse } from '@/types';
import { isToastAlreadyShown } from '@/api/toastBridge';

export default function ReporteMantenimientoPage() {
  const { t } = useTranslation(['reportes', 'common']);
  const { addToast } = useToast();
  const getMantenimientoStatus = useMantenimientoStatusInfo();

  const [data, setData] = useState<MantenimientoReporteResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(20);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await reportesMantenimientoApi.findAll({ page: p, perPage: size });
      setData(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } catch (err) {
      if (!isToastAlreadyShown(err)) {
      addToast({ type: 'error', title: t('common:state.error'), message: t('reportes:mantenimiento.toast.loadError') });
      }
    } finally {
      setLoading(false);
    }
  }, [size, addToast, t]);

  useEffect(() => {
    fetchData(0);
  }, []);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchData(p);
  };

  const formatDateStr = (dateStr: string) => formatDate(dateStr, 'short');

  const getEstadoBadge = (estado: string) => {
    const info = getMantenimientoStatus(estado);
    let Icon: typeof CheckCircle = Clock;
    if (info.iconClass === 'AlertTriangle') Icon = AlertTriangle;
    else if (info.iconClass === 'CheckCircle') Icon = CheckCircle;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${info.bg} ${info.text}`}>
        <Icon className="w-3 h-3" />
        {info.label}
      </span>
    );
  };

  return (
    <div>
      <PageHeader title={t('reportes:mantenimiento.title')} description={t('reportes:mantenimiento.description')}>
        <div className="text-sm text-gray-500">
          {!loading && (
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
              {t('reportes:mantenimiento.countLabel', { count: totalElements })}
            </span>
          )}
        </div>
      </PageHeader>

      {/* Tabla */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">{t('reportes:mantenimiento.loading')}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Wrench className="w-10 h-10 mb-3" />
            <p className="text-sm">{t('reportes:mantenimiento.noData')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="table-header px-4 py-3 text-left">{t('reportes:mantenimiento.table.licensePlate')}</th>
                    <th className="table-header px-4 py-3 text-left">{t('reportes:mantenimiento.table.model')}</th>
                    <th className="table-header px-4 py-3 text-left">{t('reportes:mantenimiento.table.brand')}</th>
                    <th className="table-header px-4 py-3 text-left">{t('reportes:mantenimiento.table.type')}</th>
                    <th className="table-header px-4 py-3 text-left">{t('reportes:mantenimiento.table.company')}</th>
                    <th className="table-header px-4 py-3 text-center">{t('reportes:mantenimiento.table.state')}</th>
                    <th className="table-header px-4 py-3 text-right">{t('reportes:mantenimiento.table.currentOdometer')}</th>
                    <th className="table-header px-4 py-3 text-right">{t('reportes:mantenimiento.table.lastMaintenance')}</th>
                    <th className="table-header px-4 py-3 text-center">{t('reportes:mantenimiento.table.lastMaintenanceDate')}</th>
                    <th className="table-header px-4 py-3 text-right">{t('reportes:mantenimiento.table.kmSinceMaintenance')}</th>
                    <th className="table-header px-4 py-3 text-right">{t('reportes:mantenimiento.table.kmThreshold')}</th>
                    <th className="table-header px-4 py-3 text-right">{t('reportes:mantenimiento.table.elapsedDays')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, idx) => {
                    const kmPercent = item.umbralKm > 0 ? (item.kmDesdeMantenimiento / item.umbralKm) * 100 : 0;
                    const barColor = kmPercent >= 100
                      ? 'bg-red-500'
                      : kmPercent >= 75
                        ? 'bg-amber-500'
                        : 'bg-green-500';

                    return (
                      <tr key={item.vehiculoResumido.id ?? idx} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.vehiculoResumido.matricula}</td>
                        <td className="px-4 py-3 text-gray-600">{item.vehiculoResumido.modelo || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{item.vehiculoResumido.marcaNombre || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{item.vehiculoResumido.tipoVehiculoNombre || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{item.empresaResumida.nombre || '—'}</td>
                        <td className="px-4 py-3 text-center">{getEstadoBadge(item.estado)}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatNumber(item.odometroActual)} km</td>
                        <td className="px-4 py-3 text-right">{formatNumber(item.odometroUltimoMantenimiento)} km</td>
                        <td className="px-4 py-3 text-center">{formatDateStr(item.fechaUltimoMantenimiento)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-right font-medium">{formatNumber(item.kmDesdeMantenimiento)} km</span>
                            {item.umbralKm > 0 && (
                              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${barColor} transition-all`}
                                  style={{ width: `${Math.min(kmPercent, 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">{formatNumber(item.umbralKm)} km</td>
                        <td className="px-4 py-3 text-right">{formatNumber(item.diasTranscurridos)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
