import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ComingSoon from '@/components/common/ComingSoon';
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
                  <ComingSoon title="Vehículos" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/choferes"
              element={
                <ProtectedRoute permission="CHOFERES_READ">
                  <ComingSoon title="Choferes" />
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
                  <ComingSoon title="Empresas" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marcas"
              element={
                <ProtectedRoute permission="MARCAS_READ">
                  <ComingSoon title="Marcas" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tipos-vehiculo"
              element={
                <ProtectedRoute permission="TIPOS_VEHICULO_READ">
                  <ComingSoon title="Tipos de Vehículo" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tipos-combustible"
              element={
                <ProtectedRoute permission="TIPOS_COMBUSTIBLE_READ">
                  <ComingSoon title="Tipos de Combustible" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categorias-licencia"
              element={
                <ProtectedRoute permission="CATEGORIAS_LICENCIA_READ">
                  <ComingSoon title="Categorías de Licencia" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute permission="USUARIOS_READ">
                  <ComingSoon title="Usuarios" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roles"
              element={
                <ProtectedRoute permission="ROLES_READ">
                  <ComingSoon title="Roles" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/permisos"
              element={
                <ProtectedRoute permission="PERMISOS_READ">
                  <ComingSoon title="Permisos" />
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
    </BrowserRouter>
  );
}
