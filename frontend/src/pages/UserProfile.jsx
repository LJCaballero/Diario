import { useState, useEffect } from 'react';
import axios from '../axiosInstance';

export default function UserProfile({ setPage, token }) {
  const [profile, setProfile] = useState({ email: '', aka: '', aka_public: true });
  const [stats, setStats] = useState({});
  const [aka, setAka] = useState('');
  const [akaPublic, setAkaPublic] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:3001/api/profile', {
        headers: { Authorization: token }
      });
      setProfile(res.data);
      setAka(res.data.aka || '');
      setAkaPublic(res.data.aka_public);
    } catch (err) {
      setError('Error al cargar el perfil');
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/profile/stats', {
        headers: { Authorization: token }
      });
      setStats(res.data);
    } catch (err) {
      // opcional
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (aka.length > 40) {
      setError('El alias es demasiado largo (máximo 40 caracteres)');
      return;
    }

    setSaving(true);
    try {
      await axios.put('http://localhost:3001/api/profile', {
        aka: aka.trim(),
        aka_public: akaPublic
      }, {
        headers: { Authorization: token }
      });
      setSuccess('Perfil actualizado correctamente');
      setProfile(prev => ({
        ...prev,
        aka: aka.trim(),
        aka_public: akaPublic
      }));
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al actualizar el perfil');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="container">Cargando perfil...</div>;
  }

  return (
    <div className="container">
      <div className="top-bar">
        <h2>👤 Mi Perfil</h2>
        <button className="secondary" onClick={() => setPage('list')}>⬅️ Volver a mis notas</button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="stats-grid">
        <div className="panel">
          <h3 className="mt-0">📧 Información de la cuenta</h3>
          <div className="mb-1"><strong>Email:</strong> {profile.email}</div>
          {stats.registered_at && (
            <div className="mb-1">
              <strong>Miembro desde:</strong> {new Date(stats.registered_at).toLocaleDateString()}
            </div>
          )}
          <div>
            <strong>Alias actual:</strong> {profile.aka || <em>Sin alias</em>}
            {profile.aka && (
              <span className="muted small ml-0-5">
                ({profile.aka_public ? 'Público' : 'Privado'})
              </span>
            )}
          </div>
        </div>

        {Object.keys(stats).length > 0 && (
          <div className="panel">
            <h3 className="mt-0">📊 Estadísticas</h3>
            <div className="grid-rows">
              <div className="row space-between">
                <span>📝 Total de notas:</span>
                <strong>{stats.total_notes || 0}</strong>
              </div>
              <div className="row space-between">
                <span>🌍 Notas públicas:</span>
                <strong>{stats.public_notes || 0}</strong>
              </div>
              <div className="row space-between">
                <span>🔒 Notas privadas:</span>
                <strong>{stats.private_notes || 0}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="panel white mt-2">
        <h3 className="mt-0">✏️ Editar perfil</h3>
        <form onSubmit={handleSave}>
          <div>
            <label>Alias / Nombre público</label>
            <input
              type="text"
              value={aka}
              onChange={e => setAka(e.target.value)}
              placeholder="Ej: Mi nombre artístico"
              maxLength={40}
              disabled={saving}
            />
            <small>
              {aka.length}/40 caracteres. 
              {aka ? ' Este será tu nombre visible en notas públicas.' : ' Si está vacío, se mostrará tu email.'}
            </small>
          </div>

          {aka && (
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={akaPublic}
                  onChange={e => setAkaPublic(e.target.checked)}
                  disabled={saving}
                />
                Mostrar mi alias públicamente
              </label>
              <small className="muted block mt-0-3">
                {akaPublic 
                  ? 'Tu alias será visible en tus notas públicas'
                  : 'Se mostrará tu email en lugar del alias en notas públicas'
                }
              </small>
            </div>
          )}

          <div className="mt-1-5">
            <button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button 
              type="button" 
              className="secondary ml-1"
              onClick={() => {
                setAka(profile.aka || '');
                setAkaPublic(profile.aka_public);
                setError('');
                setSuccess('');
              }}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <div className="info-box mt-2">
        <h4 className="mt-0 primary">💡 Información sobre el alias</h4>
        <ul className="pad-left">
          <li>El alias es opcional y te permite tener un nombre público diferente a tu email</li>
          <li>Si tienes alias y está marcado como público, aparecerá en tus notas públicas</li>
          <li>Si no tienes alias o está marcado como privado, se mostrará tu email</li>
          <li>En notas anónimas nunca se muestra tu identidad, independientemente de esta configuración</li>
        </ul>
      </div>
    </div>
  );
}