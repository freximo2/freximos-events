import { useState, useEffect } from 'react';
import { groupService, userService } from '../services/api';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [addingMember, setAddingMember] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [editingGroup, setEditingGroup] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [groupsData, usersData] = await Promise.all([
        groupService.list(),
        groupService.myUsers(),
      ]);
      setGroups(groupsData);
      setAvailableUsers(usersData);
    } catch (err) {
      // myUsers might fail for non-admin, fallback to userService
      try {
        const groupsData = await groupService.list();
        setGroups(groupsData);
        const users = await userService.listUsers();
        setAvailableUsers(users);
      } catch (err2) {
        setError(err2.error || 'Error cargando datos');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await groupService.create(createForm);
      setCreateForm({ name: '', description: '' });
      setShowCreate(false);
      setMessage('Grupo creado exitosamente');
      setTimeout(() => setMessage(''), 3000);
      loadData();
    } catch (err) {
      setError(err.error || 'Error creando grupo');
    }
  }

  async function handleDelete(groupId, groupName) {
    if (!confirm(`Eliminar grupo "${groupName}"?`)) return;
    try {
      await groupService.remove(groupId);
      setMessage('Grupo eliminado');
      setTimeout(() => setMessage(''), 3000);
      loadData();
    } catch (err) {
      setError(err.error || 'Error eliminando grupo');
    }
  }

  async function handleAddMember(groupId) {
    if (!selectedUserId) return;
    setError('');
    try {
      await groupService.addMember(groupId, parseInt(selectedUserId));
      setSelectedUserId('');
      setAddingMember(null);
      setMessage('Miembro agregado');
      setTimeout(() => setMessage(''), 3000);
      loadData();
    } catch (err) {
      setError(err.error || 'Error agregando miembro');
    }
  }

  async function handleRemoveMember(groupId, userId, userName) {
    if (!confirm(`Remover a ${userName} del grupo?`)) return;
    try {
      await groupService.removeMember(groupId, userId);
      setMessage('Miembro removido');
      setTimeout(() => setMessage(''), 3000);
      loadData();
    } catch (err) {
      setError(err.error || 'Error removiendo miembro');
    }
  }

  async function handleUpdateGroup(groupId) {
    setError('');
    try {
      await groupService.update(groupId, editForm);
      setEditingGroup(null);
      setMessage('Grupo actualizado');
      setTimeout(() => setMessage(''), 3000);
      loadData();
    } catch (err) {
      setError(err.error || 'Error actualizando grupo');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary-700">Mis Grupos</h2>
          <p className="text-gray-500 text-sm mt-1">Gestiona tus grupos de usuarios</p>
        </div>
        <button
          onClick={() => {
            setShowCreate(!showCreate);
            setError('');
          }}
          className="btn-primary px-4 py-2 rounded-xl text-sm font-medium"
        >
          {showCreate ? 'Cerrar' : '+ Crear Grupo'}
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

      {/* Create Form */}
      {showCreate && (
        <div className="glass rounded-2xl p-6 mb-6 border border-gray-100 shadow-md">
          <h3 className="font-semibold text-gray-800 mb-4">Nuevo Grupo</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
                placeholder="Nombre del grupo"
                className="input-modern w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                rows={2}
                placeholder="Descripcion opcional"
                className="input-modern w-full"
              />
            </div>
            <button type="submit" className="btn-primary px-6 py-2 rounded-xl text-sm">
              Crear Grupo
            </button>
          </form>
        </div>
      )}

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-gray-500">No tienes grupos creados</p>
          <p className="text-gray-400 text-sm mt-1">Crea tu primer grupo para organizar usuarios</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="card-hover bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
            >
              {/* Group Header */}
              <div
                className="p-5 flex justify-between items-center cursor-pointer"
                onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    {editingGroup === group.id ? (
                      <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="input-modern text-sm"
                        />
                        <button
                          onClick={() => handleUpdateGroup(group.id)}
                          className="text-xs bg-green-500 text-white px-2 py-1 rounded-lg"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingGroup(null)}
                          className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded-lg"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-semibold text-gray-800">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm text-gray-500">{group.description}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm">
                    {group.members?.length || 0} miembros
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedGroup === group.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedGroup === group.id && (
                <div className="border-t border-gray-100 p-5">
                  {/* Action buttons */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingGroup(group.id);
                        setEditForm({ name: group.name, description: group.description || '' });
                      }}
                      className="text-xs bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600 transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddingMember(addingMember === group.id ? null : group.id);
                      }}
                      className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition"
                    >
                      + Agregar Miembro
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(group.id, group.name);
                      }}
                      className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition"
                    >
                      Eliminar Grupo
                    </button>
                  </div>

                  {/* Add Member */}
                  {addingMember === group.id && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-4 flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Seleccionar usuario
                        </label>
                        <select
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="input-modern w-full"
                        >
                          <option value="">-- Seleccionar --</option>
                          {availableUsers
                            .filter(
                              (u) =>
                                !group.members?.some((m) => m.userId === u.id || m.user?.id === u.id)
                            )
                            .map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.email})
                              </option>
                            ))}
                        </select>
                      </div>
                      <button
                        onClick={() => handleAddMember(group.id)}
                        className="btn-primary px-4 py-2 rounded-xl text-sm"
                      >
                        Agregar
                      </button>
                    </div>
                  )}

                  {/* Members List */}
                  {group.members && group.members.length > 0 ? (
                    <div className="space-y-2">
                      {group.members.map((member) => {
                        const memberUser = member.user || member;
                        return (
                          <div
                            key={member.id || memberUser.id}
                            className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                {(memberUser.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {memberUser.name}
                                </p>
                                <p className="text-xs text-gray-500">{memberUser.email}</p>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                handleRemoveMember(
                                  group.id,
                                  memberUser.id || member.userId,
                                  memberUser.name
                                )
                              }
                              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition"
                            >
                              Remover
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">
                      Sin miembros. Agrega usuarios a este grupo.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
