import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (!token || !savedUser) {
      setLoading(false);
      return;
    }
    try {
      const parsedUser = JSON.parse(savedUser);
      const response = await authApi.getCurrentUser();
      const fullUser = response.data;
      const userRoles = fullUser.roles || parsedUser.roles || [];
      const allPermissions = userRoles.flatMap((role) =>
        (role.permissions || []).map((p) => p.name)
      );
      setPermissions([...new Set(allPermissions)]);
      setUser({ ...fullUser, roles: userRoles });
      localStorage.setItem('user', JSON.stringify({ ...fullUser, roles: userRoles }));
    } catch (error) {
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

  const login = async (email, password) => {
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

  const hasPermission = (permissionName) => {
    return permissions.includes(permissionName);
  };

  const hasRole = (roleName) => {
    return user?.roles?.some((r) => r.name === roleName) ?? false;
  };

  const isAdmin = () => {
    return hasRole('ADMIN') || hasRole('ADMINISTRADOR');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        permissions,
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
