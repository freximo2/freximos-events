import { useState, useEffect } from 'react';
import { clientService } from '../services/api';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', address: '', notes: '' });
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  function loadClients() {
    clientService.list().then(setClients).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { loadClients(); }, []);

  function resetForm() {
    setForm({ name: '', company: '', email: '', phone: '', address: '', notes: '' });
    setEditId(null);
    setShowForm(false);
    setError('');
  }

  function handleEdit(client) {
    setForm({
      name: client.name,
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      notes: client.notes || '',
    });
    setEditId(client.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        await clientService.update(editId, form);
      } else {
        await clientService.create(form);
      }
      resetForm();
      loadClients();
    } catch (err) {
      setError(err.error || 'Error guardando cliente');
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      await clientService.remove(id);
      loadClients();
    } catch (err) {
      console.error(err);
    }
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none';

  if (loading) {
    return <div className="flex justify-center items-center h-64"><p className="text-gray-500">Cargando...</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-primary-700">Clientes</h2>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 outline-none w-44" />
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
            {showForm ? 'Cancelar' : '+ Nuevo'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputClass} />
          </div>
          <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition">
            {editId ? 'Actualizar' : 'Crear'}
          </button>
        </form>
      )}

      {(() => {
        const filteredClients = clients.filter((c) => {
          if (!search) return true;
          const q = search.toLowerCase();
          return c.name.toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);
        });
        return filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-500">{clients.length === 0 ? 'No hay clientes registrados' : 'Sin resultados'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-gray-600">Nombre</th>
                <th className="px-6 py-3 text-left text-gray-600">Empresa</th>
                <th className="px-6 py-3 text-left text-gray-600">Email</th>
                <th className="px-6 py-3 text-left text-gray-600">Teléfono</th>
                <th className="px-6 py-3 text-left text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredClients.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{c.name}</td>
                  <td className="px-6 py-3 text-gray-500">{c.company || '-'}</td>
                  <td className="px-6 py-3 text-gray-500">{c.email || '-'}</td>
                  <td className="px-6 py-3 text-gray-500">{c.phone || '-'}</td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(c)} className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600">Editar</button>
                      <button onClick={() => handleDelete(c.id)} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      })()}
    </div>
  );
}
