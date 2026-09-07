import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, Fuel, RotateCcw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { reportesConsumoCombustibleApi, tiposVehiculoApi } from '@/api/endpoints';
import { useToast } from '@/contexts/ToastContext';
import PageHeader from '@/components/common/PageHeader';
import { formatNumber as fmtHelper, formatCurrency as fmtCurHelper } from '@/utils/format';
import type { ConsumoCombustibleResponse, DetalleTipoCombustible } from '@/types';
import { isToastAlreadyShown } from '@/api/toastBridge';

export default function ReporteConsumoCombustiblePage() {
  const { t } = useTranslation(['reportes', 'common']);
  const { addToast } = useToast();

  const today = new Date().toISOString().slice(0, 10);
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [fechaDesde, setFechaDesde] = useState(firstDayOfMonth);
  const [fechaHasta, setFechaHasta] = useState(today);
  const [tipoVehiculoId, setTipoVehiculoId] = useState(0);

  const [data, setData] = useState<ConsumoCombustibleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [tiposVehiculo, setTiposVehiculo] = useState<{ id: number; nombre: string }[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await tiposVehiculoApi.findAll({ page: 0, perPage: 200 });
        setTiposVehiculo(res.data.content.filter((e) => e.activo).map((e) => ({ id: e.id, nombre: e.nombre })));
      } catch { /* silent */ }
    };
    fetch();
  }, []);

  const handleBuscar = useCallback(async () => {
    if (!fechaDesde || !fechaHasta) {
      addToast({ type: 'error', title: t('common:state.error'), message: t('reportes:abastecimiento.toast.datesRequired') });
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await reportesConsumoCombustibleApi.findAll({
        fechaDesde,
        fechaHasta,
        tipoVehiculoId: tipoVehiculoId || undefined,
      });
      setData(res.data);
    } catch (err) {
      if (!isToastAlreadyShown(err)) {
      addToast({ type: 'error', title: t('common:state.error'), message: t('reportes:abastecimiento.toast.reportError') });
      setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [fechaDesde, fechaHasta, tipoVehiculoId, addToast, t]);

  const handleLimpiar = () => {
    setFechaDesde(firstDayOfMonth);
    setFechaHasta(today);
    setTipoVehiculoId(0);
    setData(null);
    setSearched(false);
  };

  const fmt = (n: number | null | undefined, decimals = 2) => fmtHelper(n, decimals);

  const getVariacionIcon = (val: number | null | undefined) => {
    if (val == null || val === 0) return <Minus className="w-3.5 h-3.5 text-gray-400" />;
    if (val > 0) return <TrendingUp className="w-3.5 h-3.5 text-red-500" />;
    return <TrendingDown className="w-3.5 h-3.5 text-green-500" />;
  };

  const getVariacionColor = (val: number | null | undefined) => {
    if (val == null || val === 0) return 'text-gray-500';
    if (val > 0) return 'text-red-600';
    return 'text-green-600';
  };

  const r = data?.resumenEjecutivo;

  return (
    <div>
      <PageHeader title={t('reportes:consumoCombustible.title')} description={t('reportes:consumoCombustible.description')} />

      {/* Filtros */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Fuel className="w-5 h-5 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('common:actions.search')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('reportes:consumoCombustible.filters.fromDate')}</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="input-field py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('reportes:consumoCombustible.filters.toDate')}</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="input-field py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('reportes:consumoCombustible.filters.vehicleType')}</label>
            <select value={tipoVehiculoId} onChange={(e) => setTipoVehiculoId(Number(e.target.value))} className="input-field appearance-none pr-8 py-2 text-sm">
              <option value={0}>{t('reportes:consumoCombustible.filters.all')}</option>
              {tiposVehiculo.map((tv) => (
                <option key={tv.id} value={tv.id}>{tv.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
          <button onClick={handleBuscar} disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {t('common:actions.search')}
          </button>
          <button onClick={handleLimpiar} className="btn-secondary flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            {t('common:actions.clear')}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm">{t('reportes:consumoCombustible.loading')}</p>
        </div>
      )}

      {searched && !loading && data && (
        <>
          {/* Resumen Ejecutivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card border-l-4 border-l-blue-500">
              <p className="text-xs font-medium text-gray-500 uppercase">{t('reportes:consumoCombustible.summary.period')}</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{r?.periodo || '—'}</p>
            </div>
            <div className="card border-l-4 border-l-green-500">
              <p className="text-xs font-medium text-gray-500 uppercase">{t('reportes:consumoCombustible.summary.totalTrips')}</p>
              <p className="text-lg font-bold text-green-800 mt-1">{fmt(r?.totalRecorridos, 0)}</p>
            </div>
            <div className="card border-l-4 border-l-amber-500">
              <p className="text-xs font-medium text-gray-500 uppercase">{t('reportes:consumoCombustible.summary.suppliedVolume')}</p>
              <p className="text-lg font-bold text-amber-800 mt-1">{fmt(r?.volumenAbastecidoTotal)} L</p>
            </div>
            <div className="card border-l-4 border-l-red-500">
              <p className="text-xs font-medium text-gray-500 uppercase">{t('reportes:consumoCombustible.summary.totalEstimatedCost')}</p>
              <p className="text-lg font-bold text-red-800 mt-1">{fmtCurHelper(r?.costoEstimadoTotal)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="card bg-gray-50">
              <p className="text-xs font-medium text-gray-500 uppercase">{t('reportes:consumoCombustible.summary.consumedVolume')}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{fmt(r?.volumenConsumidoTotal)} L</p>
            </div>
            <div className="card bg-gray-50">
              <p className="text-xs font-medium text-gray-500 uppercase">{t('reportes:consumoCombustible.summary.fuelTypes')}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{r?.totalTiposCombustible ?? '—'}</p>
            </div>
            <div className="card bg-gray-50">
              <p className="text-xs font-medium text-gray-500 uppercase">{t('reportes:consumoCombustible.summary.avgCostPerLiter')}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{fmtCurHelper(r?.costoPromedioPorLitro)}</p>
            </div>
          </div>

          {/* Tabla Detalle */}
          <div className="card !p-0 overflow-hidden">
            {data.detalle.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Fuel className="w-10 h-10 mb-3" />
                <p className="text-sm">{t('reportes:consumoCombustible.noData')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="table-header px-4 py-3 text-left">{t('reportes:consumoCombustible.table.fuelType')}</th>
                      <th className="table-header px-4 py-3 text-right">{t('reportes:consumoCombustible.table.consumedVolume')}</th>
                      <th className="table-header px-4 py-3 text-right">{t('reportes:consumoCombustible.table.suppliedVolume')}</th>
                      <th className="table-header px-4 py-3 text-right">{t('reportes:consumoCombustible.table.estimatedCost')}</th>
                      <th className="table-header px-4 py-3 text-right">{t('reportes:consumoCombustible.table.pctTotal')}</th>
                      <th className="table-header px-4 py-3 text-right">{t('reportes:consumoCombustible.table.variationVsPrevious')}</th>
                      <th className="table-header px-4 py-3 text-right">{t('reportes:consumoCombustible.table.trips')}</th>
                      <th className="table-header px-4 py-3 text-right">{t('reportes:consumoCombustible.table.avgCostPerLiter')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.detalle.map((d: DetalleTipoCombustible, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                        <td className="px-4 py-3 font-medium text-gray-900">{d.tipoCombustible || '—'}</td>
                        <td className="px-4 py-3 text-right">{fmt(d.volumenConsumido)} L</td>
                        <td className="px-4 py-3 text-right">{fmt(d.volumenAbastecido)} L</td>
                        <td className="px-4 py-3 text-right font-medium">{fmtCurHelper(d.costoEstimado)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${Math.min(d.porcentajeDelTotal ?? 0, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium w-12 text-right">{fmt(d.porcentajeDelTotal, 1)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center gap-1 font-medium ${getVariacionColor(d.variacionVsPeriodoAnterior)}`}>
                            {getVariacionIcon(d.variacionVsPeriodoAnterior)}
                            {d.variacionVsPeriodoAnterior != null ? `${d.variacionVsPeriodoAnterior > 0 ? '+' : ''}${fmt(d.variacionVsPeriodoAnterior, 1)}%` : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">{fmt(d.cantidadRecorridos, 0)}</td>
                        <td className="px-4 py-3 text-right">{fmtCurHelper(d.costoPromedioPorLitro)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {searched && !loading && !data && (
        <div className="card flex flex-col items-center justify-center py-20 text-gray-400">
          <Fuel className="w-10 h-10 mb-3" />
          <p className="text-sm">{t('reportes:consumoCombustible.noData')}</p>
        </div>
      )}

      {!searched && !loading && (
        <div className="card flex flex-col items-center justify-center py-20 text-gray-400">
          <Fuel className="w-10 h-10 mb-3" />
          <p className="text-sm">{t('reportes:consumoCombustible.placeholder')}</p>
        </div>
      )}
    </div>
  );
}
