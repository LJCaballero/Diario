import { useState, useEffect } from 'react';
import axios from '../axiosInstance';

export default function NoteView({ token, noteId, setPage, setNoteId }) {
  const [note, setNote] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:3001/api/notes/${noteId}`, {
      headers: { Authorization: token }
    }).then(res => setNote(res.data));
  }, [noteId, token]);

  const handleDelete = async () => {
    if (!window.confirm('¿Seguro que quieres eliminar esta nota? Esta acción no se puede deshacer.')) return;
    await axios.delete(`http://localhost:3001/api/notes/${noteId}`, {
      headers: { Authorization: token }
    });
    setPage('list');
  };

  if (!note) return <div className="container">Cargando nota...</div>;

  return (
    <div className="container">
      <div className="top-bar">
        <h2>📄 {note.title}</h2>
        <button className="secondary" onClick={() => setPage('list')}>⬅️ Volver</button>
        <button className="secondary" onClick={() => { setNoteId(note.id); setPage('edit'); }}>✏️ Editar</button>
        <button className="secondary danger-text" onClick={handleDelete}>🗑️ Eliminar</button>
      </div>
      <div>
        <p><strong>Categoría:</strong> {note.category_name}</p>
        <p><strong>Fecha de creación:</strong> {note.created_at ? new Date(note.created_at).toLocaleString() : 'N/A'}</p>
        <p><strong>¿Pública?:</strong> {note.is_public ? 'Sí' : 'No'}</p>
        {note.is_public && (
          <p><strong>¿Anónima?:</strong> {note.is_anonymous ? 'Sí (aparecerá como Anónimo en el muro público)' : 'No'}</p>
        )}
        {note.image_url && (
          <div className="my-1">
            <img src={`http://localhost:3001${note.image_url}`} alt="Nota" />
          </div>
        )}
        <hr />
        <div className="content-prewrap">{note.text}</div>
      </div>
    </div>
  );
}