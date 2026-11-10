import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { registrationService } from '../services/api';

const STATUS_BADGE = {
  CONFIRMED: { cls: 'bg-green-100 text-green-800', label: 'Confirmado' },
  PENDING: { cls: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
  WAITLISTED: { cls: 'bg-purple-100 text-purple-800', label: 'En espera' },
  REJECTED: { cls: 'bg-red-100 text-red-800', label: 'Rechazado' },
  CANCELLED: { cls: 'bg-gray-100 text-gray-600', label: 'Cancelado' },
};

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    registrationService.myRegistrations().then(setRegistrations).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleCancel(eventId) {
    try {
      await registrationService.cancel(eventId);
      setRegistrations((prev) => prev.map((r) => (r.eventId === eventId ? { ...r, status: 'CANCELLED' } : r)));
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = registrations.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.event.name.toLowerCase().includes(q) || r.event.location.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64"><p className="text-gray-500">Cargando...</p></div>;
  }

  function CountBoxes({ reg }) {
    const counts = reg.eventCounts || {};
    const maxPlayers = counts.maxPlayers || reg.event.maxPlayers || 0;
    const active = counts.active || 0;
    const waitlisted = counts.waitlisted || 0;
    return (
      <div className="flex gap-2 items-center">
        <div className="text-center px-2.5 py-1.5 bg-blue-50 rounded-lg">
          <p className="text-base font-bold text-blue-700">{maxPlayers}</p>
          <p className="text-[9px] text-blue-500 uppercase font-medium">Cupos</p>
        </div>
        <div className="text-center px-2.5 py-1.5 bg-green-50 rounded-lg">
          <p className="text-base font-bold text-green-700">{active}</p>
          <p className="text-[9px] text-green-500 uppercase font-medium">Inscritos</p>
        </div>
        {waitlisted > 0 && (
          <div className="text-center px-2.5 py-1.5 bg-purple-50 rounded-lg">
            <p className="text-base font-bold text-purple-700">{waitlisted}</p>
            <p className="text-[9px] text-purple-500 uppercase font-medium">En cola</p>
          </div>
        )}
      </div>
    );
  }

  function StatusActions({ reg }) {
    const badge = STATUS_BADGE[reg.status] || STATUS_BADGE.CANCELLED;
    return (
      <div className="flex flex-col items-end gap-2">
        <span className={`text-xs px-2 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
        {['PENDING', 'CONFIRMED', 'WAITLISTED'].includes(reg.status) && (
          <button onClick={() => handleCancel(reg.eventId)} className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition">
            Cancelar
          </button>
        )}
      </div>
    );
  }

  function renderListItem(reg) {
    const isCancelled = reg.event.status === 'CANCELLED';
    return (
      <div key={reg.id} className={`bg-white rounded-xl shadow p-5 ${isCancelled ? 'border-l-4 border-red-400 opacity-75' : ''}`}>
        {isCancelled && (
          <div className="bg-red-50 text-red-700 text-xs px-3 py-1.5 rounded mb-3 font-medium">Evento cancelado por el organizador</div>
        )}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <Link to={`/events/${reg.event.id}`}
              className={`text-lg font-semibold hover:text-primary-800 ${isCancelled ? 'text-gray-500 line-through' : 'text-primary-700'}`}>
              {reg.event.name}
            </Link>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(reg.event.date).toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-sm text-gray-500">{reg.event.location}</p>
          </div>
          <CountBoxes reg={reg} />
          <StatusActions reg={reg} />
        </div>
      </div>
    );
  }

  function renderGridCard(reg) {
    const isCancelled = reg.event.status === 'CANCELLED';
    const counts = reg.eventCounts || {};
    const maxPlayers = counts.maxPlayers || reg.event.maxPlayers || 0;
    const active = counts.active || 0;
    const waitlisted = counts.waitlisted || 0;
    return (
      <div key={reg.id} className={`bg-white rounded-xl shadow p-5 flex flex-col justify-between ${isCancelled ? 'border-l-4 border-red-400 opacity-75' : ''}`}>
        {isCancelled && (
          <div className="bg-red-50 text-red-700 text-xs px-3 py-1.5 rounded mb-3 font-medium">Evento cancelado</div>
        )}
        <div>
          <Link to={`/events/${reg.event.id}`}
            className={`text-base font-semibold hover:text-primary-800 ${isCancelled ? 'text-gray-500 line-through' : 'text-primary-700'}`}>
            {reg.event.name}
          </Link>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(reg.event.date).toLocaleDateString('es', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-gray-500">{reg.event.location}</p>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <div className="flex gap-2 text-xs">
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">{maxPlayers} cupos</span>
            <span className="bg-green-50 text-green-700 px-2 py-1 rounded font-medium">{active} inscritos</span>
            {waitlisted > 0 && <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded font-medium">{waitlisted} cola</span>}
          </div>
          <StatusActions reg={reg} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-primary-700">Mis Inscripciones</h2>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Buscar evento..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 outline-none w-40" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 outline-none">
            <option value="">Estado</option>
            {Object.entries(STATUS_BADGE).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        <div className="flex bg-gray-200 rounded-lg p-0.5">
          <button onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`} title="Cuadrícula">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`} title="Lista">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-500">{registrations.length === 0 ? 'No tienes inscripciones' : 'Sin resultados con estos filtros'}</p>
          {registrations.length === 0 && (
            <Link to="/events" className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium">
              Ver eventos disponibles
            </Link>
          )}
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">{filtered.map(renderListItem)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{filtered.map(renderGridCard)}</div>
      )}
    </div>
  );
}
