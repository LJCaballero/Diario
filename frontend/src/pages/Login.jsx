import { useState } from 'react';
import axios from '../axiosInstance';

export default function Login({ setPage, setToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3001/api/login', { email, password });
      setToken(res.data.token);
      setPage('list'); // <-- Cambia a la página principal de notas
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al iniciar sesión');
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="top-bar">
        <h2>🔐 Iniciar Sesión</h2>
        <button
          className="secondary"
          onClick={() => setPage('landing')}
          disabled={loading}
        >
          ⬅️ Volver
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleLogin} autoComplete="on">
        <div>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
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
          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
            autoComplete="current-password"
          />
        </div>
        <div style={{marginTop: '1.5em', display: 'flex', gap: '1em'}}>
          <button type="submit" disabled={loading} style={{flex: 1}}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => setPage('register')}
            disabled={loading}
            style={{flex: 1}}
          >
            Registrarse
          </button>
        </div>
      </form>
    </div>
  );
}