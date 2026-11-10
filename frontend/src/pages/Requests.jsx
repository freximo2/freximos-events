import { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { requestService } from '../services/api';

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'GENERAL', priority: 'MEDIUM' });
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  function loadRequests() {
    requestService.list().then(setRequests).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { loadRequests(); }, []);

  const filtered = requests.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (priorityFilter && r.priority !== priorityFilter) return false;
    if (typeFilter && r.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.creator.name.toLowerCase().includes(q);
    }
    return true;
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await requestService.create(form);
      setShowForm(false);
      setForm({ title: '', description: '', type: 'GENERAL', priority: 'MEDIUM' });
      loadRequests();
    } catch (err) {
      setError(err.error || 'Error creando solicitud');
    }
  }

  async function handleValidate(id, status, response) {
    try {
      await requestService.validate(id, { status, response });
      loadRequests();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleEscalate(id) {
    try {
      await requestService.escalate(id);
      loadRequests();
    } catch (err) {
      console.error(err);
    }
  }

  const statusColors = {
    OPEN: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    ESCALATED: 'bg-red-100 text-red-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-600',
  };

  const statusLabels = {
    OPEN: 'Abierta',
    IN_PROGRESS: 'En Progreso',
    ESCALATED: 'Escalada',
    RESOLVED: 'Resuelta',
    CLOSED: 'Cerrada',
  };

  const priorityColors = {
    LOW: 'bg-gray-100 text-gray-600',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    URGENT: 'bg-red-100 text-red-700',
  };

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none';

  if (loading) {
    return <div className="flex justify-center items-center h-64"><p className="text-gray-500">Cargando...</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-primary-700">Solicitudes</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          {showForm ? 'Cancelar' : '+ Nueva Solicitud'}
        </button>
      </div>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 outline-none w-44" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 outline-none">
          <option value="">Estado</option>
          <option value="OPEN">Abierta</option>
          <option value="IN_PROGRESS">En Progreso</option>
          <option value="ESCALATED">Escalada</option>
          <option value="RESOLVED">Resuelta</option>
          <option value="CLOSED">Cerrada</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 outline-none">
          <option value="">Prioridad</option>
          <option value="LOW">Baja</option>
          <option value="MEDIUM">Media</option>
          <option value="HIGH">Alta</option>
          <option value="URGENT">Urgente</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 outline-none">
          <option value="">Tipo</option>
          <option value="GENERAL">General</option>
          <option value="COMPLAINT">Queja</option>
          <option value="SUGGESTION">Sugerencia</option>
          <option value="CHANGE">Cambio</option>
        </select>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}>
                <option value="GENERAL">General</option>
                <option value="COMPLAINT">Queja</option>
                <option value="SUGGESTION">Sugerencia</option>
                <option value="CHANGE">Cambio</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inputClass}>
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
          </div>
          <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition">
            Crear Solicitud
          </button>
        </form>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-500">{requests.length === 0 ? 'No hay solicitudes' : 'No hay resultados con estos filtros'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => (
            <div key={req.id} className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800">{req.title}</h3>
                  <p className="text-sm text-gray-400">Por {req.creator.name} - {new Date(req.createdAt).toLocaleDateString('es')}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[req.priority]}`}>
                    {req.priority}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[req.status]}`}>
                    {statusLabels[req.status]}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{req.description}</p>
              {req.response && (
                <div className="bg-green-50 p-3 rounded-lg mb-3">
                  <p className="text-xs text-gray-500 mb-1">Respuesta:</p>
                  <p className="text-sm text-gray-700">{req.response}</p>
                </div>
              )}
              {isAdmin && (req.status === 'OPEN' || req.status === 'IN_PROGRESS' || req.status === 'ESCALATED') && (
                <div className="flex gap-2 pt-2 border-t">
                  {req.status === 'OPEN' && (
                    <button onClick={() => handleValidate(req.id, 'IN_PROGRESS')} className="text-xs bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">
                      En Progreso
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const resp = prompt('Respuesta:');
                      if (resp) handleValidate(req.id, 'RESOLVED', resp);
                    }}
                    className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Resolver
                  </button>
                  {req.status !== 'ESCALATED' && (
                    <button onClick={() => handleEscalate(req.id)} className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                      Escalar
                    </button>
                  )}
                  <button onClick={() => handleValidate(req.id, 'CLOSED')} className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600">
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
