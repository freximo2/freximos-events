import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { paymentService } from '../services/api';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    paymentService.myPayments().then(setPayments).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = payments.filter((p) => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (typeFilter && p.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.event.name.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64"><p className="text-gray-500">Cargando...</p></div>;
  }

  const selectClass = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 outline-none';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-primary-700">Mis Pagos</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Buscar evento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${selectClass} w-40`}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
            <option value="">Estado</option>
            <option value="COMPLETED">Completado</option>
            <option value="PENDING">Pendiente</option>
            <option value="REFUNDED">Reembolsado</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass}>
            <option value="">Tipo</option>
            <option value="FULL">Completo</option>
            <option value="ADVANCE">Adelanto</option>
            <option value="CUSTOM">Personalizado</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-500">{payments.length === 0 ? 'No tienes pagos registrados' : 'No hay resultados con estos filtros'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-gray-600">Evento</th>
                <th className="px-6 py-3 text-left text-gray-600">Monto</th>
                <th className="px-6 py-3 text-left text-gray-600">Tipo</th>
                <th className="px-6 py-3 text-left text-gray-600">Estado</th>
                <th className="px-6 py-3 text-left text-gray-600">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <Link to={`/events/${p.event.id}`} className="text-primary-600 hover:underline">{p.event.name}</Link>
                  </td>
                  <td className="px-6 py-3 font-medium">${p.amount}</td>
                  <td className="px-6 py-3">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {p.type === 'ADVANCE' ? 'Adelanto' : p.type === 'CUSTOM' ? 'Personalizado' : 'Completo'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      p.status === 'COMPLETED' ? 'bg-green-100 text-green-800'
                        : p.status === 'REFUNDED' ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {p.status === 'COMPLETED' ? 'Completado' : p.status === 'REFUNDED' ? 'Reembolsado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{new Date(p.createdAt).toLocaleDateString('es')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
