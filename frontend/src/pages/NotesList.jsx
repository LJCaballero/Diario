import { useState, useEffect } from 'react';
import axios from '../axiosInstance';

export default function NotesList({ setPage, token, setEditingNoteId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:3001/api/notes', {
        headers: { Authorization: token }
      });
      setNotes(res.data);
    } catch (err) {
      setError('Error al cargar las notas');
      setNotes([]);
    }
    setLoading(false);
  };

  const handleEdit = (noteId) => {
    setEditingNoteId(noteId);
    setPage('edit');
  };

  const handleDelete = async (noteId, noteTitle) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la nota "${noteTitle}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setError('');
    try {
      await axios.delete(`http://localhost:3001/api/notes/${noteId}`, {
        headers: { Authorization: token }
      });
      setNotes(notes.filter(note => note.id !== noteId));
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al eliminar la nota');
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="container">Cargando notas...</div>;
  }

  return (
    <div className="container">
      <div className="top-bar">
        <h2>📚 Mis Notas</h2>
        <div style={{display: 'flex', gap: '0.5em'}}>
          <button onClick={() => setPage('profile')}>👤 Mi Perfil</button>
          <button onClick={() => setPage('categories')}>🏷️ Categorías</button>
          <button onClick={() => setPage('public')}>🌍 Muro Público</button>
          <button className="secondary" onClick={() => setPage('landing')}>🏠 Inicio</button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div style={{marginBottom: '1.5em', display: 'flex', gap: '1em', alignItems: 'center'}}>
        <input
          type="text"
          placeholder="🔍 Buscar en mis notas..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{flex: 1}}
        />
        <button onClick={() => {
          setEditingNoteId(null);
          setPage('edit');
        }}>
          ➕ Nueva Nota
        </button>
      </div>

      {filteredNotes.length === 0 && !loading && (
        <div style={{textAlign: 'center', padding: '3em', color: '#666'}}>
          {searchTerm ? (
            <>
              <p>No se encontraron notas que coincidan con "{searchTerm}"</p>
              <button onClick={() => setSearchTerm('')}>Limpiar búsqueda</button>
            </>
          ) : (
            <>
              <p>Aún no tienes notas creadas</p>
              <button onClick={() => {
                setEditingNoteId(null);
                setPage('edit');
              }}>
                Crear mi primera nota
              </button>
            </>
          )}
        </div>
      )}

      <ul>
        {filteredNotes.map(note => (
          <li key={note.id} style={{
            borderBottom: '1px solid #eee',
            padding: '1em 0',
            display: 'flex',
            alignItems: 'center',
            gap: '1em'
          }}>
            <div style={{flex: 1}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5em', marginBottom: '0.3em'}}>
                <h3 style={{margin: 0, fontSize: '1.1em'}}>{note.title}</h3>
                {note.is_public && (
                  <span style={{
                    background: '#e3f2fd',
                    color: '#1976d2',
                    padding: '0.2em 0.5em',
                    borderRadius: '12px',
                    fontSize: '0.8em',
                    fontWeight: 500
                  }}>
                    🌍 Pública
                  </span>
                )}
                {note.is_anonymous && (
                  <span style={{
                    background: '#f3e5f5',
                    color: '#7b1fa2',
                    padding: '0.2em 0.5em',
                    borderRadius: '12px',
                    fontSize: '0.8em',
                    fontWeight: 500
                  }}>
                    👤 Anónima
                  </span>
                )}
              </div>
              <div style={{fontSize: '0.9em', color: '#666', marginBottom: '0.3em'}}>
                <span>📂 {note.category_name}</span>
                {note.created_at && (
                  <span style={{marginLeft: '1em'}}>
                    📅 {new Date(note.created_at).toLocaleDateString()}
                  </span>
                )}
                {note.image_url && (
                  <span style={{marginLeft: '1em'}}>🖼️ Con imagen</span>
                )}
              </div>
              <div style={{
                fontSize: '0.95em',
                color: '#555',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '500px'
              }}>
                {note.text.substring(0, 100)}{note.text.length > 100 ? '...' : ''}
              </div>
            </div>
            <div style={{display: 'flex', gap: '0.5em'}}>
              <button
                className="secondary"
                onClick={() => handleEdit(note.id)}
                title="Editar nota"
              >
                ✏️
              </button>
              <button
                className="danger"
                onClick={() => handleDelete(note.id, note.title)}
                title="Eliminar nota"
              >
                🗑️
              </button>
            </div>
          </li>
        ))}
      </ul>

      {filteredNotes.length > 0 && (
        <div style={{textAlign: 'center', marginTop: '2em', color: '#666'}}>
          {searchTerm ? (
            <p>Mostrando {filteredNotes.length} de {notes.length} notas</p>
          ) : (
            <p>Total: {notes.length} nota{notes.length !== 1 ? 's' : ''}</p>
          )}
        </div>
      )}
    </div>
  );
}