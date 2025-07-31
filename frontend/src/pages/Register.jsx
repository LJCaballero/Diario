import { useState } from 'react';
import axios from '../axiosInstance';

export default function Register({ setPage, setToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [aka, setAka] = useState('');
  const [akaPublic, setAkaPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await axios.post('http://localhost:3001/api/register', {
        email,
        password,
        aka: aka.trim(),
        aka_public: akaPublic
      });
      setSuccess('¡Registro exitoso! Ahora puedes iniciar sesión.');
      setEmail('');
      setPassword('');
      setAka('');
      setAkaPublic(true);
      setTimeout(() => setPage('login'), 1200);
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al registrar');
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="top-bar">
        <h2>📝 Registro</h2>
        <button className="secondary" onClick={() => setPage('landing')} disabled={loading}>⬅️ Volver</button>
      </div>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <form onSubmit={handleRegister} autoComplete="on">
        <div>
          <label htmlFor="register-email">Email *</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
            disabled={loading}
            autoComplete="username"
          />
        </div>
        <div>
          <label htmlFor="register-password">Contraseña *</label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={loading}
            autoComplete="new-password"
          />
          <small>Mínimo 6 caracteres</small>
        </div>
        <div>
          <label htmlFor="register-aka">Alias (opcional)</label>
          <input
            id="register-aka"
            type="text"
            value={aka}
            onChange={e => setAka(e.target.value)}
            maxLength={40}
            disabled={loading}
            autoComplete="nickname"
          />
          <small>Este será tu nombre público si lo marcas como visible</small>
        </div>
        {aka && (
          <div>
            <label>
              <input
                type="checkbox"
                checked={akaPublic}
                onChange={e => setAkaPublic(e.target.checked)}
                disabled={loading}
              />
              Mostrar mi alias públicamente
            </label>
          </div>
        )}
        <div style={{marginTop: '1.5em', display: 'flex', gap: '1em'}}>
          <button type="submit" disabled={loading} style={{flex: 1}}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => setPage('login')}
            disabled={loading}
            style={{flex: 1}}
          >
            Ya tengo cuenta
          </button>
        </div>
      </form>
    </div>
  );
}