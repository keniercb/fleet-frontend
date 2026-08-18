import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Menu, X } from 'lucide-react';

interface TopNavbarProps {
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  sidebarCollapsed: boolean;
}

export default function TopNavbar({ mobileMenuOpen, onToggleMobileMenu, sidebarCollapsed }: TopNavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className={`fixed top-0 right-0 z-30 bg-white border-b border-gray-200 shadow-sm transition-all duration-300 ${sidebarCollapsed ? 'lg:left-20' : 'lg:left-64'}`}>
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        {/* Left: mobile menu toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Right: user info + logout */}
        <div className="flex items-center gap-3 ml-auto">
          {user && (
            <>
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                    {user.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">
                    {user.roles?.map((r) => r.name).join(', ') || 'Sin rol'}
                  </p>
                </div>
              </div>
              <div className="w-px h-8 bg-gray-200 hidden sm:block" />
            </>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
