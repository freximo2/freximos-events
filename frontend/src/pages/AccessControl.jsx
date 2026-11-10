import { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { groupService } from '../services/api';
import { Users, UsersRound, Search, UserX, Shield, ChevronDown, ChevronUp } from 'lucide-react';

export default function AccessControl() {
  const { user } = useAuth();
  const [myUsers, setMyUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [tab, setTab] = useState('users');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [u, g] = await Promise.all([
        groupService.myUsers(),
        groupService.list(),
      ]);
      setMyUsers(u);
      setGroups(g);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDenyAccess(userId, userName) {
    if (!confirm(`¿Denegar acceso a ${userName}? Se cancelaran todas sus inscripciones en tus eventos y sera removido de tus grupos.`)) return;
    try {
      const result = await groupService.denyAccess(userId);
      setMsg(result.message);
      setTimeout(() => setMsg(''), 4000);
      loadData();
    } catch (err) {
      setMsg(err.error || 'Error denegando acceso');
    }
  }

  async function handleRemoveFromGroup(groupId, userId) {
    try {
      await groupService.removeMember(groupId, userId);
      loadData();
    } catch (err) {
      setMsg(err.error || 'Error eliminando miembro');
    }
  }

  const filteredUsers = myUsers.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Control de Accesos</h2>
          <p className="text-sm text-gray-400">Gestiona usuarios y grupos de tu espacio</p>
        </div>
      </div>

      {msg && (
        <div className="bg-green-50 text-green-700 p-3 rounded-xl mb-4 text-sm border border-green-100">{msg}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
            tab === 'users' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={16} /> Usuarios ({myUsers.length})
        </button>
        <button
          onClick={() => setTab('groups')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
            tab === 'groups' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <UsersRound size={16} /> Grupos ({groups.length})
        </button>
      </div>

      {/* USERS TAB */}
      {tab === 'users' && (
        <div>
          <div className="glass rounded-2xl p-4 mb-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar usuario por nombre o email..."
                className="input-modern !pl-10"
              />
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-3">
            Usuarios que se inscribieron a tus eventos publicos o fueron invitados a privados
          </p>

          {filteredUsers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-8 text-center border border-gray-100">
              <Users size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400">No hay usuarios en tu espacio</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-gray-600 font-medium">Usuario</th>
                    <th className="px-5 py-3 text-left text-gray-600 font-medium">Email</th>
                    <th className="px-5 py-3 text-left text-gray-600 font-medium">Desde</th>
                    <th className="px-5 py-3 text-right text-gray-600 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{u.email}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString('es')}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleDenyAccess(u.id, u.name)}
                          className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition font-medium"
                        >
                          <UserX size={12} /> Denegar acceso
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* GROUPS TAB */}
      {tab === 'groups' && (
        <div>
          {groups.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-8 text-center border border-gray-100">
              <UsersRound size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400">No tienes grupos creados</p>
              <p className="text-xs text-gray-300 mt-1">Crea grupos desde la seccion Grupos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map(group => (
                <div key={group.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <UsersRound size={18} className="text-indigo-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-800">{group.name}</p>
                        {group.description && <p className="text-xs text-gray-400">{group.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="badge bg-indigo-100 text-indigo-700">{group.members?.length || 0} miembros</span>
                      {expandedGroup === group.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </button>

                  {expandedGroup === group.id && (
                    <div className="border-t px-5 py-4">
                      {group.members?.length > 0 ? (
                        <div className="space-y-2">
                          {group.members.map(m => (
                            <div key={m.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-[10px] font-bold">
                                  {m.user.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <span className="text-sm font-medium">{m.user.name}</span>
                                <span className="text-xs text-gray-400">{m.user.email}</span>
                              </div>
                              <button
                                onClick={() => handleRemoveFromGroup(group.id, m.user.id)}
                                className="text-xs text-red-500 hover:text-red-700 font-medium"
                              >
                                Quitar
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-2">Sin miembros</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
