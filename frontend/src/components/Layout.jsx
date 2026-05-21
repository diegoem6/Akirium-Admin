import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, Users, UserCheck,
  ArrowDownCircle, Receipt, TrendingUp, FileSpreadsheet,
  PieChart, Plane, LogOut
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/proyectos',      label: 'Proyectos',       icon: FolderKanban },
  { to: '/clientes',       label: 'Clientes',        icon: Users },
  { to: '/colaboradores',  label: 'Colaboradores',   icon: UserCheck },
  { to: '/egresos',        label: 'Egresos',         icon: ArrowDownCircle },
  { to: '/impuestos',      label: 'Impuestos',       icon: Receipt },
  { to: '/flujo-caja',     label: 'Flujo de Caja',   icon: TrendingUp },
  { to: '/liquidaciones',  label: 'Liquidaciones',   icon: FileSpreadsheet },
  { to: '/utilidades',     label: 'Utilidades',       icon: PieChart },
];

export default function Layout() {
  const { username, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-gray-100 flex flex-col shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Plane size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Akirium</p>
            <p className="text-xs text-gray-400">Gestión empresarial</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400 truncate">
              <span className="text-gray-500">usuario: </span>{username}
            </div>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
