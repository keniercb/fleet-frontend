import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserResponse, AuthResponseDto, EmpresaResponse } from '@/types';
import { authApi } from '@/api/endpoints';

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  permissions: string[];
  empresa: EmpresaResponse | null;
  empresaId: number;
  login: (email: string, password: string) => Promise<AuthResponseDto>;
  logout: () => Promise<void>;
  hasPermission: (permissionName: string) => boolean;
  hasRole: (roleName: string) => boolean;
  isAdmin: () => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);

  const empresa = user?.empresa ?? null;
  const empresaId = user?.empresa?.id ?? 0;

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (!token || !savedUser) {
      setLoading(false);
      return;
    }
    try {
      const parsedUser = JSON.parse(savedUser) as UserResponse;
      const response = await authApi.getCurrentUser();
      const fullUser = response.data;
      const userRoles = fullUser.roles || parsedUser.roles || [];
      const allPermissions = userRoles.flatMap((role) =>
        (role.permissions || []).map((p) => p.name)
      );
      setPermissions([...new Set(allPermissions)]);
      setUser({ ...fullUser, roles: userRoles });
      localStorage.setItem('user', JSON.stringify({ ...fullUser, roles: userRoles }));
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string): Promise<AuthResponseDto> => {
    const response = await authApi.login({ email, password });
    const { token, userId, email: userEmail } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ id: userId, email: userEmail }));
    await loadUser();
    return response.data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setPermissions([]);
  };

  const hasPermission = (permissionName: string): boolean => {
    return permissions.includes(permissionName);
  };

  const hasRole = (roleName: string): boolean => {
    return user?.roles?.some((r) => r.name === roleName) ?? false;
  };

  const isAdmin = (): boolean => {
    return hasRole('ADMIN') || hasRole('ADMINISTRADOR');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        permissions,
        empresa,
        empresaId,
        login,
        logout,
        hasPermission,
        hasRole,
        isAdmin,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
