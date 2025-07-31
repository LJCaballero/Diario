import { useState, useEffect } from 'react';
import axios from '../axiosInstance';

export default function PublicWall({ setPage, token }) {
  const [notes, setNotes] = useState([]);
  const [author, setAuthor] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (author) params.author = author;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const config = { params };
      if (token) config.headers = { Authorization: token };
      const res = await axios.get('http://localhost:3001/api/public', config);
      setNotes(res.data);
    } catch (err) {
      setNotes([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchNotes();
  };

  const handleClear = () => {
    setAuthor('');
    setDateFrom('');
    setDateTo('');
    fetchNotes();
  };

  // Like/dislike handlers
  const handleRate = async (noteId, rating) => {
    if (!token) return;
    try {
      await axios.post(
        `http://localhost:3001/api/public/${noteId}/rate`,
        { rating },
        { headers: { Authorization: token } }
      );
      fetchNotes();
    } catch (err) {}
  };

  const handleUnrate = async (noteId) => {
    if (!token) return;
    try {
      await axios.delete(
        `http://localhost:3001/api/public/${noteId}/rate`,
        { headers: { Authorization: token } }
      );
      fetchNotes();
    } catch (err) {}
  };

  if (selectedNote) {
    return (
      <PublicNoteDetail
        noteId={selectedNote}
        setSelectedNote={setSelectedNote}
        setPage={setPage}
        token={token}
      />
    );
  }

  return (
    <div className="container">
      <div className="top-bar">
        <h2>🌍 Muro de Notas Públicas</h2>
        <button className="secondary" onClick={() => setPage('landing')}>🏠 Volver al inicio</button>
      </div>

      <form onSubmit={handleFilter} style={{marginBottom: '1.5em', display: 'flex', gap: '1em', flexWrap: 'wrap'}}>
        <input
          type="text"
          placeholder="Filtrar por autor o aka"
          value={author}
          onChange={e => setAuthor(e.target.value)}
        />
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
        />
        <button type="submit">Filtrar</button>
        <button type="button" className="secondary" onClick={handleClear}>Limpiar</button>
      </form>

      {loading && <div>Cargando notas públicas...</div>}

      <ul>
        {notes.length === 0 && !loading && (
          <li>
            <div style={{padding: '2em', textAlign: 'center', color: '#666'}}>
              No hay notas públicas que coincidan con el filtro.
            </div>
          </li>
        )}
        {notes.map(note => (
          <li key={note.id} style={{borderBottom: '1px solid #eee', padding: '0.7em 0'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '1em'}}>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  width: '100%',
                  cursor: 'pointer',
                  padding: 0
                }}
                onClick={() => setSelectedNote(note.id)}
              >
                <div style={{fontWeight: 'bold', fontSize: '1.1em'}}>{note.title}</div>
                <div style={{fontSize: '0.95em', color: '#555'}}>
                  <span>Autor: <strong>{note.display_author}</strong></span> |{' '}
                  <span>Categoría: {note.category_name}</span> |{' '}
                  <span>Fecha: {note.created_at ? new Date(note.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
              </button>
              {/* Like/Dislike */}
              <div style={{display: 'flex', alignItems: 'center', gap: '0.3em', minWidth: 80}}>
                <LikeDislike
                  note={note}
                  token={token}
                  onLike={() => handleRate(note.id, 1)}
                  onDislike={() => handleRate(note.id, -1)}
                  onUnrate={() => handleUnrate(note.id)}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Componente para ver el detalle de una nota pública
function PublicNoteDetail({ noteId, setSelectedNote, setPage, token }) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  // Comentarios
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [commentSuccess, setCommentSuccess] = useState('');

  const fetchNote = async () => {
    setLoading(true);
    try {
      const config = {};
      if (token) config.headers = { Authorization: token };
      const res = await axios.get(`http://localhost:3001/api/public/${noteId}`, config);
      setNote(res.data);
    } catch {
      setNote(null);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    setCommentLoading(true);
    setCommentError('');
    try {
      const config = {};
      if (token) config.headers = { Authorization: token };
      const res = await axios.get(`http://localhost:3001/api/public/${noteId}/comments`, config);
      setComments(res.data);
    } catch {
      setComments([]);
      setCommentError('Error al cargar comentarios');
    }
    setCommentLoading(false);
  };

  useEffect(() => {
    fetchNote();
    fetchComments();
    // eslint-disable-next-line
  }, [noteId]);

  // Like/dislike handlers
  const handleRate = async (rating) => {
    if (!token) return;
    try {
      await axios.post(
        `http://localhost:3001/api/public/${noteId}/rate`,
        { rating },
        { headers: { Authorization: token } }
      );
      fetchNote();
    } catch (err) {}
  };

  const handleUnrate = async () => {
    if (!token) return;
    try {
      await axios.delete(
        `http://localhost:3001/api/public/${noteId}/rate`,
        { headers: { Authorization: token } }
      );
      fetchNote();
    } catch (err) {}
  };

  // Añadir comentario
  const handleAddComment = async (e) => {
    e.preventDefault();
    setCommentError('');
    setCommentSuccess('');
    if (!token) {
      setCommentError('Debes iniciar sesión para comentar');
      return;
    }
    if (!commentText.trim()) {
      setCommentError('El comentario no puede estar vacío');
      return;
    }
    if (commentText.length > 1000) {
      setCommentError('El comentario es demasiado largo');
      return;
    }
    setCommentLoading(true);
    try {
      await axios.post(
        `http://localhost:3001/api/public/${noteId}/comments`,
        { text: commentText },
        { headers: { Authorization: token } }
      );
      setCommentText('');
      setCommentSuccess('Comentario publicado');
      fetchComments();
    } catch (err) {
      setCommentError(
        err?.response?.data?.error || 'Error al publicar el comentario'
      );
    }
    setCommentLoading(false);
  };

  // Borrar comentario
  const handleDeleteComment = async (commentId) => {
    if (!token) return;
    if (!window.confirm('¿Seguro que quieres borrar este comentario?')) return;
    setCommentError('');
    setCommentSuccess('');
    setCommentLoading(true);
    try {
      await axios.delete(
        `http://localhost:3001/api/public/${noteId}/comments/${commentId}`,
        { headers: { Authorization: token } }
      );
      setCommentSuccess('Comentario eliminado');
      fetchComments();
    } catch (err) {
      setCommentError(
        err?.response?.data?.error || 'Error al eliminar el comentario'
      );
    }
    setCommentLoading(false);
  };

  if (loading || !note) return <div className="container">Cargando nota...</div>;

  return (
    <div className="container">
      <div className="top-bar">
        <h2>📄 {note.title}</h2>
        <button className="secondary" onClick={() => setSelectedNote(null)}>⬅️ Volver al muro</button>
        <button className="secondary" onClick={() => setPage('landing')}>🏠 Volver al inicio</button>
      </div>
      <div>
        <p><strong>Autor:</strong> {note.display_author}</p>
        <p><strong>Categoría:</strong> {note.category_name}</p>
        <p><strong>Fecha de publicación:</strong> {note.created_at ? new Date(note.created_at).toLocaleString() : 'N/A'}</p>
        {note.image_url && (
          <div style={{margin: '1em 0'}}>
            <img src={`http://localhost:3001${note.image_url}`} alt="Nota" style={{maxWidth: '100%', borderRadius: '8px'}} />
          </div>
        )}
        <div style={{margin: '1em 0'}}>
          <LikeDislike
            note={note}
            token={token}
            onLike={() => handleRate(1)}
            onDislike={() => handleRate(-1)}
            onUnrate={handleUnrate}
            big
          />
        </div>
        <hr />
        <div style={{whiteSpace: 'pre-wrap', fontSize: '1.1em'}}>{note.text}</div>
        <hr />
        {/* COMENTARIOS */}
        <div style={{marginTop: '2em'}}>
          <h3 style={{marginBottom: '0.5em'}}>💬 Comentarios</h3>
          {commentLoading && <div>Cargando comentarios...</div>}
          {commentError && <div style={{color: 'red', marginBottom: 8}}>{commentError}</div>}
          {commentSuccess && <div style={{color: 'green', marginBottom: 8}}>{commentSuccess}</div>}
          <form onSubmit={handleAddComment} style={{display: 'flex', gap: 8, marginBottom: 16}}>
            <input
              type="text"
              placeholder={token ? "Escribe un comentario..." : "Inicia sesión para comentar"}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              disabled={!token || commentLoading}
              maxLength={1000}
              style={{flex: 1}}
            />
            <button type="submit" disabled={!token || commentLoading || !commentText.trim()}>
              Comentar
            </button>
          </form>
          <ul style={{listStyle: 'none', padding: 0}}>
            {comments.length === 0 && !commentLoading && (
              <li style={{color: '#888', fontStyle: 'italic'}}>No hay comentarios aún.</li>
            )}
            {comments.map(comment => (
              <li key={comment.id} style={{
                borderBottom: '1px solid #eee',
                padding: '0.5em 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{fontWeight: 500}}>{comment.display_author}</span>
                  <span style={{color: '#888', fontSize: '0.9em', marginLeft: 8}}>
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                  <div style={{marginTop: 2, whiteSpace: 'pre-wrap'}}>{comment.text}</div>
                </div>
                {token && comment.user_id && note && note.user_rating !== undefined && (
                  // Solo el autor puede borrar su comentario
                  (token && comment.user_id === getUserIdFromToken(token)) && (
                    <button
                      className="secondary"
                      style={{marginLeft: 12, fontSize: '0.9em'}}
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={commentLoading}
                    >
                      🗑️
                    </button>
                  )
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Extrae el user_id del token JWT (sin validación de firma, solo para frontend)
function getUserIdFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
  } catch {
    return null;
  }
}

// Componente Like/Dislike reutilizable
function LikeDislike({ note, token, onLike, onDislike, onUnrate, big }) {
  const userRating = note.user_rating;
  const size = big ? '1.7em' : '1.2em';

  return (
    <div style={{display: 'flex', alignItems: 'center', gap: '0.5em'}}>
      <button
        title="Me gusta"
        style={{
          background: 'none',
          border: 'none',
          color: userRating === 1 ? '#1976d2' : '#888',
          fontSize: size,
          cursor: token ? 'pointer' : 'not-allowed',
          padding: 0
        }}
        disabled={!token}
        onClick={() => userRating === 1 ? onUnrate() : onLike()}
      >
        👍
      </button>
      <span style={{minWidth: 18, textAlign: 'center', color: '#1976d2', fontWeight: 600}}>{note.likes || 0}</span>
      <button
        title="No me gusta"
        style={{
          background: 'none',
          border: 'none',
          color: userRating === -1 ? '#d32f2f' : '#888',
          fontSize: size,
          cursor: token ? 'pointer' : 'not-allowed',
          padding: 0
        }}
        disabled={!token}
        onClick={() => userRating === -1 ? onUnrate() : onDislike()}
      >
        👎
      </button>
      <span style={{minWidth: 18, textAlign: 'center', color: '#d32f2f', fontWeight: 600}}>{note.dislikes || 0}</span>
    </div>
  );
}