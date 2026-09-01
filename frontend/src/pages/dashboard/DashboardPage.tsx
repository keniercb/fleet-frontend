import { useState, useEffect, useCallback } from 'react';
import {
  Fuel,
  Gauge,
  MapPin,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  Route,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { reportesTransporteApi } from '@/api/endpoints';
import type { DashboardEjecutivoResponse } from '@/types';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function formatNumber(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null) return '--';
  return value.toLocaleString('es-CU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return '--';
  return new Intl.NumberFormat('es-CU', {
    style: 'currency',
    currency: 'CUP',
    minimumFractionDigits: 2,
  }).format(value);
}

function VariacionBadge({ value }: { value: number }) {
  const isPositive = value > 0;
  const isZero = value === 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
        isZero
          ? 'bg-gray-100 text-gray-600'
          : isPositive
          ? 'bg-red-100 text-red-700'
          : 'bg-emerald-100 text-emerald-700'
      }`}
    >
      {isPositive ? <TrendingUp className="w-3 h-3" /> : isZero ? null : <TrendingDown className="w-3 h-3" />}
      {isPositive ? '+' : ''}{formatNumber(value, 1)}%
    </span>
  );
}

function EfficienciaBadge({ value }: { value: number }) {
  let color = 'bg-emerald-100 text-emerald-700';
  if (value < 80) color = 'bg-red-100 text-red-700';
  else if (value < 95) color = 'bg-amber-100 text-amber-700';
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {formatNumber(value, 1)}%
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const [data, setData] = useState<DashboardEjecutivoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportesTransporteApi.dashboardEjecutivo(mes, anio);
      setData(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar datos del dashboard';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [mes, anio]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const prevMonth = () => {
    if (mes === 1) { setMes(12); setAnio(anio - 1); }
    else setMes(mes - 1);
  };

  const nextMonth = () => {
    if (mes === 12) { setMes(1); setAnio(anio + 1); }
    else setMes(mes + 1);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Ejecutivo</h1>
          <p className="text-gray-500 mt-1">
            Bienvenido, {user?.email || 'Usuario'}
            {user?.roles?.length ? ` \u00b7 ${user.roles.map((r) => r.name).join(', ')}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-md transition-colors" title="Mes anterior">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm font-semibold text-gray-700 min-w-[140px] text-center">
            {MESES[mes - 1]} {anio}
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-md transition-colors" title="Mes siguiente">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <span className="ml-3 text-gray-500">Cargando datos...</span>
        </div>
      )}

      {!loading && error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">Error al cargar el dashboard</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {data.periodo && (
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-sm font-medium px-3 py-1.5 rounded-lg border border-primary-200">
                <Route className="w-4 h-4" />
                Periodo: {data.periodo}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <div className="card">
              <div className="flex items-center gap-4">
                <div className="bg-primary-500 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 truncate">KM Totales Flota</p>
                  <p className="text-2xl font-bold text-gray-900">{data.kmTotalesFlota?.toLocaleString('es-CU') ?? '--'}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-4">
                <div className="bg-amber-500 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Fuel className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 truncate">Costo Total Combustible</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.costoTotalCombustible)}</p>
                  {data.variacionCostoVsMesAnterior !== undefined && data.variacionCostoVsMesAnterior !== null && (
                    <div className="mt-1">
                      <VariacionBadge value={data.variacionCostoVsMesAnterior} />
                      <span className="text-xs text-gray-400 ml-1">vs mes anterior</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Gauge className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 truncate">Consumo Promedio Flota</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(data.consumoPromedioFlota)} <span className="text-sm font-normal text-gray-400">L/100km</span>
                  </p>
                  {data.desviacionConsumoPromedio !== undefined && data.desviacionConsumoPromedio !== null && (
                    <div className="mt-1">
                      <span className="text-xs text-gray-500">Desviacion: {formatNumber(data.desviacionConsumoPromedio)} L</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-4">
                <div className="bg-purple-500 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 truncate">Tasa de Utilizacion</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(data.tasaUtilizacionFlota, 1)}%</p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        data.tasaUtilizacionFlota >= 75 ? 'bg-purple-500' : data.tasaUtilizacionFlota >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(data.tasaUtilizacionFlota, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <div className="card border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Eficiencia Promedio Choferes</p>
                  <div className="mt-1"><EfficienciaBadge value={data.eficienciaPromedioChoferes} /></div>
                </div>
                <div className="bg-emerald-50 p-3 rounded-lg"><Users className="w-6 h-6 text-emerald-600" /></div>
              </div>
            </div>

            <div className={`card border-l-4 ${data.vehiculosAlertaMantenimiento > 0 ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Vehiculos en Alerta de Mantenimiento</p>
                  <p className={`text-2xl font-bold mt-1 ${data.vehiculosAlertaMantenimiento > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {data.vehiculosAlertaMantenimiento ?? 0}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${data.vehiculosAlertaMantenimiento > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                  <AlertTriangle className={`w-6 h-6 ${data.vehiculosAlertaMantenimiento > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
                </div>
              </div>
            </div>

            <div className="card border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Desviacion de Consumo Promedio</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatNumber(data.desviacionConsumoPromedio)} <span className="text-sm font-normal text-gray-400">L</span>
                  </p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg"><Fuel className="w-6 h-6 text-amber-600" /></div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
