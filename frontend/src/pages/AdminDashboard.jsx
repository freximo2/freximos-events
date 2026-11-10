import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { statsService, userService, eventService, groupService } from '../services/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'USER' });
  const [inviteResult, setInviteResult] = useState(null);
  const [inviteError, setInviteError] = useState('');
  const [roleMsg, setRoleMsg] = useState('');
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    statsService.dashboard().then(setStats).catch(console.error);
    if (isSuperAdmin) {
      userService.listUsers().then(setUsers).catch(console.error);
    }
    if (user?.role === 'ADMIN') {
      eventService.list().then(setMyEvents).catch(console.error);
      userService.listUsers().then(setUsers).catch(console.error);
    }
  }, []);

  async function handleInvite(e) {
    e.preventDefault();
    setInviteError('');
    setInviteResult(null);
    try {
      const result = await userService.invite(inviteForm);
      setInviteResult(result);
      setInviteForm({ email: '', name: '', role: 'USER' });
      // Refresh users list
      userService.listUsers().then(setUsers).catch(console.error);
    } catch (err) {
      setInviteError(err.error || 'Error al invitar');
    }
  }

  async function handleDeleteUser(userId, userName) {
    if (!confirm(`¿Estás seguro de eliminar a ${userName}? Esta acción no se puede deshacer.`)) return;
    try {
      await userService.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setRoleMsg(`Usuario ${userName} eliminado`);
      setTimeout(() => setRoleMsg(''), 3000);
    } catch (err) {
      setRoleMsg(err.error || 'Error al eliminar usuario');
    }
  }

  async function handleChangeRole(userId, newRole) {
    setRoleMsg('');
    try {
      await userService.changeRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      setRoleMsg(`Rol actualizado correctamente`);
      setTimeout(() => setRoleMsg(''), 3000);
    } catch (err) {
      setRoleMsg(err.error || 'Error al cambiar rol');
    }
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 outline-none';

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold text-primary-700 mb-6">Panel de Administración</h2>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-3xl font-bold text-primary-600">{stats?.users || 0}</p>
          <p className="text-gray-500 text-sm mt-1">Usuarios</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-3xl font-bold text-primary-600">{stats?.events?.active || 0}</p>
          <p className="text-gray-500 text-sm mt-1">Eventos activos</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-3xl font-bold text-primary-600">{stats?.pendingRequests || 0}</p>
          <p className="text-gray-500 text-sm mt-1">Solicitudes pend.</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-3xl font-bold text-primary-600">${stats?.revenue || 0}</p>
          <p className="text-gray-500 text-sm mt-1">Ingresos</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link to="/events" className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition">
          <p className="font-semibold text-gray-700">Eventos</p>
          <p className="text-xs text-gray-400 mt-1">Gestionar eventos</p>
        </Link>
        <Link to="/requests" className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition">
          <p className="font-semibold text-gray-700">Solicitudes</p>
          <p className="text-xs text-gray-400 mt-1">Ver solicitudes</p>
        </Link>
        <Link to="/stats" className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition">
          <p className="font-semibold text-gray-700">Estadísticas</p>
          <p className="text-xs text-gray-400 mt-1">Ver métricas</p>
        </Link>
        {isSuperAdmin && (
          <Link to="/sponsors" className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition">
            <p className="font-semibold text-gray-700">Patrocinadores</p>
            <p className="text-xs text-gray-400 mt-1">Gestionar sponsors</p>
          </Link>
        )}
        <Link to="/groups" className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition">
          <p className="font-semibold text-gray-700">Grupos</p>
          <p className="text-xs text-gray-400 mt-1">Gestionar grupos</p>
        </Link>
        <Link to="/access-control" className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition">
          <p className="font-semibold text-gray-700">Accesos</p>
          <p className="text-xs text-gray-400 mt-1">Control de usuarios</p>
        </Link>
        {isSuperAdmin && (
          <Link to="/admin/spaces" className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition">
            <p className="font-semibold text-gray-700">Espacios</p>
            <p className="text-xs text-gray-400 mt-1">Gestionar espacios y admins</p>
          </Link>
        )}
        <Link to="/event-type-requests" className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition">
          <p className="font-semibold text-gray-700">Solicitar Evento</p>
          <p className="text-xs text-gray-400 mt-1">Tipos de evento</p>
        </Link>
      </div>

      {/* Invite - Admin can invite USER/ADMIN, Super Admin can invite all */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Invitar Usuarios</h3>
            <button
              onClick={() => { setShowInvite(!showInvite); setInviteResult(null); setInviteError(''); }}
              className="text-sm bg-primary-600 text-white px-3 py-1 rounded-lg hover:bg-primary-700 transition"
            >
              {showInvite ? 'Cerrar' : '+ Invitar'}
            </button>
          </div>
          {showInvite && (
            <div className="p-6">
              {inviteError && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{inviteError}</div>}
              {inviteResult && (
                <div className="bg-green-50 text-green-800 p-4 rounded-lg mb-4">
                  <p className="font-medium">Cuenta creada exitosamente</p>
                  <p className="text-sm mt-1">
                    <span className="font-medium">Email:</span> {inviteResult.user.email}<br />
                    <span className="font-medium">Contraseña temporal:</span>{' '}
                    <code className="bg-green-100 px-2 py-0.5 rounded">{inviteResult.tempPassword}</code>
                  </p>
                  <p className="text-xs mt-2 text-green-600">Comparte estas credenciales con el invitado de forma segura.</p>
                </div>
              )}
              <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input type="text" placeholder="Nombre completo" value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  required className={inputClass} />
                <input type="email" placeholder="Email" value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  required className={inputClass} />
                <select value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className={inputClass}>
                  <option value="USER">Usuario</option>
                  <option value="ADMIN">Admin</option>
                  {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
                </select>
                <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm">
                  Enviar Invitación
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ADMIN: My Events */}
      {user?.role === 'ADMIN' && myEvents.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold text-gray-800">Mis Eventos ({myEvents.filter(e => e.creatorId === user.id).length})</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-gray-600">Nombre</th>
                <th className="px-6 py-3 text-left text-gray-600">Categoría</th>
                <th className="px-6 py-3 text-left text-gray-600">Estado</th>
                <th className="px-6 py-3 text-left text-gray-600">Participantes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {myEvents.filter(e => e.creatorId === user.id).map((ev) => (
                <tr key={ev.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <Link to={`/events/${ev.id}`} className="text-primary-600 hover:text-primary-700">{ev.name}</Link>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{ev.category}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      ev.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ev.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                    }`}>{ev.status}</span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{ev._count?.registrations || 0}/{ev.maxPlayers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Users table - Super Admin (full control) / Admin (read-only) */}
      {(isSuperAdmin || user?.role === 'ADMIN') && users.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Usuarios ({users.length})</h3>
            {roleMsg && <span className="text-sm text-green-600">{roleMsg}</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-600">Nombre</th>
                  <th className="px-6 py-3 text-left text-gray-600">Email</th>
                  <th className="px-6 py-3 text-left text-gray-600">Rol</th>
                  <th className="px-6 py-3 text-left text-gray-600">Estado</th>
                  <th className="px-6 py-3 text-left text-gray-600">Registrado</th>
                  {isSuperAdmin && <th className="px-6 py-3 text-left text-gray-600">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium">{u.name}</td>
                    <td className="px-6 py-3 text-gray-500">{u.email}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        u.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                        u.role === 'ADMIN' ? 'bg-primary-100 text-primary-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-6 py-3">
                      {u.penalizedUntil && new Date(u.penalizedUntil) > new Date() ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                          Penalizado hasta {new Date(u.penalizedUntil).toLocaleDateString('es')}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Activo</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString('es')}</td>
                    {isSuperAdmin && (
                      <td className="px-6 py-3">
                        {u.id !== user.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeRole(u.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-primary-400 outline-none"
                            >
                              <option value="USER">USER</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            </select>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                            >
                              Eliminar
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Tu</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
