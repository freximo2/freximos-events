import { useState, useEffect } from 'react';
import { spaceService, userService } from '../services/api';
import { Plus, Trash2, UserPlus, X, Settings } from 'lucide-react';

const ALL_CATEGORIES = ['FUTBOL', 'BASKETBALL', 'BAILE', 'BOLOS', 'REUNION', 'OTRO'];

const CATEGORY_LABELS = {
  FUTBOL: 'Futbol',
  BASKETBALL: 'Basketball',
  BAILE: 'Baile',
  BOLOS: 'Bolos',
  REUNION: 'Reunion',
  OTRO: 'Otro',
};

const CATEGORY_COLORS = {
  FUTBOL: 'bg-green-100 text-green-800 border-green-300',
  BASKETBALL: 'bg-orange-100 text-orange-800 border-orange-300',
  BAILE: 'bg-pink-100 text-pink-800 border-pink-300',
  BOLOS: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  REUNION: 'bg-teal-100 text-teal-800 border-teal-300',
  OTRO: 'bg-gray-100 text-gray-800 border-gray-300',
};

export default function AdminSpaces() {
  const [spaces, setSpaces] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', category: 'FUTBOL', isPublic: true });
  const [creating, setCreating] = useState(false);

  // Admin assignment
  const [assigningSpaceId, setAssigningSpaceId] = useState(null);
  const [adminSearch, setAdminSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [spaceList, userList] = await Promise.all([
        spaceService.list(),
        userService.listUsers(),
      ]);
      setSpaces(spaceList);
      setAdmins(userList.filter((u) => u.role === 'ADMIN'));
    } catch (err) {
      setError(err.error || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await spaceService.create(createForm);
      setCreateForm({ name: '', description: '', category: 'FUTBOL', isPublic: true });
      setShowCreate(false);
      setMessage('Espacio creado correctamente');
      setTimeout(() => setMessage(''), 3000);
      await loadData();
    } catch (err) {
      setError(err.error || 'Error creando espacio');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(spaceId) {
    if (!confirm('¿Eliminar este espacio? Los eventos asociados perderan la referencia.')) return;
    setError('');
    try {
      await spaceService.remove(spaceId);
      setMessage('Espacio eliminado');
      setTimeout(() => setMessage(''), 3000);
      await loadData();
    } catch (err) {
      setError(err.error || 'Error eliminando espacio');
    }
  }

  async function handleAssignAdmin(spaceId, adminId) {
    setError('');
    try {
      await spaceService.assignAdmin(spaceId, adminId);
      setMessage('Administrador asignado');
      setTimeout(() => setMessage(''), 3000);
      setAssigningSpaceId(null);
      setAdminSearch('');
      await loadData();
    } catch (err) {
      setError(err.error || 'Error asignando administrador');
    }
  }

  async function handleRemoveAdmin(spaceId, adminId) {
    setError('');
    try {
      await spaceService.removeAdmin(spaceId, adminId);
      setMessage('Administrador removido');
      setTimeout(() => setMessage(''), 3000);
      await loadData();
    } catch (err) {
      setError(err.error || 'Error removiendo administrador');
    }
  }

  function getAvailableAdmins(space) {
    const assignedIds = (space.admins || []).map((a) => a.admin.id);
    return admins.filter(
      (a) =>
        !assignedIds.includes(a.id) &&
        (a.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
          a.email.toLowerCase().includes(adminSearch.toLowerCase()))
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary-700 flex items-center gap-2">
            <Settings size={24} /> Espacios
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Gestiona espacios y asigna administradores
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Crear Espacio
        </button>
      </div>

      {message && (
        <div className="bg-green-50 text-green-700 p-3 rounded-2xl mb-4 text-sm border border-green-200">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-2xl mb-4 text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="glass rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Nuevo Espacio</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                  className="input-modern"
                  placeholder="Ej: Liga de Futbol"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                <select
                  value={createForm.category}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                  className="input-modern"
                >
                  {ALL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                rows={2}
                className="input-modern"
                placeholder="Descripcion del espacio..."
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.isPublic}
                  onChange={(e) => setCreateForm({ ...createForm, isPublic: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-400"
                />
                <span className="text-sm text-gray-700">Espacio publico</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={creating} className="btn-primary text-sm">
                {creating ? 'Creando...' : 'Crear Espacio'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="btn-secondary text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Spaces list */}
      {spaces.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-gray-500">No hay espacios creados</p>
          <p className="text-gray-400 text-sm mt-1">Crea el primer espacio para asignar administradores</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {spaces.map((space) => (
            <div
              key={space.id}
              className="card-hover bg-white rounded-2xl shadow-md border border-gray-100 p-6"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">{space.name}</h3>
                  {space.description && (
                    <p className="text-sm text-gray-500 mt-1">{space.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(space.id)}
                  className="text-gray-400 hover:text-red-500 transition p-1"
                  title="Eliminar espacio"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`badge text-xs px-3 py-1 rounded-full border ${CATEGORY_COLORS[space.category] || CATEGORY_COLORS.OTRO}`}>
                  {CATEGORY_LABELS[space.category] || space.category}
                </span>
                <span className={`badge text-xs px-3 py-1 rounded-full border ${space.isPublic ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-yellow-100 text-yellow-700 border-yellow-300'}`}>
                  {space.isPublic ? 'Publico' : 'Privado'}
                </span>
              </div>

              {/* Admins section */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                  Administradores ({(space.admins || []).length})
                </p>

                {(space.admins || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {space.admins.map((sa) => (
                      <span
                        key={sa.admin.id}
                        className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 text-xs px-3 py-1.5 rounded-full font-medium border border-primary-200"
                      >
                        {sa.admin.name}
                        <button
                          onClick={() => handleRemoveAdmin(space.id, sa.admin.id)}
                          className="hover:text-red-600 transition"
                          title="Remover admin"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {assigningSpaceId === space.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Buscar administrador..."
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      className="input-modern !text-sm !py-2"
                      autoFocus
                    />
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200">
                      {getAvailableAdmins(space).length === 0 ? (
                        <p className="text-xs text-gray-400 p-3 text-center">Sin administradores disponibles</p>
                      ) : (
                        getAvailableAdmins(space).map((admin) => (
                          <button
                            key={admin.id}
                            onClick={() => handleAssignAdmin(space.id, admin.id)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 border-b last:border-0 transition flex items-center gap-2"
                          >
                            <UserPlus size={14} className="text-primary-500" />
                            <span className="font-medium">{admin.name}</span>
                            <span className="text-xs text-gray-400">{admin.email}</span>
                          </button>
                        ))
                      )}
                    </div>
                    <button
                      onClick={() => { setAssigningSpaceId(null); setAdminSearch(''); }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAssigningSpaceId(space.id)}
                    className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium transition"
                  >
                    <UserPlus size={14} /> Asignar admin
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
