import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getFilteredNavigation } from '@/utils/navigation';
import type { NavSection } from '@/utils/navigation';
import { Car, LayoutDashboard, PanelLeftClose, PanelLeft } from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ mobileOpen, onCloseMobile, collapsed, onToggleCollapse }: SidebarProps) {
  const { hasPermission, isAdmin } = useAuth();

  const sections = getFilteredNavigation(hasPermission, isAdmin);

  const renderSection = (section: NavSection) => (
    <div key={section.id} className="mb-2">
      {!collapsed && (
        <p className="px-3 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-text/60">
          {section.label}
        </p>
      )}
      {collapsed && <div className="my-2 border-t border-white/5" />}
      <div className="space-y-0.5">
        {section.items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-sidebar-active text-sidebar-text-active shadow-lg shadow-primary-900/30'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header with logo + collapse toggle */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <div className="flex-shrink-0 w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
          <Car className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1 overflow-hidden">
            <h1 className="text-white font-bold text-sm leading-tight truncate">
              Gestión Vehicular
            </h1>
            <p className="text-sidebar-text text-xs truncate">Sistema de Control</p>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex ml-auto flex-shrink-0 w-7 h-7 items-center justify-center rounded-md text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-colors"
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {/* Dashboard (always first, standalone) */}
        <NavLink
          to="/"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
              isActive
                ? 'bg-sidebar-active text-sidebar-text-active shadow-lg shadow-primary-900/30'
                : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
            } ${collapsed ? 'justify-center' : ''}`
          }
          title={collapsed ? 'Dashboard' : undefined}
        >
          <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="truncate">Dashboard</span>}
        </NavLink>

        {sections.map(renderSection)}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside
        className={`lg:hidden fixed top-14 bottom-0 left-0 z-40 w-64 bg-sidebar transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:flex flex-col fixed top-14 bottom-0 left-0 z-20 bg-sidebar transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
