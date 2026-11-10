import { useState, useEffect, useRef } from 'react';
import { userService } from '../services/api';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwMessage, setPwMessage] = useState({ type: '', text: '' });
  const [pwSaving, setPwSaving] = useState(false);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwMessage({ type: '', text: '' });
    if (pwForm.newPassword.length < 8) {
      return setPwMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 8 caracteres' });
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      return setPwMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden' });
    }
    setPwSaving(true);
    try {
      await userService.changeOwnPassword(pwForm.currentPassword, pwForm.newPassword);
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      setPwMessage({ type: 'ok', text: 'Contraseña actualizada correctamente' });
    } catch (err) {
      setPwMessage({ type: 'error', text: err.error || 'No se pudo cambiar la contraseña' });
    } finally {
      setPwSaving(false);
    }
  }
  const fileRef = useRef();

  useEffect(() => {
    userService.getProfile().then((data) => {
      setProfile(data);
      setForm(data);
    });
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setMessage('');
    try {
      const updated = await userService.updateProfile({
        name: form.name,
        phone: form.phone || null,
        address: form.address || null,
        emergencyContact: form.emergencyContact || null,
      });
      setProfile(updated);
      setEditing(false);
      setMessage('Perfil actualizado correctamente');
    } catch {
      setMessage('Error al actualizar perfil');
    }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setMessage('');
    try {
      const updated = await userService.uploadPhoto(file);
      setProfile(updated);
      setForm(updated);
      setMessage('Foto actualizada correctamente');
    } catch {
      setMessage('Error al subir foto');
    } finally {
      setUploading(false);
    }
  }

  if (!profile) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  const photoUrl = profile.photo || null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold text-primary-700 mb-6">Mi Perfil</h2>

      {message && (
        <div className="bg-primary-50 text-primary-700 p-3 rounded mb-4 text-sm">
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow p-6 space-y-4">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-primary-200"
            onClick={() => fileRef.current?.click()}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl text-gray-400">
                {profile.name?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {uploading ? 'Subiendo...' : 'Cambiar foto'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WebP (máx. 5MB)</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            type="text"
            value={form.name || ''}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={!editing}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="text"
            value={form.phone || ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            disabled={!editing}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
          <input
            type="text"
            value={form.address || ''}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            disabled={!editing}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contacto de Emergencia
          </label>
          <input
            type="text"
            value={form.emergencyContact || ''}
            onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
            disabled={!editing}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
          <span className="inline-block text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
            {profile.role}
          </span>
        </div>

        <div className="flex gap-3 pt-2">
          {editing ? (
            <>
              <button
                type="submit"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setForm(profile);
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              Editar
            </button>
          )}
        </div>
      </form>
      <form onSubmit={handleChangePassword} className="bg-white rounded-xl shadow p-6 space-y-4 mt-6">
        <h2 className="text-lg font-semibold text-gray-800">Cambiar contraseña</h2>
        {pwMessage.text && (
          <p className={`text-sm ${pwMessage.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{pwMessage.text}</p>
        )}
        <input
          type="password"
          placeholder="Contraseña actual"
          autoComplete="current-password"
          required
          value={pwForm.currentPassword}
          onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
        <input
          type="password"
          placeholder="Nueva contraseña (mínimo 8 caracteres)"
          autoComplete="new-password"
          required
          value={pwForm.newPassword}
          onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
        <input
          type="password"
          placeholder="Confirmar nueva contraseña"
          autoComplete="new-password"
          required
          value={pwForm.confirm}
          onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pwSaving}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-60"
          >
            {pwSaving ? 'Guardando…' : 'Actualizar contraseña'}
          </button>
        </div>
      </form>
    </div>
  );
}
