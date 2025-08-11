import { useState, useEffect } from "react";
import axios from "../axiosInstance";

export default function NotesList({ setPage, token, setEditingNoteId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("http://localhost:3001/api/notes", {
        headers: { Authorization: token },
      });
      setNotes(res.data);
    } catch (err) {
      setError("Error al cargar las notas");
      setNotes([]);
    }
    setLoading(false);
  };

  const handleEdit = (noteId) => {
    setEditingNoteId(noteId);
    setPage("edit");
  };

  const handleDelete = async (noteId, noteTitle) => {
    if (!window.confirm(`¿Eliminar la nota "${noteTitle}"?`)) return;
    setError("");
    try {
      await axios.delete(`http://localhost:3001/api/notes/${noteId}`, {
        headers: { Authorization: token },
      });
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      setError(err?.response?.data?.error || "Error al eliminar la nota");
    }
  };

  // Actualiza flags is_public / is_anonymous sin entrar a editar
  const handleToggleFlag = async (note, field, value) => {
    try {
      // Optimista en UI
      setNotes((prev) =>
        prev.map((n) =>
          n.id === note.id
            ? {
                ...n,
                [field]: value ? 1 : 0,
                // si desmarcas pública, fuerza anónima = 0
                ...(field === "is_public" && !value ? { is_anonymous: 0 } : {}),
              }
            : n
        )
      );

      // Enviar como multipart/form-data igual que en el editor para máxima compatibilidad
      const form = new FormData();
      form.append("title", note.title ?? "");
      form.append("text", note.text ?? "");
      form.append("category_id", note.category_id ?? note.categoryId ?? "");
      const nextPublic = field === "is_public" ? value : !!note.is_public;
      const nextAnon =
        nextPublic && field === "is_anonymous" ? value : !!note.is_anonymous && nextPublic;

      form.append("is_public", nextPublic ? "1" : "0");
      form.append("is_anonymous", nextAnon ? "1" : "0");

      await axios.put(`http://localhost:3001/api/notes/${note.id}`, form, {
        headers: { Authorization: token, "Content-Type": "multipart/form-data" },
      });
    } catch (err) {
      // Si falla, recargar lista para volver al estado real del backend
      await fetchNotes();
      setError(err?.response?.data?.error || "No se pudo actualizar la visibilidad");
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
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
        <div className="toolbar">
          <button onClick={() => setPage("profile")}>👤 Mi Perfil</button>
          <button onClick={() => setPage("categories")}>🏷️ Categorías</button>
          <button onClick={() => setPage("public")}>🌍 Muro Público</button>
          <button className="secondary" onClick={() => setPage("landing")}>
            🏠 Inicio
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="toolbar mb-1-5">
        <input
          type="text"
          placeholder="🔍 Buscar en mis notas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="grow search-input"
        />
        <button
          onClick={() => {
            setEditingNoteId(null);
            setPage("edit");
          }}
        >
          ➕ Nueva Nota
        </button>
      </div>

      {filteredNotes.length === 0 && !loading && (
        <div className="empty">
          {searchTerm ? (
            <>
              <p>No se encontraron notas que coincidan con "{searchTerm}"</p>
              <button onClick={() => setSearchTerm("")}>Limpiar búsqueda</button>
            </>
          ) : (
            <>
              <p>Aún no tienes notas creadas</p>
              <button
                onClick={() => {
                  setEditingNoteId(null);
                  setPage("edit");
                }}
              >
                Crear mi primera nota
              </button>
            </>
          )}
        </div>
      )}

      <ul>
        {filteredNotes.map((note) => {
          const isPublic = !!note.is_public;
          const isAnon = !!note.is_anonymous && isPublic;

          return (
            <li key={note.id} className="list-row note-item">
              <div className="title">{note.title}</div>

              <div className="badges">
                {isPublic ? (
                  <span className="chip public">🌍 Pública</span>
                ) : (
                  <span className="chip private">🔒 Privada</span>
                )}
                {isAnon && <span className="chip anon">👤 Anónima</span>}
              </div>

              <div className="meta">
                <span>📂 {note.category_name}</span>
                {note.created_at && (
                  <span className="ml-1">📅 {new Date(note.created_at).toLocaleDateString()}</span>
                )}
                {note.image_url && <span className="ml-1">🖼️ Con imagen</span>}
              </div>

              <div className="snippet">{note.text}</div>

              {/* Switches de flags */}
              <div className="actions" style={{ gap: "0.8em", flexWrap: "wrap" }}>
                <label className="row gap-0-5" style={{ justifyContent: "center" }}>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => handleToggleFlag(note, "is_public", e.target.checked)}
                  />
                  Pública
                </label>

                <label className="row gap-0-5" style={{ justifyContent: "center" }}>
                  <input
                    type="checkbox"
                    checked={isAnon}
                    disabled={!isPublic}
                    title={!isPublic ? "La nota debe ser pública para marcar Anónima" : ""}
                    onChange={(e) => handleToggleFlag(note, "is_anonymous", e.target.checked)}
                  />
                  Anónima
                </label>
              </div>

              <div className="actions">
                <button
                  className="secondary btn-compact"
                  onClick={() => handleEdit(note.id)}
                  title="Editar nota"
                >
                  ✏️ Editar
                </button>
                <button
                  className="danger btn-compact"
                  onClick={() => handleDelete(note.id, note.title)}
                  title="Eliminar nota"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {filteredNotes.length > 0 && (
        <div className="muted center mt-2">
          {searchTerm ? (
            <p>Mostrando {filteredNotes.length} de {notes.length} notas</p>
          ) : (
            <p>Total: {notes.length} nota{notes.length !== 1 ? "s" : ""}</p>
          )}
        </div>
      )}
    </div>
  );
}