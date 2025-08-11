import { useState, useEffect } from 'react';
import axios from '../axiosInstance';

export default function CategoriesManager({ setPage, token }) {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:3001/api/categories');
      setCategories(res.data);
    } catch (err) {
      setError('Error al cargar categorías');
    }
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newCat.trim()) {
      setError('El nombre de la categoría es obligatorio');
      return;
    }
    if (newCat.length > 50) {
      setError('El nombre es demasiado largo');
      return;
    }
    setLoading(true);
    try {
      await axios.post('http://localhost:3001/api/categories', { name: newCat.trim() }, {
        headers: { Authorization: token }
      });
      setNewCat('');
      setSuccess('Categoría creada');
      fetchCategories();
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al crear la categoría');
    }
    setLoading(false);
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setError('');
    setSuccess('');
  };

  const handleEditSave = async (catId) => {
    if (!editingName.trim()) {
      setError('El nombre de la categoría es obligatorio');
      return;
    }
    if (editingName.length > 50) {
      setError('El nombre es demasiado largo');
      return;
    }
    setLoading(true);
    try {
      await axios.put(`http://localhost:3001/api/categories/${catId}`, { name: editingName.trim() }, {
        headers: { Authorization: token }
      });
      setEditingId(null);
      setEditingName('');
      setSuccess('Categoría actualizada');
      fetchCategories();
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al actualizar la categoría');
    }
    setLoading(false);
  };

  const handleDelete = async (catId, catName) => {
    if (!window.confirm(`¿Seguro que quieres eliminar la categoría "${catName}"?`)) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.delete(`http://localhost:3001/api/categories/${catId}`, {
        headers: { Authorization: token }
      });
      setSuccess('Categoría eliminada');
      fetchCategories();
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al eliminar la categoría');
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="top-bar">
        <h2>🏷️ Categorías</h2>
        <button className="secondary" onClick={() => setPage('list')}>⬅️ Volver a mis notas</button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Nueva categoría"
          value={newCat}
          onChange={e => setNewCat(e.target.value)}
          maxLength={50}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>Añadir</button>
      </form>

      <ul>
        {categories.map(cat => (
          <li key={cat.id}>
            {editingId === cat.id ? (
              <>
                <input
                  type="text"
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  maxLength={50}
                  disabled={loading}
                />
                <button
                  onClick={() => handleEditSave(cat.id)}
                  disabled={loading}
                >💾</button>
                <button
                  className="secondary"
                  onClick={() => {
                    setEditingId(null);
                    setEditingName('');
                  }}
                  disabled={loading}
                >Cancelar</button>
              </>
            ) : (
              <>
                <span>{cat.name}</span>
                <button
                  className="secondary"
                  onClick={() => handleEdit(cat)}
                  disabled={loading}
                >✏️</button>
                <button
                  className="danger"
                  onClick={() => handleDelete(cat.id, cat.name)}
                  disabled={loading}
                >🗑️</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}