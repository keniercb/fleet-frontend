import { Car, Users, Route, Building2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    { label: 'Vehículos', value: '--', icon: Car, color: 'bg-blue-500' },
    { label: 'Choferes', value: '--', icon: Users, color: 'bg-emerald-500' },
    { label: 'Recorridos', value: '--', icon: Route, color: 'bg-amber-500' },
    { label: 'Empresas', value: '--', icon: Building2, color: 'bg-purple-500' },
  ];

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.email || 'Usuario'}
        </h1>
        <p className="text-gray-500 mt-1">
          {user?.roles?.length
            ? `Rol: ${user.roles.map((r) => r.name).join(', ')}`
            : 'Panel principal del sistema'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="card flex items-center gap-4"
            >
              <div
                className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Placeholder for future widgets */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Actividad Reciente
          </h2>
        </div>
        <p className="text-gray-500 text-sm">
          Aquí se mostrarán las actividades recientes del sistema. Los módulos se
          irán añadiendo progresivamente.
        </p>
      </div>
    </div>
  );
}
