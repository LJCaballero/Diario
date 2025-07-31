import { useState, useEffect } from 'react';
import axios from '../axiosInstance';

export default function NoteEdit({ setPage, token, noteId }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [currentImage, setCurrentImage] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  const isEditing = !!noteId;

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchNote();
    }
    // eslint-disable-next-line
  }, [noteId]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/categories');
      setCategories(res.data);
      if (res.data.length > 0 && !categoryId) {
        setCategoryId(res.data[0].id);
      }
    } catch (err) {
      setError('Error al cargar categorías');
    }
  };

  const fetchNote = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3001/api/notes/${noteId}`, {
        headers: { Authorization: token }
      });
      const note = res.data;
      setTitle(note.title);
      setText(note.text);
      setCategoryId(note.category_id);
      setIsPublic(note.is_public);
      setIsAnonymous(note.is_anonymous);
      setCurrentImage(note.image_url || '');
    } catch (err) {
      setError('Error al cargar la nota');
    }
    setLoading(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('La imagen es demasiado grande (máximo 2MB)');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        setError('Solo se permiten imágenes (jpg, png, gif, webp)');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleRemoveCurrentImage = async () => {
    if (!window.confirm('¿Seguro que quieres eliminar la imagen actual?')) return;
    setLoading(true);
    setError('');
    try {
      await axios.delete(`http://localhost:3001/api/notes/${noteId}/image`, {
        headers: { Authorization: token }
      });
      setCurrentImage('');
      setSuccess('Imagen eliminada correctamente');
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al eliminar la imagen');
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('El título es obligatorio');
      return;
    }
    if (!text.trim()) {
      setError('El texto es obligatorio');
      return;
    }
    if (!categoryId) {
      setError('Debes seleccionar una categoría');
      return;
    }
    if (title.length > 100) {
      setError('El título es demasiado largo (máximo 100 caracteres)');
      return;
    }
    if (text.length > 5000) {
      setError('El texto es demasiado largo (máximo 5000 caracteres)');
      return;
    }

    setLoading(true);

    try {
      const noteData = {
        title: title.trim(),
        text: text.trim(),
        category_id: parseInt(categoryId),
        is_public: isPublic,
        is_anonymous: isAnonymous
      };

      let savedNoteId = noteId;

      if (isEditing) {
        await axios.put(`http://localhost:3001/api/notes/${noteId}`, noteData, {
          headers: { Authorization: token }
        });
        setSuccess('Nota actualizada correctamente');
      } else {
        const res = await axios.post('http://localhost:3001/api/notes', noteData, {
          headers: { Authorization: token }
        });
        savedNoteId = res.data.id;
        setSuccess('Nota creada correctamente');
      }

      // Subir imagen si hay una nueva
      if (imageFile && savedNoteId) {
        const formData = new FormData();
        formData.append('image', imageFile);
        try {
          const imgRes = await axios.post(
            `http://localhost:3001/api/notes/${savedNoteId}/image`,
            formData,
            {
              headers: {
                Authorization: token,
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          setCurrentImage(imgRes.data.imageUrl);
          setImageFile(null);
          setImagePreview('');
        } catch (imgErr) {
          setError(imgErr?.response?.data?.error || 'Error al subir la imagen');
        }
      }

      // Redirigir después de un breve delay
      setTimeout(() => {
        setPage('notes');
      }, 1500);

    } catch (err) {
      setError(err?.response?.data?.error || 'Error al guardar la nota');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta nota? Esta acción no se puede deshacer.')) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.delete(`http://localhost:3001/api/notes/${noteId}`, {
        headers: { Authorization: token }
      });
      setSuccess('Nota eliminada correctamente');
      setTimeout(() => {
        setPage('notes');
      }, 1000);
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al eliminar la nota');
    }
    setLoading(false);
  };

  if (loading && isEditing && !title) {
    return <div className="container">Cargando nota...</div>;
  }

  return (
    <div className="container">
      <div className="top-bar">
        <h2>{isEditing ? '✏️ Editar Nota' : '📝 Nueva Nota'}</h2>
        <button className="secondary" onClick={() => setPage('notes')}>⬅️ Volver a mis notas</button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSave}>
        <div>
          <label>Título *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título de la nota"
            maxLength={100}
            disabled={loading}
            required
          />
          <small>{title.length}/100 caracteres</small>
        </div>

        <div>
          <label>Categoría *</label>
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            disabled={loading}
            required
          >
            <option value="">Selecciona una categoría</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Texto *</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Contenido de la nota"
            rows={10}
            maxLength={5000}
            disabled={loading}
            required
          />
          <small>{text.length}/5000 caracteres</small>
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
              disabled={loading}
            />
            Hacer pública (visible para todos)
          </label>
        </div>

        {isPublic && (
          <div>
            <label>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                disabled={loading}
              />
              Publicar de forma anónima
            </label>
          </div>
        )}

        <div>
          <label>Imagen (opcional)</label>
          {currentImage && (
            <div style={{marginBottom: '1em'}}>
              <p>Imagen actual:</p>
              <img 
                src={`http://localhost:3001${currentImage}`} 
                alt="Imagen actual" 
                style={{maxWidth: '200px', borderRadius: '8px', marginBottom: '0.5em'}}
              />
              <br />
              <button 
                type="button" 
                className="secondary" 
                onClick={handleRemoveCurrentImage}
                disabled={loading}
              >
                🗑️ Eliminar imagen actual
              </button>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={loading}
          />
          {imagePreview && (
            <div style={{marginTop: '0.5em'}}>
              <p>Vista previa de la nueva imagen:</p>
              <img 
                src={imagePreview} 
                alt="Vista previa" 
                style={{maxWidth: '200px', borderRadius: '8px'}}
              />
            </div>
          )}
          <small>Máximo 2MB. Formatos: jpg, png, gif, webp</small>
        </div>

        <div style={{display: 'flex', gap: '1em', marginTop: '1.5em'}}>
          <button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar Nota' : 'Crear Nota')}
          </button>
          <button type="button" className="secondary" onClick={() => setPage('notes')} disabled={loading}>
            Cancelar
          </button>
          {isEditing && (
            <button type="button" className="danger" onClick={handleDelete} disabled={loading}>
              🗑️ Eliminar Nota
            </button>
          )}
        </div>
      </form>
    </div>
  );
}