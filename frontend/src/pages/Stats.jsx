import { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { statsService } from '../services/api';

export default function Stats() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetcher = isAdmin ? statsService.dashboard() : statsService.myStats();
    fetcher
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><p className="text-gray-500">Cargando...</p></div>;
  }

  if (!stats) {
    return <div className="max-w-4xl mx-auto py-8 px-4"><p className="text-red-500">Error cargando estadísticas</p></div>;
  }

  // Admin dashboard cards
  if (isAdmin) {
    const cards = [
      { label: 'Usuarios', value: stats.users, color: 'bg-blue-500' },
      { label: 'Eventos Totales', value: stats.events.total, color: 'bg-primary-500' },
      { label: 'Eventos Activos', value: stats.events.active, color: 'bg-green-500' },
      { label: 'Inscripciones', value: stats.registrations, color: 'bg-purple-500' },
      { label: 'Ingresos', value: `$${stats.revenue}`, color: 'bg-yellow-500' },
      { label: 'Solicitudes Pend.', value: stats.pendingRequests, color: 'bg-orange-500' },
      { label: 'Penalidades Activas', value: stats.activePenalties, color: 'bg-red-500' },
    ];

    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h2 className="text-2xl font-bold text-primary-700 mb-6">Estadísticas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl shadow p-6 text-center">
              <p className="text-3xl font-bold text-gray-800">{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
              <div className={`h-1 ${card.color} rounded-full mt-3`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // User personal stats
  const userCards = [
    { label: 'Eventos Inscritos', value: stats.events.total, color: 'bg-blue-500' },
    { label: 'Confirmados', value: stats.events.confirmed, color: 'bg-green-500' },
    { label: 'En Espera', value: stats.events.waitlisted, color: 'bg-purple-500' },
    { label: 'Pagos Realizados', value: stats.payments.total, color: 'bg-yellow-500' },
    { label: 'Total Pagado', value: `$${stats.payments.amount}`, color: 'bg-primary-500' },
    { label: 'Penalidades Activas', value: stats.activePenalties, color: 'bg-red-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold text-primary-700 mb-6">Mis Estadísticas</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {userCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-3xl font-bold text-gray-800">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            <div className={`h-1 ${card.color} rounded-full mt-3`} />
          </div>
        ))}
      </div>
    </div>
  );
}
