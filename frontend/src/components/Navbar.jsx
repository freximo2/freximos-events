import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import NotificationBell from './NotificationBell';
import {
  CalendarDays, ClipboardList, FileText, CreditCard, BarChart3,
  Award, Users, LayoutDashboard, LogOut, FolderPlus, UsersRound, Shield,
} from 'lucide-react';

function NavLink({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all duration-200 text-sm text-gray-300 hover:text-white"
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <nav className="glass-dark text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-white rounded-xl px-2.5 py-1 group-hover:shadow-glow transition-shadow">
            <img src="/brand/freximos-icon.png" alt="Freximos" className="h-10 object-contain" />
          </div>
        </Link>
        <div className="flex items-center gap-1">
          {user ? (
            <>
              <NavLink to="/events" icon={<CalendarDays size={16} />} label="Eventos" />
              <NavLink to="/my-registrations" icon={<ClipboardList size={16} />} label="Inscripciones" />
              <NavLink to="/requests" icon={<FileText size={16} />} label="Solicitudes" />
              <NavLink to="/payments" icon={<CreditCard size={16} />} label="Pagos" />
              <NavLink to="/stats" icon={<BarChart3 size={16} />} label={isAdmin ? 'Stats' : 'Mis Stats'} />
              <NavLink to="/event-type-requests" icon={<FolderPlus size={16} />} label="Solicitar Evento" />
              {isAdmin && (
                <>
                  <NavLink to="/groups" icon={<UsersRound size={16} />} label="Grupos" />
                  <NavLink to="/access-control" icon={<Shield size={16} />} label="Accesos" />
                </>
              )}
              {isSuperAdmin && (
                <>
                  <NavLink to="/sponsors" icon={<Award size={16} />} label="Sponsors" />
                  <NavLink to="/clients" icon={<Users size={16} />} label="Clientes" />
                </>
              )}
              {isAdmin && (
                <NavLink to="/admin" icon={<LayoutDashboard size={16} />} label="Admin" />
              )}
              <div className="mx-1 w-px h-6 bg-white/20" />
              <NotificationBell />
              <Link
                to="/profile"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all duration-200 text-sm"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[10px] font-bold">
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="hidden md:inline">{user.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-all duration-200"
                title="Salir"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-200 text-sm">
                Ingresar
              </Link>
              <Link to="/register" className="btn-primary text-sm !py-2 !px-4">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
