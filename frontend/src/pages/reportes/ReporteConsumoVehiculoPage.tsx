import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, FileDown, Loader2, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { reportesTransporteApi, tiposVehiculoApi, marcasApi, tiposCombustibleApi } from '@/api/endpoints';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import { formatNumber as formatNum } from '@/utils/format';
import type { VehiculoConsumoReporteDTO, TipoVehiculoResponse, MarcaResponse, TipoCombustibleResponse } from '@/types';

interface Filtros {
  fechaDesde: string;
  fechaHasta: string;
  tipoVehiculoId: number;
  marcaId: number;
  tipoCombustibleId: number;
}

export default function ReporteConsumoVehiculoPage() {
  const { t } = useTranslation(['reportes', 'common']);
  const { empresaId } = useAuth();
  const { addToast } = useToast();

  const today = new Date().toISOString().slice(0, 10);
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [filtros, setFiltros] = useState<Filtros>({
    fechaDesde: firstDayOfMonth,
    fechaHasta: today,
    tipoVehiculoId: 0,
    marcaId: 0,
    tipoCombustibleId: 0,
  });

  const [data, setData] = useState<VehiculoConsumoReporteDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [searched, setSearched] = useState(false);

  // Dropdowns
  const [tiposVehiculo, setTiposVehiculo] = useState<TipoVehiculoResponse[]>([]);
  const [marcas, setMarcas] = useState<MarcaResponse[]>([]);
  const [tiposCombustible, setTiposCombustible] = useState<TipoCombustibleResponse[]>([]);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [tvRes, marRes, tcRes] = await Promise.all([
        tiposVehiculoApi.findAll({ page: 0, perPage: 200 }),
        marcasApi.findAll({ page: 0, perPage: 200 }),
        tiposCombustibleApi.findAll({ page: 0, perPage: 200 }),
      ]);
      setTiposVehiculo(tvRes.data.content.filter((e) => e.activo));
      setMarcas(marRes.data.content.filter((e) => e.activo));
      setTiposCombustible(tcRes.data.content.filter((e) => e.activo));
    } catch {
      addToast({ type: 'error', title: t('common:state.error'), message: t('reportes:consumoVehiculo.toast.filtersLoadError') });
    }
  }, [addToast, t]);

  useState(() => {
    fetchDropdowns();
  });

  const handleBuscar = useCallback(async () => {
    if (!filtros.fechaDesde || !filtros.fechaHasta) {
      addToast({ type: 'error', title: t('common:state.error'), message: t('reportes:abastecimiento.toast.datesRequired') });
      return;
    }
    setLoading(true);
    setSearched(true);
    setPage(0);
    try {
      const res = await reportesTransporteApi.consumoVehiculo({
        fechaDesde: filtros.fechaDesde,
        fechaHasta: filtros.fechaHasta,
        tipoVehiculoId: filtros.tipoVehiculoId || undefined,
        marcaId: filtros.marcaId || undefined,
        tipoCombustibleId: filtros.tipoCombustibleId || undefined,
        page: 0,
        size,
      });
      setData(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } catch {
      addToast({ type: 'error', title: t('common:state.error'), message: t('reportes:abastecimiento.toast.reportError') });
      setData([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [filtros, size, addToast, t]);

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    setPage(p);
    try {
      const res = await reportesTransporteApi.consumoVehiculo({
        fechaDesde: filtros.fechaDesde,
        fechaHasta: filtros.fechaHasta,
        tipoVehiculoId: filtros.tipoVehiculoId || undefined,
        marcaId: filtros.marcaId || undefined,
        tipoCombustibleId: filtros.tipoCombustibleId || undefined,
        page: p,
        size,
      });
      setData(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } catch {
      addToast({ type: 'error', title: t('common:state.error'), message: t('reportes:consumoVehiculo.toast.pageChangeError') });
    } finally {
      setLoading(false);
    }
  }, [filtros, size, addToast, t]);

  const handleLimpiar = () => {
    setFiltros({
      fechaDesde: firstDayOfMonth,
      fechaHasta: today,
      tipoVehiculoId: 0,
      marcaId: 0,
      tipoCombustibleId: 0,
    });
    setData([]);
    setSearched(false);
    setTotalPages(0);
    setTotalElements(0);
    setPage(0);
  };

  const formatNumber = (n: number | null | undefined, decimals = 2) => formatNum(n, decimals);

  return (
    <div>
      <PageHeader title={t('reportes:consumoVehiculo.title')} description={t('reportes:consumoVehiculo.description')}>
        <div className="text-sm text-gray-500">
          {searched && !loading && (
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
              {t('reportes:abastecimiento.countLabel', { count: totalElements })}
            </span>
          )}
        </div>
      </PageHeader>

      {/* Panel de Filtros */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <ArrowUpDown className="w-5 h-5 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('common:actions.search')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('reportes:consumoVehiculo.filters.fromDate')}</label>
            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => setFiltros((f) => ({ ...f, fechaDesde: e.target.value }))}
              className="input-field py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('reportes:consumoVehiculo.filters.toDate')}</label>
            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => setFiltros((f) => ({ ...f, fechaHasta: e.target.value }))}
              className="input-field py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('reportes:consumoVehiculo.filters.vehicleType')}</label>
            <select
              value={filtros.tipoVehiculoId}
              onChange={(e) => setFiltros((f) => ({ ...f, tipoVehiculoId: Number(e.target.value) }))}
              className="input-field appearance-none pr-8 py-2 text-sm"
            >
              <option value={0}>{t('reportes:consumoVehiculo.filters.all')}</option>
              {tiposVehiculo.map((tv) => (
                <option key={tv.id} value={tv.id}>{tv.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('reportes:consumoVehiculo.filters.brand')}</label>
            <select
              value={filtros.marcaId}
              onChange={(e) => setFiltros((f) => ({ ...f, marcaId: Number(e.target.value) }))}
              className="input-field appearance-none pr-8 py-2 text-sm"
            >
              <option value={0}>{t('reportes:consumoVehiculo.filters.allF')}</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('reportes:consumoVehiculo.filters.fuelType')}</label>
            <select
              value={filtros.tipoCombustibleId}
              onChange={(e) => setFiltros((f) => ({ ...f, tipoCombustibleId: Number(e.target.value) }))}
              className="input-field appearance-none pr-8 py-2 text-sm"
            >
              <option value={0}>{t('reportes:consumoVehiculo.filters.all')}</option>
              {tiposCombustible.map((tc) => (
                <option key={tc.id} value={tc.id}>{tc.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleBuscar}
            disabled={loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {t('common:actions.search')}
          </button>
          <button onClick={handleLimpiar} className="btn-secondary">
            {t('common:actions.clear')}
          </button>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">{t('reportes:consumoCombustible.loading')}</p>
          </div>
        ) : searched && data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FileDown className="w-10 h-10 mb-3" />
            <p className="text-sm">{t('reportes:consumoCombustible.noData')}</p>
          </div>
        ) : searched ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="table-header px-4 py-3 text-left">{t('reportes:consumoVehiculo.table.licensePlate')}</th>
                    <th className="table-header px-4 py-3 text-left">{t('reportes:consumoVehiculo.table.model')}</th>
                    <th className="table-header px-4 py-3 text-left">{t('reportes:consumoVehiculo.table.brand')}</th>
                    <th className="table-header px-4 py-3 text-left">{t('reportes:consumoVehiculo.table.fuelType')}</th>
                    <th className="table-header px-4 py-3 text-left">{t('reportes:consumoVehiculo.table.company')}</th>
                    <th className="table-header px-4 py-3 text-right">{t('reportes:consumoVehiculo.table.totalKm')}</th>
                    <th className="table-header px-4 py-3 text-right">{t('reportes:consumoVehiculo.table.theoreticalConsumption')}</th>
                    <th className="table-header px-4 py-3 text-right">{t('reportes:consumoVehiculo.table.realConsumption')}</th>
                    <th className="table-header px-4 py-3 text-right">{t('reportes:consumoVehiculo.table.deviationL')}</th>
                    <th className="table-header px-4 py-3 text-right">{t('reportes:consumoVehiculo.table.deviationPct')}</th>
                    <th className="table-header px-4 py-3 text-right">{t('reportes:consumoVehiculo.table.efficiency')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => {
                    const desviacionColor = item.desviacionPorcentaje > 5
                      ? 'text-red-600 bg-red-50'
                      : item.desviacionPorcentaje < -5
                        ? 'text-green-600 bg-green-50'
                        : 'text-gray-700';
                    const eficienciaColor = item.eficiencia >= 90
                      ? 'text-green-700 font-semibold'
                      : item.eficiencia >= 70
                        ? 'text-amber-600'
                        : 'text-red-600 font-semibold';

                    return (
                      <tr key={item.vehiculoId} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.matricula}</td>
                        <td className="px-4 py-3 text-gray-600">{item.modelo || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{item.marcaNombre || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{item.tipoCombustibleCodigo || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{item.empresaNombre || '—'}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatNumber(item.kilometrosTotales, 0)}</td>
                        <td className="px-4 py-3 text-right">{formatNumber(item.consumoTeorico)} L</td>
                        <td className="px-4 py-3 text-right">{formatNumber(item.consumoReal)} L</td>
                        <td className={`px-4 py-3 text-right rounded-sm ${desviacionColor}`}>
                          <span className="inline-flex items-center gap-1">
                            {item.desviacionLitros > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {formatNumber(item.desviacionLitros)} L
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right rounded-sm ${desviacionColor}`}>
                          {formatNumber(item.desviacionPorcentaje)}%
                        </td>
                        <td className={`px-4 py-3 text-right ${eficienciaColor}`}>
                          {formatNumber(item.eficiencia)}%
                        </td>
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
                  onPageChange={fetchPage}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ArrowUpDown className="w-10 h-10 mb-3" />
            <p className="text-sm">{t('reportes:consumoCombustible.placeholder')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
