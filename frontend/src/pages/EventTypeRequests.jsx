import { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { eventTypeRequestService } from '../services/api';

const STATUS_STYLES = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  APPROVED: 'bg-green-100 text-green-800 border-green-300',
  DENIED: 'bg-red-100 text-red-800 border-red-300',
};

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  DENIED: 'Denegada',
};

export default function EventTypeRequests() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ categoryName: '', description: '', justification: '' });
  const [filter, setFilter] = useState('ALL');
  const [resolveNote, setResolveNote] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      const data = await eventTypeRequestService.list();
      setRequests(data);
    } catch (err) {
      setError(err.error || 'Error cargando solicitudes');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await eventTypeRequestService.create(form);
      setForm({ categoryName: '', description: '', justification: '' });
      setShowCreate(false);
      setMessage('Solicitud enviada exitosamente');
      setTimeout(() => setMessage(''), 3000);
      loadRequests();
    } catch (err) {
      setError(err.error || 'Error creando solicitud');
    }
  }

  async function handleResolve(id, status) {
    setError('');
    try {
      await eventTypeRequestService.resolve(id, { status, adminNotes: resolveNote });
      setResolveNote('');
      setMessage(`Solicitud ${status === 'APPROVED' ? 'aprobada' : 'denegada'}`);
      setTimeout(() => setMessage(''), 3000);
      loadRequests();
    } catch (err) {
      setError(err.error || 'Error resolviendo solicitud');
    }
  }

  const filteredRequests =
    filter === 'ALL' ? requests : requests.filter((r) => r.status === filter);

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
          <h2 className="text-2xl font-bold text-primary-700">Solicitudes de Tipo de Evento</h2>
          <p className="text-gray-500 text-sm mt-1">
            {isSuperAdmin
              ? 'Gestiona las solicitudes de nuevos tipos de evento'
              : 'Solicita nuevos tipos de evento'}
          </p>
        </div>
        {!isSuperAdmin && (
          <button
            onClick={() => {
              setShowCreate(!showCreate);
              setError('');
            }}
            className="btn-primary px-4 py-2 rounded-xl text-sm font-medium"
          >
            {showCreate ? 'Cerrar' : '+ Nueva Solicitud'}
          </button>
        )}
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
          <h3 className="font-semibold text-gray-800 mb-4">Nueva Solicitud</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la categoria *
              </label>
              <input
                type="text"
                value={form.categoryName}
                onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                required
                placeholder="Ej: TENIS, NATACION..."
                className="input-modern w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripcion *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                rows={2}
                placeholder="Describe el tipo de evento"
                className="input-modern w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Justificacion *
              </label>
              <textarea
                value={form.justification}
                onChange={(e) => setForm({ ...form, justification: e.target.value })}
                required
                rows={2}
                placeholder="Por que se necesita este tipo de evento?"
                className="input-modern w-full"
              />
            </div>
            <button type="submit" className="btn-primary px-6 py-2 rounded-xl text-sm">
              Enviar Solicitud
            </button>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['ALL', 'PENDING', 'APPROVED', 'DENIED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'ALL' ? 'Todas' : STATUS_LABELS[f]}
            <span className="ml-1 text-xs">
              ({f === 'ALL' ? requests.length : requests.filter((r) => r.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-gray-500">No hay solicitudes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="card-hover bg-white rounded-2xl shadow-md border border-gray-100 p-5"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">{req.categoryName}</h3>
                  {req.user && (
                    <p className="text-sm text-gray-500">
                      Solicitado por {req.user.name} ({req.user.email})
                    </p>
                  )}
                </div>
                <span
                  className={`badge text-xs px-3 py-1.5 rounded-full border ${
                    STATUS_STYLES[req.status] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {STATUS_LABELS[req.status] || req.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Descripcion</p>
                  <p className="text-sm text-gray-700">{req.description}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Justificacion</p>
                  <p className="text-sm text-gray-700">{req.justification}</p>
                </div>
                {req.adminNotes && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Notas del admin</p>
                    <p className="text-sm text-gray-700">{req.adminNotes}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {new Date(req.createdAt).toLocaleDateString('es', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>

                {/* Super Admin actions */}
                {isSuperAdmin && req.status === 'PENDING' && (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Nota (opcional)"
                      value={resolveNote}
                      onChange={(e) => setResolveNote(e.target.value)}
                      className="input-modern text-sm w-48"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={() => handleResolve(req.id, 'APPROVED')}
                      className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleResolve(req.id, 'DENIED')}
                      className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition"
                    >
                      Denegar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
