import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getFilteredNavigation } from '@/utils/navigation';
import type { NavSection } from '@/utils/navigation';
import { Car, LayoutDashboard, PanelLeftClose, PanelLeft, ChevronDown, ChevronRight } from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ mobileOpen, onCloseMobile, collapsed, onToggleCollapse }: SidebarProps) {
  const { isSuperAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    const sections = getFilteredNavigation(isSuperAdmin, isAdmin);
    return sections.filter((s) => s.items.some((i) => location.pathname === i.path)).map((s) => s.id);
  });

  const sections = getFilteredNavigation(isSuperAdmin, isAdmin);

  // Auto-expand when route changes (add to existing expanded sections)
  useEffect(() => {
    const shouldExpand = sections
      .filter((s) => s.items.some((i) => location.pathname === i.path))
      .map((s) => s.id);
    if (shouldExpand.length > 0) {
      setExpandedSections((prev) => {
        const merged = [...new Set([...prev, ...shouldExpand])];
        return merged;
      });
    }
  }, [location.pathname, sections]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    onCloseMobile();
  }, [navigate, onCloseMobile]);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="h-16 flex items-center px-4 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white truncate">Gestión Vehicular</h1>
              <p className="text-[10px] text-zinc-500 truncate">Sistema de Control</p>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className={`hidden lg:flex ml-auto flex-shrink-0 w-7 h-7 items-center justify-center rounded-md text-zinc-500 hover:bg-white/5 hover:text-white transition-colors ${collapsed ? 'ml-0' : ''}`}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {/* Dashboard */}
        <button
          onClick={() => handleNavigate('/')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-colors ${
            location.pathname === '/'
              ? 'bg-primary-600/20 text-primary-400'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Dashboard' : undefined}
        >
          <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="truncate">Dashboard</span>}
        </button>

        {/* Sections */}
        {sections.map((section) => {
          const isExpanded = expandedSections.includes(section.id);
          const SectionIcon = section.icon;
          const hasActiveChild = section.items.some((i) => location.pathname === i.path);

          return (
            <div key={section.id}>
              {/* Section header */}
              {collapsed ? (
                <>
                  <div className="my-2 border-t border-white/5" />
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigate(item.path)}
                        title={item.label}
                        className={`w-full flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-normal transition-colors ${
                          isActive
                            ? 'bg-primary-600/20 text-primary-400'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                      </button>
                    );
                  })}
                </>
              ) : (
                <>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors ${
                      hasActiveChild ? 'text-white' : ''
                    }`}
                  >
                    <SectionIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1 text-left truncate">{section.label}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>

                  {/* Sub-items with indent and left border */}
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                      {section.items.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNavigate(item.path)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-normal transition-colors ${
                              isActive
                                ? 'bg-primary-600/20 text-primary-400'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-white/10">
          <p className="text-[10px] text-zinc-600 text-center">
            v1.0.0 — Gestión Vehicular
          </p>
        </div>
      )}
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
        className={`lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-sidebar transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-20 bg-sidebar transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
