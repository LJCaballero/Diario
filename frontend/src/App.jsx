import { useState, useEffect } from 'react';
import axios from './axiosInstance';
import Login from './pages/Login';
import Register from './pages/Register';
import NotesList from './pages/NotesList';
import NoteView from './pages/NoteView';
import NoteEdit from './pages/NoteEdit';
import CategoriesManager from './pages/CategoriesManager';
import PublicWall from './pages/PublicWall';
import Landing from './pages/Landing';
import UserProfile from './pages/UserProfile';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [page, setPage] = useState(token ? 'list' : 'landing');
  const [editingNoteId, setEditingNoteId] = useState(null); // Cambiado de noteId a editingNoteId

  // Validar token al inicio y cuando cambia
  useEffect(() => {
    if (token) {
      // Verifica que el token sea válido (opcional: revisa expiración JWT)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && Date.now() / 1000 > payload.exp) {
          localStorage.removeItem('token');
          setToken(null);
          setPage('landing');
          return;
        }
      } catch {
        localStorage.removeItem('token');
        setToken(null);
        setPage('landing');
        return;
      }
      // Prueba el token contra el backend
      axios.get('http://localhost:3001/api/notes', {
        headers: { Authorization: token }
      }).catch(() => {
        localStorage.removeItem('token');
        setToken(null);
        setPage('landing');
      });
    }
  }, [token]);

  // Guardar token en localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setPage('landing');
  };

  // Renderizado de páginas
  if (page === 'landing') {
    return (
      <div>
        <Landing setPage={setPage} />
      </div>
    );
  }

  if (page === 'publicwall' || page === 'public') {
    return (
      <div>
        {token && (
          <div style={{
            background: '#f5f5f5',
            padding: '0.5em 1em',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1em'
          }}>
            <button className="secondary" onClick={logout}>Cerrar sesión</button>
          </div>
        )}
        <PublicWall setPage={setPage} token={token} />
      </div>
    );
  }

  if (!token) {
    // Si no hay token, muestra login o registro
    return page === 'register'
      ? <Register setPage={setPage} />
      : <Login setToken={setToken} setPage={setPage} />;
  }

  // Si hay token, fuerza la página 'list' si está en login o register
  if (page === 'login' || page === 'register') {
    setPage('list');
    return null;
  }

  return (
    <div>
      {/* Barra superior de logout */}
      <div style={{
        background: '#f5f5f5',
        padding: '0.5em 1em',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1em'
      }}>
        <button className="secondary" onClick={logout}>Cerrar sesión</button>
      </div>

      {page === 'list' && (
        <NotesList
          token={token}
          setPage={setPage}
          setEditingNoteId={setEditingNoteId} // Cambiado de setNoteId a setEditingNoteId
        />
      )}

      {page === 'profile' && (
        <UserProfile
          token={token}
          setPage={setPage}
        />
      )}

      {page === 'view' && (
        <NoteView
          token={token}
          noteId={editingNoteId} // Usando editingNoteId
          setPage={setPage}
          setNoteId={setEditingNoteId} // Usando setEditingNoteId
        />
      )}

      {page === 'edit' && (
        <NoteEdit
          token={token}
          noteId={editingNoteId} // Usando editingNoteId
          setPage={setPage}
        />
      )}

      {page === 'categories' && (
        <CategoriesManager
          token={token}
          setPage={setPage}
        />
      )}
    </div>
  );
}

export default App;