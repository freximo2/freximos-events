import { useState, useEffect } from 'react';
import { sponsorService } from '../services/api';

export default function Sponsors() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', contactName: '', email: '', phone: '', website: '' });
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  function loadSponsors() {
    sponsorService.list().then(setSponsors).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { loadSponsors(); }, []);

  function resetForm() {
    setForm({ name: '', contactName: '', email: '', phone: '', website: '' });
    setEditId(null);
    setShowForm(false);
    setError('');
  }

  function handleEdit(sponsor) {
    setForm({
      name: sponsor.name,
      contactName: sponsor.contactName || '',
      email: sponsor.email || '',
      phone: sponsor.phone || '',
      website: sponsor.website || '',
    });
    setEditId(sponsor.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        await sponsorService.update(editId, form);
      } else {
        await sponsorService.create(form);
      }
      resetForm();
      loadSponsors();
    } catch (err) {
      setError(err.error || 'Error guardando patrocinador');
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este patrocinador?')) return;
    try {
      await sponsorService.remove(id);
      loadSponsors();
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
        <h2 className="text-2xl font-bold text-primary-700">Patrocinadores</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
              <input type="text" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className={inputClass} />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
              <input type="text" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputClass} />
            </div>
          </div>
          <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition">
            {editId ? 'Actualizar' : 'Crear'}
          </button>
        </form>
      )}

      {(() => {
        const filteredSponsors = sponsors.filter((s) => {
          if (!search) return true;
          const q = search.toLowerCase();
          return s.name.toLowerCase().includes(q) || (s.contactName || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
        });
        return filteredSponsors.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-500">{sponsors.length === 0 ? 'No hay patrocinadores registrados' : 'Sin resultados'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-gray-600">Nombre</th>
                <th className="px-6 py-3 text-left text-gray-600">Contacto</th>
                <th className="px-6 py-3 text-left text-gray-600">Email</th>
                <th className="px-6 py-3 text-left text-gray-600">Eventos</th>
                <th className="px-6 py-3 text-left text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSponsors.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{s.name}</td>
                  <td className="px-6 py-3 text-gray-500">{s.contactName || '-'}</td>
                  <td className="px-6 py-3 text-gray-500">{s.email || '-'}</td>
                  <td className="px-6 py-3">{s._count.events}</td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(s)} className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600">Editar</button>
                      <button onClick={() => handleDelete(s.id)} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Eliminar</button>
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
