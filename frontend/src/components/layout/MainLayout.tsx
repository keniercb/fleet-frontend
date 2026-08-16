import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      {/* Main content area - offset for sidebar width */}
      <div className="lg:pl-64 transition-all duration-300">
        <main className="p-6 pt-16 lg:pt-6 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
