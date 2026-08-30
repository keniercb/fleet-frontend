import { useState, useCallback, useEffect } from 'react';
import { Search, Loader2, Fuel, MapPin, RotateCcw } from 'lucide-react';
import { reportesAbastecimientoApi, vehiculosApi } from '@/api/endpoints';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import type { AbastecimientoReporteResponse, VehiculoResponse } from '@/types';

interface Filtros {
  desde: string;
  hasta: string;
  vehiculoId: number;
  lugarAbastecimiento: string;
}

export default function ReporteAbastecimientoPage() {
  const { empresaId } = useAuth();
  const { addToast } = useToast();

  const today = new Date().toISOString().slice(0, 10);
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [filtros, setFiltros] = useState<Filtros>({
    desde: firstDayOfMonth,
    hasta: today,
    vehiculoId: 0,
    lugarAbastecimiento: '',
  });

  const [data, setData] = useState<AbastecimientoReporteResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [searched, setSearched] = useState(false);

  const [vehiculos, setVehiculos] = useState<VehiculoResponse[]>([]);

  useEffect(() => {
    const fetchVehiculos = async () => {
      if (!empresaId) return;
      try {
        const res = await vehiculosApi.findByEmpresaId(empresaId, { page: 0, perPage: 300 });
        setVehiculos(res.data.content.filter((v) => v.activo));
      } catch {
        /* silent */
      }
    };
    fetchVehiculos();
  }, [empresaId]);

  const doFetch = useCallback(async (p: number) => {
    if (!filtros.desde || !filtros.hasta) {
      addToast({ type: 'error', title: 'Error', message: 'Las fechas desde y hasta son obligatorias.' });
      return;
    }
    setLoading(true);
    try {
      const res = await reportesAbastecimientoApi.findAll({
        desde: filtros.desde,
        hasta: filtros.hasta,
        vehiculoId: filtros.vehiculoId || undefined,
        lugarAbastecimiento: filtros.lugarAbastecimiento || undefined,
        page: p,
        size,
      });
      setData(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No se pudo generar el reporte.' });
      setData([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [filtros, size, addToast]);

  const handleBuscar = () => {
    setPage(0);
    setSearched(true);
    doFetch(0);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    doFetch(p);
  };

  const handleLimpiar = () => {
    setFiltros({
      desde: firstDayOfMonth,
      hasta: today,
      vehiculoId: 0,
      lugarAbastecimiento: '',
    });
    setData([]);
    setSearched(false);
    setTotalPages(0);
    setTotalElements(0);
    setPage(0);
  };

  const formatNumber = (n: number | null | undefined, decimals = 2) => {
    if (n == null) return '—';
    return n.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  // Totales generales
  const totals = data.reduce(
    (acc, item) => ({
      abastecimientos: acc.abastecimientos + (item.totalAbastecimientos || 0),
      litros: acc.litros + (item.totalLitros || 0),
    }),
    { abastecimientos: 0, litros: 0 },
  );

  return (
    <div>
      <PageHeader title="Abastecimiento" description="Reporte de abastecimiento de combustible por vehiculo">
        {searched && !loading && (
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
            {totalElements} resultado{totalElements !== 1 ? 's' : ''}
          </span>
        )}
      </PageHeader>

      {/* Panel de Filtros */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Fuel className="w-5 h-5 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Desde *</label>
            <input
              type="date"
              value={filtros.desde}
              onChange={(e) => setFiltros((f) => ({ ...f, desde: e.target.value }))}
              className="input-field py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta *</label>
            <input
              type="date"
              value={filtros.hasta}
              onChange={(e) => setFiltros((f) => ({ ...f, hasta: e.target.value }))}
              className="input-field py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Vehiculo</label>
            <select
              value={filtros.vehiculoId}
              onChange={(e) => setFiltros((f) => ({ ...f, vehiculoId: Number(e.target.value) }))}
              className="input-field appearance-none pr-8 py-2 text-sm"
            >
              <option value={0}>Todos</option>
              {vehiculos.map((v) => (
                <option key={v.id} value={v.id}>{v.matricula} — {v.modelo}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Lugar de Abastecimiento</label>
            <input
              type="text"
              placeholder="Filtrar por lugar..."
              value={filtros.lugarAbastecimiento}
              onChange={(e) => setFiltros((f) => ({ ...f, lugarAbastecimiento: e.target.value }))}
              className="input-field py-2 text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleBuscar}
            disabled={loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar
          </button>
          <button onClick={handleLimpiar} className="btn-secondary flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Limpiar
          </button>
        </div>
      </div>

      {/* Resumen general */}
      {searched && !loading && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card bg-blue-50 border-blue-200">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total Vehiculos</p>
            <p className="text-2xl font-bold text-blue-800 mt-1">{totalElements}</p>
          </div>
          <div className="card bg-green-50 border-green-200">
            <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Total Abastecimientos</p>
            <p className="text-2xl font-bold text-green-800 mt-1">{totals.abastecimientos.toLocaleString()}</p>
          </div>
          <div className="card bg-amber-50 border-amber-200">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Total Litros</p>
            <p className="text-2xl font-bold text-amber-800 mt-1">{formatNumber(totals.litros)} L</p>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">Generando reporte...</p>
          </div>
        ) : searched && data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Fuel className="w-10 h-10 mb-3" />
            <p className="text-sm">No se encontraron resultados para los filtros seleccionados.</p>
          </div>
        ) : searched ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="table-header px-4 py-3 text-left">Matricula</th>
                    <th className="table-header px-4 py-3 text-left">Modelo</th>
                    <th className="table-header px-4 py-3 text-left">Marca</th>
                    <th className="table-header px-4 py-3 text-left">Tipo</th>
                    <th className="table-header px-4 py-3 text-right">Total Abast.</th>
                    <th className="table-header px-4 py-3 text-right">Total Litros</th>
                    <th className="table-header px-4 py-3 text-right">Promedio L/Carga</th>
                    <th className="table-header px-4 py-3 text-right">Frecuencia (dias)</th>
                    <th className="table-header px-4 py-3 text-left">Lugar Mas Frecuente</th>
                    <th className="table-header px-4 py-3 text-left">Periodo</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, idx) => (
                    <tr key={item.vehiculoResumido.id ?? idx} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.vehiculoResumido.matricula}</td>
                      <td className="px-4 py-3 text-gray-600">{item.vehiculoResumido.modelo || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{item.vehiculoResumido.marcaNombre || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{item.vehiculoResumido.tipoVehiculoNombre || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium">{(item.totalAbastecimientos ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatNumber(item.totalLitros)} L</td>
                      <td className="px-4 py-3 text-right">{formatNumber(item.promedioLitrosPorCarga)} L</td>
                      <td className="px-4 py-3 text-right">{item.frecuenciaDias != null ? item.frecuenciaDias.toLocaleString() : '—'}</td>
                      <td className="px-4 py-3">
                        {item.lugarMasFrecuente ? (
                          <span className="inline-flex items-center gap-1 text-gray-700">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {item.lugarMasFrecuente}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{item.periodo || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Fuel className="w-10 h-10 mb-3" />
            <p className="text-sm">Seleccione los filtros y presione Buscar para generar el reporte.</p>
          </div>
        )}
      </div>
    </div>
  );
}
