import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />

          {/* Protected with layout */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />

            <Route
              path="/vehiculos"
              element={
                <ProtectedRoute permission="VEHICULOS_READ">
                  <VehiculosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/choferes"
              element={
                <ProtectedRoute permission="CHOFERES_READ">
                  <ChoferesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recorridos"
              element={
                <ProtectedRoute permission="RECORRIDOS_READ">
                  <ComingSoon title="Recorridos" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/empresas"
              element={
                <ProtectedRoute permission="EMPRESAS_READ">
                  <EmpresaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marcas"
              element={
                <ProtectedRoute permission="MARCAS_READ">
                  <MarcaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tipos-vehiculo"
              element={
                <ProtectedRoute permission="TIPOS_VEHICULO_READ">
                  <TipoVehiculoPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tipos-combustible"
              element={
                <ProtectedRoute permission="TIPOS_COMBUSTIBLE_READ">
                  <TipoCombustiblePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categorias-licencia"
              element={
                <ProtectedRoute permission="CATEGORIAS_LICENCIA_READ">
                  <CategoriaLicenciaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute permission="USUARIOS_READ">
                  <UsuariosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roles"
              element={
                <ProtectedRoute permission="ROLES_READ">
                  <RolesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/permisos"
              element={
                <ProtectedRoute permission="PERMISOS_READ">
                  <PermisosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/choferes-categorias"
              element={
                <ProtectedRoute permission="CHOFERES_CATEGORIAS_READ">
                  <ComingSoon title="Licencias de Choferes" />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      <ToastContainer />
      </ToastProvider>
    </BrowserRouter>
  );
}
