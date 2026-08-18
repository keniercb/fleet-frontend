import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import ToastContainer from '@/components/ui/ToastContainer';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import PermisosPage from '@/pages/admin/PermisosPage';
import RolesPage from '@/pages/admin/RolesPage';
import UsuariosPage from '@/pages/admin/UsuariosPage';
import ComingSoon from '@/components/common/ComingSoon';
import TipoCombustiblePage from '@/pages/catalogs/TipoCombustiblePage';
import TipoVehiculoPage from '@/pages/catalogs/TipoVehiculoPage';
import CategoriaLicenciaPage from '@/pages/catalogs/CategoriaLicenciaPage';
import MarcaPage from '@/pages/catalogs/MarcaPage';
import VehiculosPage from '@/pages/vehiculos/VehiculosPage';
import ChoferesPage from '@/pages/choferes/ChoferesPage';
import EmpresaPage from '@/pages/catalogs/EmpresaPage';
import type { ReactNode } from 'react';

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RootLayout() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Outlet />
        <ToastContainer />
      </AuthProvider>
    </ToastProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/login',
        element: (
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        ),
      },
      {
        element: (
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <DashboardPage /> },
          {
            path: 'vehiculos',
            element: (
              <ProtectedRoute permission="VEHICULOS_READ">
                <VehiculosPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'choferes',
            element: (
              <ProtectedRoute permission="CHOFERES_READ">
                <ChoferesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'recorridos',
            element: (
              <ProtectedRoute permission="RECORRIDOS_READ">
                <ComingSoon title="Recorridos" />
              </ProtectedRoute>
            ),
          },
          {
            path: 'empresas',
            element: (
              <ProtectedRoute permission="EMPRESAS_READ">
                <EmpresaPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'marcas',
            element: (
              <ProtectedRoute permission="MARCAS_READ">
                <MarcaPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'tipos-vehiculo',
            element: (
              <ProtectedRoute permission="TIPOS_VEHICULO_READ">
                <TipoVehiculoPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'tipos-combustible',
            element: (
              <ProtectedRoute permission="TIPOS_COMBUSTIBLE_READ">
                <TipoCombustiblePage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'categorias-licencia',
            element: (
              <ProtectedRoute permission="CATEGORIAS_LICENCIA_READ">
                <CategoriaLicenciaPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'usuarios',
            element: (
              <ProtectedRoute permission="USUARIOS_READ">
                <UsuariosPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'roles',
            element: (
              <ProtectedRoute permission="ROLES_READ">
                <RolesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'permisos',
            element: (
              <ProtectedRoute permission="PERMISOS_READ">
                <PermisosPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'choferes-categorias',
            element: (
              <ProtectedRoute permission="CHOFERES_CATEGORIAS_READ">
                <ComingSoon title="Licencias de Choferes" />
              </ProtectedRoute>
            ),
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
