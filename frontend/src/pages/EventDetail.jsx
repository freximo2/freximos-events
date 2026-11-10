import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { eventService, registrationService, templateService } from '../services/api';
import LocationMap from '../components/LocationMap';
import { getEventImage } from '../utils/eventImage';

const CATEGORY_LABELS = {
  FUTBOL: 'Fútbol',
  BASKETBALL: 'Basketball',
  BAILE: 'Baile',
  BOLOS: 'Bolos',
  REUNION: 'Reunión',
  OTRO: 'Otro',
};

const CATEGORY_COLORS = {
  FUTBOL: 'bg-green-100 text-green-800',
  BASKETBALL: 'bg-orange-100 text-orange-800',
  BAILE: 'bg-pink-100 text-pink-800',
  BOLOS: 'bg-indigo-100 text-indigo-800',
  REUNION: 'bg-teal-100 text-teal-800',
  OTRO: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS = {
  ACTIVE: 'Activo',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  ARCHIVED: 'Archivado',
  DRAFT: 'Borrador',
};

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-800',
  ARCHIVED: 'bg-amber-100 text-amber-800',
  DRAFT: 'bg-slate-100 text-slate-600',
};

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [waitlistPosition, setWaitlistPosition] = useState(null);
  const [penaltyInfo, setPenaltyInfo] = useState(null);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const canEditDelete = isSuperAdmin || (user?.role === 'ADMIN' && event?.creatorId === user?.id);

  function loadEvent() {
    eventService
      .getById(id)
      .then((data) => {
        setEvent(data);
        const myReg = data.registrations?.find((r) => r.userId === user?.id);
        if (myReg?.status === 'WAITLISTED') {
          registrationService
            .getWaitlistPosition(id)
            .then((pos) => setWaitlistPosition(pos.position))
            .catch(() => {});
        } else {
          setWaitlistPosition(null);
        }
      })
      .catch((err) => setError(err.error || 'Error cargando evento'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadEvent();
    registrationService.checkPenalty()
      .then(setPenaltyInfo)
      .catch(() => setPenaltyInfo(null));
  }, [id]);

  const myRegistration = event?.registrations?.find((r) => r.userId === user?.id);
  const isRegistered = myRegistration && !['CANCELLED', 'REJECTED'].includes(myRegistration.status);
  const isWaitlisted = myRegistration?.status === 'WAITLISTED';
  const confirmedCount = event?.registrations?.filter(
    (r) => r.status === 'PENDING' || r.status === 'CONFIRMED'
  ).length;
  const isFull = confirmedCount >= event?.maxPlayers;

  async function handleRegister() {
    setActionLoading(true);
    try {
      await registrationService.register(id);
      loadEvent();
    } catch (err) {
      setError(err.error || 'Error al inscribirse');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelRegistration() {
    setActionLoading(true);
    try {
      await registrationService.cancel(id);
      loadEvent();
    } catch (err) {
      setError(err.error || 'Error al cancelar inscripción');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdateRegStatus(regId, status) {
    let reason = '';
    if (status === 'REJECTED') {
      reason = prompt('Motivo del rechazo (opcional):');
      if (reason === null) return; // cancelled prompt
    }
    try {
      await registrationService.updateStatus(regId, status, reason);
      loadEvent();
    } catch (err) {
      setError(err.error || 'Error actualizando inscripción');
    }
  }

  async function handleDemoteToWaitlist(regId) {
    try {
      await registrationService.demoteToWaitlist(regId);
      loadEvent();
    } catch (err) {
      setError(err.error || 'Error al mover a cola de espera');
    }
  }

  async function handleCancelEvent() {
    if (!confirm('¿Estás seguro de CANCELAR este evento? Se notificará a todos los inscritos.')) return;
    setActionLoading(true);
    try {
      await eventService.cancel(id);
      loadEvent();
    } catch (err) {
      setError(err.error || 'Error cancelando evento');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleArchiveEvent() {
    if (!confirm('¿Archivar este evento? No sera visible para los usuarios.')) return;
    try {
      await eventService.remove(id);
      navigate('/events');
    } catch (err) {
      setError(err.error || 'Error archivando evento');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      {/* Cancelled banner */}
      {event.status === 'CANCELLED' && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-4 text-center">
          <p className="font-bold text-lg">Evento Cancelado</p>
          <p className="text-sm mt-1">Este evento ha sido cancelado por el organizador.</p>
        </div>
      )}

      {/* Archived banner */}
      {event.status === 'ARCHIVED' && isAdmin && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-4 text-center">
          <p className="font-bold text-lg">Evento Archivado</p>
          <p className="text-sm mt-1">Este evento ya pasó su fecha y fue archivado automáticamente.</p>
        </div>
      )}

      <div className={`bg-white rounded-xl shadow overflow-hidden mb-6 ${event.status === 'CANCELLED' ? 'border-l-4 border-red-400' : ''}`}>
        {/* Event image */}
        <div className="h-48 bg-gray-100 relative overflow-hidden">
          <img src={getEventImage(event)} alt={event.name} className="w-full h-full object-cover" />
          {event.status === 'CANCELLED' && <div className="absolute inset-0 bg-red-900/40" />}
        </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className={`text-2xl font-bold ${event.status === 'CANCELLED' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
              {event.name}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Creado por {event.creator.name}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {event.space?.name && (
              <span className="text-xs px-2 py-1 rounded-full bg-violet-100 text-violet-800">
                {event.space.name}
              </span>
            )}
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                CATEGORY_COLORS[event.category] || CATEGORY_COLORS.OTRO
              }`}
            >
              {CATEGORY_LABELS[event.category] || event.category}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                event.type === 'PUBLIC'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {event.type === 'PUBLIC' ? 'Público' : 'Privado'}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                STATUS_COLORS[event.status] || 'bg-gray-100 text-gray-600'
              }`}
            >
              {STATUS_LABELS[event.status] || event.status}
            </span>
          </div>
        </div>

        {event.description && (
          <p className="text-gray-600 mb-4">{event.description}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-400 uppercase">Fecha</p>
            <p className="font-medium text-gray-700">
              {new Date(event.date).toLocaleDateString('es', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-400 uppercase">Lugar</p>
            <p className="font-medium text-gray-700">{event.location}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-400 uppercase">Participantes</p>
            <p className="font-medium text-gray-700">
              {confirmedCount}/{event.maxPlayers}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-400 uppercase">Precio</p>
            <p className="font-medium text-gray-700">
              {parseFloat(event.price) > 0 ? `$${event.price}` : 'Gratis'}
            </p>
          </div>
        </div>

        {/* Map */}
        {event.latitude && event.longitude && (
          <div className="mb-6">
            <p className="text-xs text-gray-400 uppercase mb-2">Ubicacion en el mapa</p>
            <LocationMap
              latitude={event.latitude}
              longitude={event.longitude}
              location={event.location}
            />
          </div>
        )}

        {/* Penalty warning */}
        {penaltyInfo && penaltyInfo.penalized && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-4">
            <p className="font-semibold">Tienes una penalizacion activa</p>
            <p className="text-sm mt-1">
              No puedes inscribirte a eventos hasta el{' '}
              {new Date(penaltyInfo.penalizedUntil).toLocaleDateString('es', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* User actions - only on ACTIVE events */}
        {event.status === 'ACTIVE' && (
          <div className="flex gap-3 items-center flex-wrap">
            {!isRegistered && (
              <button
                onClick={handleRegister}
                disabled={actionLoading}
                className={`text-white px-6 py-2 rounded-lg transition disabled:opacity-50 ${
                  isFull
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {actionLoading
                  ? 'Procesando...'
                  : isFull
                  ? 'Unirme a lista de espera'
                  : 'Inscribirme'}
              </button>
            )}
            {isWaitlisted && (
              <div className="flex items-center gap-3">
                <span className="text-purple-600 font-medium">
                  En lista de espera{waitlistPosition ? ` (posición #${waitlistPosition})` : ''}
                </span>
                <button
                  onClick={handleCancelRegistration}
                  disabled={actionLoading}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition disabled:opacity-50 text-sm"
                >
                  Salir de lista
                </button>
              </div>
            )}
            {isRegistered && !isWaitlisted && (
              <button
                onClick={handleCancelRegistration}
                disabled={actionLoading}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              >
                {actionLoading ? 'Procesando...' : 'Cancelar Inscripción'}
              </button>
            )}
            {canEditDelete && (
              <>
                <Link
                  to={`/events/${id}/edit`}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
                >
                  Editar
                </Link>
                <button
                  onClick={async () => {
                    const name = prompt('Nombre de la plantilla:', `Plantilla: ${event.name}`);
                    if (name) {
                      try {
                        await templateService.createFromEvent(event.id, name);
                        setError('');
                        alert('Plantilla guardada. La encontraras al crear un nuevo evento.');
                      } catch (err) { setError(err.error || 'Error guardando plantilla'); }
                    }
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
                >
                  Guardar plantilla
                </button>
                <button
                  onClick={handleCancelEvent}
                  disabled={actionLoading}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
                >
                  Cancelar Evento
                </button>
                <button
                  onClick={handleArchiveEvent}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  Archivar
                </button>
              </>
            )}
          </div>
        )}

        {/* Admin actions on cancelled/archived events */}
        {canEditDelete && (event.status === 'CANCELLED' || event.status === 'ARCHIVED') && (
          <div className="flex gap-3 items-center mt-4 pt-4 border-t">
            <button
              onClick={handleArchiveEvent}
              className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition text-sm"
            >
              Archivar
            </button>
          </div>
        )}
      </div>
      </div>

      {/* Participants info visible to ALL users */}
      {event.status !== 'CANCELLED' && (
        <div className="bg-white rounded-xl shadow overflow-hidden mb-4">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Participantes</h3>
            <span className="text-sm text-gray-500">
              {confirmedCount}/{event.maxPlayers} cupos ocupados
            </span>
          </div>

          {/* Confirmed/Pending participants */}
          <div className="px-6 py-4">
            <p className="text-xs text-gray-400 uppercase font-medium mb-3">
              Inscritos ({confirmedCount})
            </p>
            {event.registrations
              .filter((r) => ['PENDING', 'CONFIRMED'].includes(r.status))
              .map((reg, idx) => (
                <div key={reg.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-700 font-medium">{reg.user.name}</span>
                  {/* Only admin sees status badge */}
                  {isAdmin && (
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      reg.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {reg.status === 'CONFIRMED' ? 'Confirmado' : 'Pendiente'}
                    </span>
                  )}
                </div>
              ))}
            {confirmedCount === 0 && (
              <p className="text-sm text-gray-400 py-2">Aún no hay inscritos.</p>
            )}
          </div>

          {/* Waitlist */}
          {event.registrations.filter((r) => r.status === 'WAITLISTED').length > 0 && (
            <div className="px-6 py-4 bg-purple-50 border-t">
              <p className="text-xs text-purple-600 uppercase font-medium mb-3">
                Lista de espera ({event.registrations.filter((r) => r.status === 'WAITLISTED').length})
              </p>
              {event.registrations
                .filter((r) => r.status === 'WAITLISTED')
                .map((reg, idx) => (
                  <div key={reg.id} className="flex items-center gap-3 py-2 border-b border-purple-100 last:border-0">
                    <span className="w-6 h-6 rounded-full bg-purple-200 text-purple-700 text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-700">{reg.user.name}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Admin management table */}
      {isAdmin && event.registrations.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold text-gray-800">
              Gestión de inscripciones ({event.registrations.length})
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-gray-600">Participante</th>
                <th className="px-6 py-3 text-left text-gray-600">Email</th>
                <th className="px-6 py-3 text-left text-gray-600">Estado</th>
                <th className="px-6 py-3 text-left text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {event.registrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{reg.user.name}</td>
                  <td className="px-6 py-3 text-gray-500">{reg.user.email}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      reg.status === 'CONFIRMED' ? 'bg-green-100 text-green-800'
                      : reg.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800'
                      : reg.status === 'WAITLISTED' ? 'bg-purple-100 text-purple-800'
                      : reg.status === 'REJECTED' ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-600'
                    }`}>
                      {reg.status === 'CONFIRMED' ? 'Confirmado'
                        : reg.status === 'PENDING' ? 'Pendiente'
                        : reg.status === 'WAITLISTED' ? 'En espera'
                        : reg.status === 'REJECTED' ? 'Rechazado'
                        : 'Cancelado'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {event.status === 'ACTIVE' && reg.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateRegStatus(reg.id, 'CONFIRMED')}
                            className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                          >
                            Aceptar
                          </button>
                          <button
                            onClick={() => handleUpdateRegStatus(reg.id, 'REJECTED')}
                            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                      {isSuperAdmin && event.status === 'ACTIVE' && ['PENDING', 'CONFIRMED'].includes(reg.status) && (
                        <button
                          onClick={() => handleDemoteToWaitlist(reg.id)}
                          className="text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
                        >
                          A cola
                        </button>
                      )}
                      {isAdmin && reg.status !== 'CANCELLED' && (
                        <button
                          onClick={async () => {
                            const reason = prompt('Motivo de la remocion (opcional):');
                            if (reason === null) return;
                            try {
                              await registrationService.removeFromEvent(reg.id, reason);
                              loadEvent();
                            } catch (err) {
                              setError(err.error || 'Error removiendo');
                            }
                          }}
                          className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
