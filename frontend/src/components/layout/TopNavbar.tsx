import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Menu, X, ChevronDown, KeyRound, UserCircle, Building2 } from 'lucide-react';
import ChangePasswordModal from '@/components/ui/ChangePasswordModal';

interface TopNavbarProps {
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  sidebarCollapsed: boolean;
}

export default function TopNavbar({ mobileMenuOpen, onToggleMobileMenu, sidebarCollapsed }: TopNavbarProps) {
  const { user, empresa, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const handlePerfil = () => {
    setDropdownOpen(false);
    // Se puede agregar navegación a página de perfil cuando exista
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <>
      <header className={`fixed top-0 right-0 z-30 bg-white border-b border-gray-200 shadow-sm transition-all duration-300 ${sidebarCollapsed ? 'lg:left-20' : 'lg:left-64'}`}>
        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
          {/* Left: mobile menu toggle */}
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Center: empresa info */
          }
          {empresa && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-50">
              <Building2 className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-800 truncate max-w-[250px]">{empresa.nombre}</span>
            </div>
          )}

          {/* Right: user dropdown */}
          <div className="flex items-center ml-auto">
            {user && (
              <div className="relative" ref={dropdownRef}>
                {/* Trigger */}
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[200px] leading-tight">
                      {user.email}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[200px] leading-tight">
                      {user.roles?.map((r) => r.name).join(', ') || 'Sin rol'}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
                    {/* Perfil */}
                    <button
                      onClick={handlePerfil}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <UserCircle className="w-4 h-4 text-gray-400" />
                      Perfil
                    </button>

                    {/* Cambiar contraseña */}
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setPasswordModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <KeyRound className="w-4 h-4 text-gray-400" />
                      Cambiar contraseña
                    </button>

                    <div className="my-1 border-t border-gray-100" />

                    {/* Salir */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Salir
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal cambiar contraseña */}
      <ChangePasswordModal
        userId={user?.id ?? 0}
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </>
  );
}
