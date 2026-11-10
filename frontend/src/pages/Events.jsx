import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { getEventImage } from '../utils/eventImage';
import { eventService, userService, spaceService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, LayoutGrid, List, Plus, MapPin, Clock, Users, DollarSign,
  CalendarDays, XCircle, Archive, Ban, CheckSquare, Square, X,
} from 'lucide-react';

const CATEGORY_LABELS = {
  FUTBOL: 'Futbol', BASKETBALL: 'Basketball', BAILE: 'Baile',
  BOLOS: 'Bolos', REUNION: 'Reunion', OTRO: 'Otro',
};
const CATEGORY_COLORS = {
  FUTBOL: 'bg-emerald-100 text-emerald-700', BASKETBALL: 'bg-orange-100 text-orange-700',
  BAILE: 'bg-pink-100 text-pink-700', BOLOS: 'bg-indigo-100 text-indigo-700',
  REUNION: 'bg-teal-100 text-teal-700', OTRO: 'bg-slate-100 text-slate-700',
};
const STATUS_LABELS = {
  ACTIVE: 'Activo', COMPLETED: 'Completado', CANCELLED: 'Cancelado',
  ARCHIVED: 'Archivado', DRAFT: 'Borrador',
};
const STATUS_COLORS = {
  ACTIVE: 'bg-emerald-100 text-emerald-700', COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-700', ARCHIVED: 'bg-amber-100 text-amber-700',
  DRAFT: 'bg-slate-100 text-slate-600',
};

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [adminFilter, setAdminFilter] = useState('');
  const [spaceFilter, setSpaceFilter] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [spaces, setSpaces] = useState([]);

  // Selection
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [batchMsg, setBatchMsg] = useState('');

  // Admins list for filter (super admin only)
  const [admins, setAdmins] = useState([]);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    loadEvents();
    if (isSuperAdmin) {
      userService.listUsers().then(users => {
        setAdmins(users.filter(u => u.role === 'ADMIN'));
      }).catch(() => {});
      spaceService.list().then(setSpaces).catch(() => setSpaces([]));
    } else if (isAdmin) {
      spaceService.mySpaces().then(setSpaces).catch(() => setSpaces([]));
    }
  }, [categoryFilter]);

  function loadEvents() {
    const params = {};
    if (categoryFilter) params.category = categoryFilter;
    setLoading(true);
    eventService.list(params).then(setEvents).catch(console.error).finally(() => setLoading(false));
  }

  // Client-side filters
  const filtered = events.filter((ev) => {
    if (statusFilter && ev.status !== statusFilter) return false;
    if (adminFilter && ev.creator?.id !== parseInt(adminFilter)) return false;
    if (spaceFilter && ev.spaceId !== parseInt(spaceFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      return ev.name.toLowerCase().includes(q) || ev.location.toLowerCase().includes(q) || ev.creator.name.toLowerCase().includes(q);
    }
    return true;
  });

  const grouped = {};
  filtered.forEach((ev) => {
    const key = ev.creator.name;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ev);
  });

  // Selection helpers
  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(e => e.id)));
    }
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
    setBatchMsg('');
  }

  async function handleBatch(action) {
    if (selected.size === 0) return;
    const label = action === 'ARCHIVED' ? 'archivar' : 'cancelar';
    if (!confirm(`¿${label.charAt(0).toUpperCase() + label.slice(1)} ${selected.size} evento(s)?`)) return;
    try {
      const result = await eventService.batchAction([...selected], action);
      setBatchMsg(result.message);
      exitSelectMode();
      loadEvents();
    } catch (err) {
      setBatchMsg(err.error || 'Error en operacion');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  function renderBadges(event) {
    return (
      <div className="flex gap-1 flex-shrink-0 flex-wrap">
        {event.space?.name && (
          <span className="badge bg-violet-100 text-violet-700">
            {event.space.name}
          </span>
        )}
        <span className={`badge ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.OTRO}`}>
          {CATEGORY_LABELS[event.category] || event.category}
        </span>
        <span className={`badge ${event.type === 'PUBLIC' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {event.type === 'PUBLIC' ? 'Publico' : 'Privado'}
        </span>
        <span className={`badge ${STATUS_COLORS[event.status] || 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABELS[event.status] || event.status}
        </span>
      </div>
    );
  }

  function renderCheckbox(eventId) {
    if (!selectMode) return null;
    const isChecked = selected.has(eventId);
    return (
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSelect(eventId); }}
        className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
          isChecked ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 hover:border-primary-400'
        }`}
      >
        {isChecked && <CheckSquare size={14} />}
      </button>
    );
  }

  function renderGridCard(event, index) {
    return (
      <motion.div
        key={event.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="relative"
      >
        {selectMode && (
          <div className="absolute top-4 right-4 z-10">
            {renderCheckbox(event.id)}
          </div>
        )}
        <Link
          to={selectMode ? '#' : `/events/${event.id}`}
          onClick={selectMode ? (e) => { e.preventDefault(); toggleSelect(event.id); } : undefined}
          className={`block bg-white rounded-2xl shadow-md border border-gray-100 card-hover overflow-hidden ${
            event.status === 'CANCELLED' ? 'opacity-70 border-l-4 border-red-400' : ''
          } ${event.status === 'ARCHIVED' ? 'opacity-60 border-l-4 border-amber-400' : ''} ${
            selectMode && selected.has(event.id) ? 'ring-2 ring-primary-400' : ''
          }`}
          style={event.isPastEvent && event.hoursUntilHide != null ? {
            opacity: Math.max(0.35, event.hoursUntilHide / 8),
            filter: `grayscale(${Math.round((1 - event.hoursUntilHide / 8) * 60)}%)`,
          } : undefined}
        >
          <div className="h-32 bg-gray-100 overflow-hidden relative">
            <img src={getEventImage(event)} alt="" className="w-full h-full object-cover" />
            {event.status === 'CANCELLED' && <div className="absolute inset-0 bg-red-900/40" />}
          </div>
          <div className="p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-bold ${event.status === 'CANCELLED' ? 'text-gray-400 line-through' : event.isPastEvent ? 'text-gray-500' : 'text-gray-800'}`}>{event.name}</h3>
                {event.isPastEvent && <span className="badge bg-gray-200 text-gray-500">Finalizado</span>}
              </div>
            </div>
            {renderBadges(event)}
            {event.status === 'CANCELLED' && (
              <div className="flex items-center gap-1.5 bg-red-50 text-red-600 text-xs px-3 py-1.5 rounded-lg mt-3 font-medium">
                <XCircle size={12} /> Cancelado
              </div>
            )}
            {event.description && <p className="text-gray-400 text-sm mt-3 line-clamp-2">{event.description}</p>}
            <div className="space-y-2 text-sm text-gray-500 mt-4">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400" />
                {new Date(event.date).toLocaleDateString('es', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-400" />
                <span className="truncate">{event.location}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-400" />
                  <span className="font-medium text-gray-700">{event._count.registrations}/{event.maxPlayers}</span>
                </div>
                {parseFloat(event.price) > 0 && (
                  <div className="flex items-center gap-1">
                    <DollarSign size={14} className="text-gray-400" />
                    <span className="font-bold text-gray-700">{event.price}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[8px] text-white font-bold">
                {event.creator.name?.charAt(0)}
              </div>
              <span className="text-xs text-gray-400">{event.creator.name}</span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  function renderListRow(event, index) {
    return (
      <motion.div
        key={event.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
      >
        <Link
          to={selectMode ? '#' : `/events/${event.id}`}
          onClick={selectMode ? (e) => { e.preventDefault(); toggleSelect(event.id); } : undefined}
          className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 flex items-center gap-4 px-5 py-4 ${
            event.status === 'CANCELLED' ? 'opacity-70 border-l-4 border-red-400' : ''
          } ${event.status === 'ARCHIVED' ? 'opacity-60 border-l-4 border-amber-400' : ''} ${
            selectMode && selected.has(event.id) ? 'ring-2 ring-primary-400' : ''
          }`}
          style={event.isPastEvent && event.hoursUntilHide != null ? {
            opacity: Math.max(0.35, event.hoursUntilHide / 8),
            filter: `grayscale(${Math.round((1 - event.hoursUntilHide / 8) * 60)}%)`,
          } : undefined}
        >
          {renderCheckbox(event.id)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className={`font-semibold truncate ${event.status === 'CANCELLED' ? 'text-gray-400 line-through' : event.isPastEvent ? 'text-gray-500' : 'text-gray-800'}`}>{event.name}</h3>
              {event.isPastEvent && <span className="badge bg-gray-200 text-gray-500">Finalizado</span>}
              {renderBadges(event)}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
              <span className="flex items-center gap-1"><Clock size={12} /> {new Date(event.date).toLocaleDateString('es', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
              <span className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[7px] text-white font-bold">
                  {event.creator.name?.charAt(0)}
                </div>
                {event.creator.name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-5 flex-shrink-0">
            <div className="text-center">
              <p className="text-sm font-bold text-gray-700">{event._count.registrations}/{event.maxPlayers}</p>
              <p className="text-[10px] text-gray-400 uppercase">Cupos</p>
            </div>
            {parseFloat(event.price) > 0 && (
              <div className="text-center">
                <p className="text-sm font-bold text-primary-600">${event.price}</p>
                <p className="text-[10px] text-gray-400 uppercase">Precio</p>
              </div>
            )}
          </div>
        </Link>
      </motion.div>
    );
  }

  const renderEvents = (evts) =>
    viewMode === 'grid'
      ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{evts.map((e, i) => renderGridCard(e, i))}</div>
      : <div className="space-y-2">{evts.map((e, i) => renderListRow(e, i))}</div>;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Eventos</h2>
          <p className="text-sm text-gray-400 mt-0.5">{filtered.length} evento{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && !selectMode && (
            <button
              onClick={() => setSelectMode(true)}
              className="btn-secondary !text-sm flex items-center gap-1.5"
            >
              <Square size={14} /> Seleccionar
            </button>
          )}
          {isAdmin && (
            <Link to="/events/new" className="btn-primary inline-flex items-center gap-2 text-sm">
              <Plus size={16} /> Crear Evento
            </Link>
          )}
        </div>
      </div>

      {/* Batch message */}
      {batchMsg && (
        <div className="bg-green-50 text-green-700 p-3 rounded-xl mb-4 text-sm border border-green-100 flex justify-between items-center">
          {batchMsg}
          <button onClick={() => setBatchMsg('')} className="text-green-500 hover:text-green-700"><X size={14} /></button>
        </div>
      )}

      {/* Selection toolbar */}
      {selectMode && (
        <div className="glass rounded-2xl p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={selectAll} className="btn-secondary !text-xs !px-3 !py-1.5 flex items-center gap-1">
              {selected.size === filtered.length ? <CheckSquare size={14} /> : <Square size={14} />}
              {selected.size === filtered.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </button>
            <span className="text-sm text-gray-500">
              {selected.size} seleccionado{selected.size !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBatch('ARCHIVED')}
              disabled={selected.size === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition disabled:opacity-40"
            >
              <Archive size={14} /> Archivar
            </button>
            <button
              onClick={() => handleBatch('CANCELLED')}
              disabled={selected.size === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition disabled:opacity-40"
            >
              <Ban size={14} /> Cancelar
            </button>
            <button onClick={exitSelectMode} className="btn-secondary !text-xs !px-3 !py-1.5 flex items-center gap-1">
              <X size={14} /> Salir
            </button>
          </div>
        </div>
      )}

      {/* Filters bar */}
      <div className="glass rounded-2xl p-4 mb-6 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre, lugar u organizador..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="input-modern !pl-10" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-modern !w-auto">
          <option value="">Categoria</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        {isAdmin && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-modern !w-auto">
            <option value="">Estado</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        )}
        {/* Space filter */}
        {isAdmin && spaces.length > 0 && (
          <select value={spaceFilter} onChange={(e) => setSpaceFilter(e.target.value)} className="input-modern !w-auto">
            <option value="">Espacio</option>
            {spaces.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
        {/* Admin filter - Super Admin only */}
        {isSuperAdmin && admins.length > 0 && (
          <select value={adminFilter} onChange={(e) => setAdminFilter(e.target.value)} className="input-modern !w-auto">
            <option value="">Todos los admins</option>
            {admins.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <LayoutGrid size={18} />
          </button>
          <button onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-md p-12 text-center border border-gray-100">
            <CalendarDays size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 text-lg">No hay eventos disponibles</p>
            <p className="text-gray-300 text-sm mt-1">Intenta cambiar los filtros de busqueda</p>
          </motion.div>
        ) : isAdmin ? (
          <div className="space-y-8">
            {Object.entries(grouped).map(([creatorName, evts]) => (
              <div key={creatorName}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[10px] text-white font-bold">
                    {creatorName.charAt(0)}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600">
                    {creatorName}
                    <span className="text-xs font-normal text-gray-400 ml-2">({evts.length} eventos)</span>
                  </h3>
                </div>
                {renderEvents(evts)}
              </div>
            ))}
          </div>
        ) : (
          renderEvents(filtered)
        )}
      </AnimatePresence>
    </div>
  );
}
