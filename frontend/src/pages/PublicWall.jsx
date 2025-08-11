import { useState, useEffect, useRef } from 'react';
import axios from '../axiosInstance';

export default function PublicWall({ setPage, token }) {
  const [notes, setNotes] = useState([]);
  const [author, setAuthor] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(false);

  const typingTimer = useRef(null);

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
    } catch {
      setNotes([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line
  }, []);

  // Búsqueda "en vivo" con debounce mientras el usuario escribe en author
  useEffect(() => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      fetchNotes();
    }, 350);
    return () => clearTimeout(typingTimer.current);
    // eslint-disable-next-line
  }, [author]);

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

  const handleRate = async (noteId, rating) => {
    if (!token) return;
    try {
      await axios.post(
        `http://localhost:3001/api/public/${noteId}/rate`,
        { rating },
        { headers: { Authorization: token } }
      );
      fetchNotes();
    } catch {}
  };

  const handleUnrate = async (noteId) => {
    if (!token) return;
    try {
      await axios.delete(
        `http://localhost:3001/api/public/${noteId}/rate`,
        { headers: { Authorization: token } }
      );
      fetchNotes();
    } catch {}
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

      <form onSubmit={handleFilter} className="toolbar mb-1-5 wrap">
        <input
          type="text"
          placeholder="Filtrar por autor o aka"
          value={author}
          onChange={e => setAuthor(e.target.value)}
          className="grow search-input"
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
            <div className="empty">No hay notas públicas que coincidan con el filtro.</div>
          </li>
        )}
        {notes.map(note => (
          <li key={note.id} className="list-row">
            <div className="row gap-1">
              <button
                className="list-btn"
                onClick={() => setSelectedNote(note.id)}
              >
                <div className="note-title">• {note.title}</div>
                <div className="meta">
                  <span>Autor: <strong>{note.display_author}</strong></span> |{' '}
                  <span>Categoría: {note.category_name}</span> |{' '}
                  <span>Fecha: {note.created_at ? new Date(note.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
              </button>
              <div className="rate-box">
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

function PublicNoteDetail({ noteId, setSelectedNote, setPage, token }) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleRate = async (rating) => {
    if (!token) return;
    try {
      await axios.post(
        `http://localhost:3001/api/public/${noteId}/rate`,
        { rating },
        { headers: { Authorization: token } }
      );
      fetchNote();
    } catch {}
  };

  const handleUnrate = async () => {
    if (!token) return;
    try {
      await axios.delete(
        `http://localhost:3001/api/public/${noteId}/rate`,
        { headers: { Authorization: token } }
      );
      fetchNote();
    } catch {}
  };

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
      setCommentError(err?.response?.data?.error || 'Error al publicar el comentario');
    }
    setCommentLoading(false);
  };

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
      setCommentError(err?.response?.data?.error || 'Error al eliminar el comentario');
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
          <div className="my-1">
            <img src={`http://localhost:3001${note.image_url}`} alt="Nota" />
          </div>
        )}
        <div className="my-1">
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
        <div className="content-prewrap text-lg">{note.text}</div>
        <hr />
        <div className="mt-2">
          <h3 className="mb-0-5">💬 Comentarios</h3>
          {commentLoading && <div>Cargando comentarios...</div>}
          {commentError && <div className="error">{commentError}</div>}
          {commentSuccess && <div className="success">{commentSuccess}</div>}
          <form onSubmit={handleAddComment} className="toolbar mb-1">
            <input
              type="text"
              placeholder={token ? "Escribe un comentario..." : "Inicia sesión para comentar"}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              disabled={!token || commentLoading}
              maxLength={1000}
              className="grow"
            />
            <button type="submit" disabled={!token || commentLoading || !commentText.trim()}>
              Comentar
            </button>
          </form>
          <ul className="no-bullets">
            {comments.length === 0 && !commentLoading && (
              <li className="muted italic">No hay comentarios aún.</li>
            )}
            {comments.map(comment => (
              <li key={comment.id} className="comment-row">
                <div>
                  <span className="fw-500">{comment.display_author}</span>
                  <span className="muted small ml-0-5">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                  <div className="content-prewrap mt-0-2">{comment.text}</div>
                </div>
                {token && comment.user_id && note && note.user_rating !== undefined && (
                  (token && comment.user_id === getUserIdFromToken(token)) && (
                    <button
                      className="secondary btn-compact"
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

function getUserIdFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
  } catch {
    return null;
  }
}

function LikeDislike({ note, token, onLike, onDislike, onUnrate, big }) {
  const userRating = note.user_rating;
  const sizeClass = big ? 'icon-lg' : 'icon-md';

  return (
    <div className="rate actions">
      <button
        title="Me gusta"
        className={`icon-button ${sizeClass} ${userRating === 1 ? 'liked' : ''}`}
        disabled={!token}
        onClick={() => userRating === 1 ? onUnrate() : onLike()}
      >
        👍
      </button>
      <span className="rate-count like">{note.likes || 0}</span>
      <button
        title="No me gusta"
        className={`icon-button ${sizeClass} ${userRating === -1 ? 'disliked' : ''}`}
        disabled={!token}
        onClick={() => userRating === -1 ? onUnrate() : onDislike()}
      >
        👎
      </button>
      <span className="rate-count dislike">{note.dislikes || 0}</span>
    </div>
  );
}