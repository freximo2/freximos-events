import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { eventService, spaceService, groupService, templateService } from '../services/api';
import LocationPicker from '../components/LocationPicker';
import { getEventImage } from '../utils/eventImage';
import { FileText, ChevronDown, Search, UserPlus, X, ImagePlus } from 'lucide-react';

const CATEGORY_LABELS = {
  FUTBOL: 'Futbol',
  BASKETBALL: 'Basketball',
  BAILE: 'Baile',
  BOLOS: 'Bolos',
  REUNION: 'Reunion',
  OTRO: 'Otro',
};

export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'PUBLIC',
    category: 'FUTBOL',
    spaceId: '',
    date: '',
    endDate: '',
    location: '',
    latitude: null,
    longitude: null,
    maxPlayers: 10,
    price: '',
    targetGroupIds: [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [spaces, setSpaces] = useState([]);
  const [groups, setGroups] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  // User invite for private events
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    async function loadData() {
      // Load spaces, templates, groups in parallel
      const [spaceList, templateList, groupList] = await Promise.all([
        (isSuperAdmin ? spaceService.list() : spaceService.mySpaces()).catch(() => []),
        templateService.list().catch(() => []),
        groupService.list().catch(() => []),
      ]);

      setSpaces(spaceList || []);
      setTemplates(templateList || []);
      setGroups(groupList || []);

      if (isEdit) {
        // Load event data and populate form
        try {
          const event = await eventService.getById(id);
          setForm({
            name: event.name,
            description: event.description || '',
            type: event.type,
            category: event.category || 'FUTBOL',
            spaceId: event.spaceId || '',
            date: event.date ? event.date.slice(0, 16) : '',
            endDate: event.endDate ? event.endDate.slice(0, 16) : '',
            location: event.location || '',
            latitude: event.latitude || null,
            longitude: event.longitude || null,
            maxPlayers: event.maxPlayers,
            price: parseFloat(event.price) || '',
            targetGroupIds: [],
          });
          // Set image preview if event has custom image
          if (event.image) setImagePreview(event.image);
        } catch (err) {
          setError('Error cargando evento');
        }
      } else {
        // New event: set default space (always set first available space for ADMIN)
        if (spaceList && spaceList.length > 0) {
          setForm((prev) => ({
            ...prev,
            spaceId: spaceList[0].id,
            category: spaceList[0].category,
          }));
        }
      }
    }

    loadData();
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSpaceChange(e) {
    const spaceId = e.target.value;
    const selected = spaces.find((s) => s.id === parseInt(spaceId));
    setForm((prev) => ({
      ...prev,
      spaceId: spaceId ? parseInt(spaceId) : '',
      category: selected ? selected.category : prev.category,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Client-side guard: ADMIN must have a space selected
    if (user?.role === 'ADMIN' && !form.spaceId) {
      setError('Debes seleccionar un espacio');
      return;
    }

    // Client-side guard: location must be set
    if (!form.location || form.location.trim() === '') {
      setError('La ubicación es requerida');
      return;
    }

    setLoading(true);

    try {
      const data = {
        ...form,
        spaceId: form.spaceId ? parseInt(form.spaceId) : null,
        maxPlayers: parseInt(form.maxPlayers),
        price: parseFloat(form.price) || 0,
        targetGroupIds: form.type === 'PRIVATE' ? form.targetGroupIds : [],
        targetUserIds: form.type === 'PRIVATE' ? invitedUsers.map((u) => u.id) : [],
      };

      if (isEdit) {
        await eventService.update(id, data);
      } else {
        const created = await eventService.create(data);
        // Upload image if selected
        if (imageFile && created.id) {
          await eventService.uploadImage(created.id, imageFile);
        }
        // Save as template if checked
        if (saveAsTemplate && templateName.trim()) {
          await templateService.createFromEvent(created.id, templateName.trim());
        }
      }
      navigate('/events');
    } catch (err) {
      setError(err.error || err.errors?.[0]?.msg || 'Error guardando evento');
    } finally {
      setLoading(false);
    }
  }

  // Search users for private event invitation
  let searchTimer = null;
  function handleUserSearch(value) {
    setUserSearch(value);
    clearTimeout(searchTimer);
    if (value.length < 2) {
      setUserResults([]);
      return;
    }
    setSearchingUsers(true);
    searchTimer = setTimeout(async () => {
      try {
        const results = await groupService.searchUsers(value);
        setUserResults(results.filter((u) => !invitedUsers.some((inv) => inv.id === u.id)));
      } catch {
        setUserResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 400);
  }

  function addInvitedUser(u) {
    setInvitedUsers((prev) => [...prev, u]);
    setUserResults([]);
    setUserSearch('');
  }

  function removeInvitedUser(userId) {
    setInvitedUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  function applyTemplate(template) {
    setForm((prev) => ({
      ...prev,
      name: template.name,
      description: template.description || '',
      type: template.type,
      category: template.category,
      location: template.location || '',
      latitude: template.latitude || null,
      longitude: template.longitude || null,
      maxPlayers: template.maxPlayers,
      price: template.price,
    }));
    setShowTemplates(false);
  }

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none';

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primary-700">
          {isEdit ? 'Editar Evento' : 'Crear Evento'}
        </h2>
        {!isEdit && templates.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTemplates(!showTemplates)}
              className="btn-secondary !text-sm flex items-center gap-2"
            >
              <FileText size={16} /> Usar plantilla <ChevronDown size={14} />
            </button>
            {showTemplates && (
              <div className="absolute right-0 z-50 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="w-full text-left px-4 py-3 hover:bg-primary-50 border-b last:border-0 transition"
                  >
                    <p className="font-medium text-gray-800 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t.category} - {t.type === 'PUBLIC' ? 'Publico' : 'Privado'} - {t.maxPlayers} cupos
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del evento *
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
              <option value="PUBLIC">Público</option>
              <option value="PRIVATE">Privado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Espacio *</label>
            <select value={form.spaceId} onChange={handleSpaceChange} className={inputClass}>
              {isSuperAdmin && <option value="">Sin espacio</option>}
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {form.spaceId && (
          <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600">
            Categoria:{' '}
            <span className="font-medium">{CATEGORY_LABELS[form.category] || form.category}</span>
            <span className="text-xs text-gray-400 ml-2">(definida por el espacio)</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cupo máximo *
          </label>
          <input
            type="number"
            name="maxPlayers"
            value={form.maxPlayers}
            onChange={handleChange}
            min={2}
            required
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha inicio *
            </label>
            <input
              type="datetime-local"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
            <input
              type="datetime-local"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ubicacion *</label>
          <LocationPicker
            location={form.location}
            latitude={form.latitude}
            longitude={form.longitude}
            onLocationChange={(loc, lat, lng) => {
              setForm((prev) => ({ ...prev, location: loc, latitude: lat, longitude: lng }));
            }}
          />
          <input type="hidden" name="location" value={form.location} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
          <input
            type="text"
            inputMode="decimal"
            name="price"
            value={form.price === 0 || form.price === '0' ? '' : form.price}
            onChange={(e) => {
              const val = e.target.value;
              // Allow empty, digits, and one decimal point
              if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                setForm((prev) => ({ ...prev, price: val }));
              }
            }}
            onBlur={() => {
              // Format on blur: empty → 0
              const num = parseFloat(form.price) || 0;
              setForm((prev) => ({ ...prev, price: num }));
            }}
            placeholder="0.00"
            className={inputClass}
          />
        </div>

        {/* Event image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del evento</label>
          <div className="flex items-start gap-4">
            <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
              <img
                src={imagePreview || getEventImage({ category: form.category })}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition text-sm text-gray-600">
                <ImagePlus size={16} />
                {imageFile ? imageFile.name : 'Subir imagen'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
              <p className="text-xs text-gray-400 mt-1">
                {imageFile
                  ? 'Imagen seleccionada'
                  : `Sin imagen se usara la de ${form.category || 'la categoria'}`}
              </p>
            </div>
          </div>
        </div>

        {/* Private event: invite groups + individual users */}
        {form.type === 'PRIVATE' && (
          <div className="space-y-4 bg-gray-50 rounded-xl p-5 border border-gray-200">
            <p className="text-sm font-medium text-gray-700">Invitar a evento privado</p>

            {/* Groups */}
            {groups.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                  Grupos
                </label>
                <div className="space-y-2">
                  {groups.map((group) => (
                    <label
                      key={group.id}
                      className="flex items-center gap-3 cursor-pointer bg-white rounded-lg px-3 py-2 border border-gray-100 hover:border-primary-200 transition"
                    >
                      <input
                        type="checkbox"
                        checked={form.targetGroupIds.includes(group.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm((prev) => ({
                              ...prev,
                              targetGroupIds: [...prev.targetGroupIds, group.id],
                            }));
                          } else {
                            setForm((prev) => ({
                              ...prev,
                              targetGroupIds: prev.targetGroupIds.filter((gid) => gid !== group.id),
                            }));
                          }
                        }}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-400"
                      />
                      <span className="text-sm text-gray-700 font-medium">{group.name}</span>
                      <span className="text-xs text-gray-400">
                        ({group.members?.length || 0} miembros)
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Individual users search */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Buscar usuarios
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  placeholder="Nombre o email del usuario..."
                  className="input-modern !pl-9 !py-2 !text-sm"
                />
                {userResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-40 overflow-y-auto">
                    {userResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => addInvitedUser(u)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 border-b last:border-0 flex items-center gap-2"
                      >
                        <UserPlus size={14} className="text-primary-500" />
                        <span className="font-medium">{u.name}</span>
                        <span className="text-xs text-gray-400">{u.email}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchingUsers && (
                  <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-lg border p-3 text-xs text-gray-400 text-center">
                    Buscando...
                  </div>
                )}
              </div>
            </div>

            {/* Invited users list */}
            {invitedUsers.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                  Usuarios invitados ({invitedUsers.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {invitedUsers.map((u) => (
                    <span
                      key={u.id}
                      className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 text-xs px-3 py-1.5 rounded-full font-medium"
                    >
                      {u.name}
                      <button
                        type="button"
                        onClick={() => removeInvitedUser(u.id)}
                        className="hover:text-red-600"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Save as template option */}
        {!isEdit && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-400"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Guardar como plantilla</span>
                <p className="text-xs text-gray-400">Para reusar en eventos recurrentes</p>
              </div>
            </label>
            {saveAsTemplate && (
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Nombre de la plantilla (ej: Torneo semanal futbol)"
                className={inputClass}
              />
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Evento'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
