import { useState, useCallback, useEffect } from 'react';
import { Loader2, Wrench, AlertTriangle, CheckCircle, Clock, ArrowUpDown } from 'lucide-react';
import { reportesMantenimientoApi } from '@/api/endpoints';
import { useToast } from '@/contexts/ToastContext';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import type { MantenimientoReporteResponse } from '@/types';

export default function ReporteMantenimientoPage() {
  const { addToast } = useToast();

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
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No se pudo cargar el reporte de mantenimiento.' });
    } finally {
      setLoading(false);
    }
  }, [size, addToast]);

  useEffect(() => {
    fetchData(0);
  }, []);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchData(p);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatNumber = (n: number | null | undefined) => {
    if (n == null) return '—';
    return n.toLocaleString('es-ES');
  };

  const getEstadoBadge = (estado: string) => {
    const map: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
      VENCIDO: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle },
      PROXIMO: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
      VIGENTE: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    };
    const cfg = map[estado] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock };
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
        <Icon className="w-3 h-3" />
        {estado}
      </span>
    );
  };

  return (
    <div>
      <PageHeader title="Mantenimiento" description="Reporte de mantenimiento de vehiculos">
        <div className="text-sm text-gray-500">
          {!loading && (
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
              {totalElements} vehiculo{totalElements !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </PageHeader>

      {/* Tabla */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">Cargando reporte...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Wrench className="w-10 h-10 mb-3" />
            <p className="text-sm">No hay datos de mantenimiento disponibles.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="table-header px-4 py-3 text-left">Matricula</th>
                    <th className="table-header px-4 py-3 text-left">Modelo</th>
                    <th className="table-header px-4 py-3 text-left">Marca</th>
                    <th className="table-header px-4 py-3 text-left">Tipo</th>
                    <th className="table-header px-4 py-3 text-left">Empresa</th>
                    <th className="table-header px-4 py-3 text-center">Estado</th>
                    <th className="table-header px-4 py-3 text-right">Odometro Actual</th>
                    <th className="table-header px-4 py-3 text-right">Ult. Mant.</th>
                    <th className="table-header px-4 py-3 text-center">Fecha Ult. Mant.</th>
                    <th className="table-header px-4 py-3 text-right">Km Desde Mant.</th>
                    <th className="table-header px-4 py-3 text-right">Umbral Km</th>
                    <th className="table-header px-4 py-3 text-right">Dias Transc.</th>
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
                        <td className="px-4 py-3 text-center">{formatDate(item.fechaUltimoMantenimiento)}</td>
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
