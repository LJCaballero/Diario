const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;
const SECRET = 'mi_secreto_super_seguro';

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limitar tamaño de JSON
app.use('/uploads', express.static('uploads'));

// Configurar multer para subir imágenes con validaciones de seguridad
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Solo imágenes y máximo 2MB
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes (jpg, png, gif, webp)'));
  }
});

// Conectar a SQLite
const db = new sqlite3.Database('notas.db');

// Crear tablas (ACTUALIZADAS)
db.serialize(() => {
  // Tabla usuarios con aka y created_at
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    aka TEXT DEFAULT '',
    aka_public BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Agregar columna created_at si no existe (para usuarios existentes)
  db.run(`ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {
    // Ignorar error si la columna ya existe
  });

  // Tabla categorías
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )`);

  // Tabla notas con campos nuevos
  db.run(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    is_public BOOLEAN DEFAULT 0,
    is_anonymous BOOLEAN DEFAULT 0,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (category_id) REFERENCES categories (id)
  )`);

  // Tabla de valoraciones (likes/dislikes)
  db.run(`CREATE TABLE IF NOT EXISTS note_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating IN (1, -1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(note_id, user_id),
    FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )`);

  // Tabla de comentarios
  db.run(`CREATE TABLE IF NOT EXISTS note_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )`);

  // Insertar categorías por defecto
  db.run(`INSERT OR IGNORE INTO categories (name) VALUES 
    ('Personal'), ('Trabajo'), ('Ideas'), ('Otros')`);
});

// Middleware de autenticación
const auth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware de autenticación opcional (para endpoints públicos que pueden usar token)
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization;
  if (token) {
    try {
      const decoded = jwt.verify(token, SECRET);
      req.user = decoded;
    } catch (err) {
      // Token inválido, pero continuamos sin usuario
    }
  }
  next();
};

// REGISTRO (actualizado con aka y validaciones)
app.post('/api/register', async (req, res) => {
  const { email, password, aka = '', aka_public = true } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }
  if (email.length > 100 || password.length > 100 || aka.length > 40) {
    return res.status(400).json({ error: 'Email, contraseña o aka demasiado largos' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO users (email, password, aka, aka_public) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, aka, aka_public ? 1 : 0],
      function(err) {
        if (err) {
          return res.status(400).json({ error: 'El usuario ya existe' });
        }
        res.json({ message: 'Usuario registrado exitosamente' });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '24h' });
    res.json({ token });
  });
});

// OBTENER PERFIL DE USUARIO
app.get('/api/profile', auth, (req, res) => {
  db.get('SELECT id, email, aka, aka_public FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  });
});

// ESTADÍSTICAS RÁPIDAS DE USUARIO
app.get('/api/profile/stats', auth, (req, res) => {
  db.get(
    `SELECT 
      (SELECT COUNT(*) FROM notes WHERE user_id = ?) as total_notes,
      (SELECT COUNT(*) FROM notes WHERE user_id = ? AND is_public = 1) as public_notes,
      (SELECT COUNT(*) FROM notes WHERE user_id = ? AND is_public = 0) as private_notes,
      (SELECT created_at FROM users WHERE id = ?) as registered_at
    `,
    [req.user.id, req.user.id, req.user.id, req.user.id],
    (err, stats) => {
      if (err) return res.status(500).json({ error: 'Error al obtener estadísticas' });
      res.json(stats);
    }
  );
});

// ACTUALIZAR PERFIL DE USUARIO (con validaciones)
app.put('/api/profile', auth, (req, res) => {
  const { aka, aka_public } = req.body;
  if (aka && aka.length > 40) {
    return res.status(400).json({ error: 'Aka demasiado largo (máximo 40 caracteres)' });
  }
  db.run(
    'UPDATE users SET aka = ?, aka_public = ? WHERE id = ?',
    [aka || '', aka_public ? 1 : 0, req.user.id],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Error al actualizar perfil' });
      }
      res.json({ message: 'Perfil actualizado exitosamente' });
    }
  );
});

// OBTENER CATEGORÍAS
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categories', (err, categories) => {
    if (err) return res.status(500).json({ error: 'Error al obtener categorías' });
    res.json(categories);
  });
});

// CREAR CATEGORÍA (con validaciones)
app.post('/api/categories', auth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre es obligatorio' });
  if (name.length > 50) return res.status(400).json({ error: 'Nombre de categoría demasiado largo' });
  db.run('INSERT INTO categories (name) VALUES (?)', [name], function(err) {
    if (err) return res.status(400).json({ error: 'La categoría ya existe' });
    res.json({ id: this.lastID, name });
  });
});

// ACTUALIZAR CATEGORÍA (con validaciones)
app.put('/api/categories/:id', auth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre es obligatorio' });
  if (name.length > 50) return res.status(400).json({ error: 'Nombre de categoría demasiado largo' });
  db.run('UPDATE categories SET name = ? WHERE id = ?', [name, req.params.id], function(err) {
    if (err) return res.status(400).json({ error: 'Error al actualizar categoría' });
    res.json({ message: 'Categoría actualizada' });
  });
});

// ELIMINAR CATEGORÍA
app.delete('/api/categories/:id', auth, (req, res) => {
  db.run('DELETE FROM categories WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(400).json({ error: 'Error al eliminar categoría' });
    res.json({ message: 'Categoría eliminada' });
  });
});

// OBTENER NOTAS DEL USUARIO
app.get('/api/notes', auth, (req, res) => {
  db.all(`
    SELECT n.*, c.name as category_name 
    FROM notes n 
    LEFT JOIN categories c ON n.category_id = c.id 
    WHERE n.user_id = ? 
    ORDER BY n.created_at DESC
  `, [req.user.id], (err, notes) => {
    if (err) return res.status(500).json({ error: 'Error al obtener notas' });
    res.json(notes);
  });
});

// OBTENER UNA NOTA ESPECÍFICA
app.get('/api/notes/:id', auth, (req, res) => {
  db.get(`
    SELECT n.*, c.name as category_name 
    FROM notes n 
    LEFT JOIN categories c ON n.category_id = c.id 
    WHERE n.id = ? AND n.user_id = ?
  `, [req.params.id, req.user.id], (err, note) => {
    if (err || !note) return res.status(404).json({ error: 'Nota no encontrada' });
    res.json(note);
  });
});

// CREAR NOTA (actualizada con is_anonymous y validaciones)
app.post('/api/notes', auth, (req, res) => {
  const { title, text, category_id, is_public, is_anonymous } = req.body;
  if (!title || !text || !category_id) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  if (title.length > 100) {
    return res.status(400).json({ error: 'Título demasiado largo (máximo 100 caracteres)' });
  }
  if (text.length > 5000) {
    return res.status(400).json({ error: 'Texto demasiado largo (máximo 5000 caracteres)' });
  }
  db.get('SELECT id FROM categories WHERE id = ?', [category_id], (err, cat) => {
    if (err) {
      console.error('Error buscando categoría:', err);
      return res.status(500).json({ error: 'Error interno al buscar categoría' });
    }
    if (!cat) {
      console.error('Categoría no válida:', category_id);
      return res.status(400).json({ error: 'Categoría no válida' });
    }
    db.run(
      'INSERT INTO notes (user_id, title, text, category_id, is_public, is_anonymous) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, title, text, category_id, is_public ? 1 : 0, is_anonymous ? 1 : 0],
      function(err) {
        if (err) {
          console.error('Error al crear nota:', err);
          return res.status(400).json({ error: 'Error al crear nota' });
        }
        res.json({ id: this.lastID });
      }
    );
  });
});

// ACTUALIZAR NOTA (actualizada con is_anonymous y validaciones)
app.put('/api/notes/:id', auth, (req, res) => {
  const { title, text, category_id, is_public, is_anonymous } = req.body;
  if (!title || !text || !category_id) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  if (title.length > 100) {
    return res.status(400).json({ error: 'Título demasiado largo (máximo 100 caracteres)' });
  }
  if (text.length > 5000) {
    return res.status(400).json({ error: 'Texto demasiado largo (máximo 5000 caracteres)' });
  }
  db.run(
    'UPDATE notes SET title = ?, text = ?, category_id = ?, is_public = ?, is_anonymous = ? WHERE id = ? AND user_id = ?',
    [title, text, category_id, is_public ? 1 : 0, is_anonymous ? 1 : 0, req.params.id, req.user.id],
    function(err) {
      if (err) return res.status(400).json({ error: 'Error al actualizar nota' });
      res.json({ message: 'Nota actualizada' });
    }
  );
});

// ELIMINAR NOTA
app.delete('/api/notes/:id', auth, (req, res) => {
  db.run('DELETE FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function(err) {
    if (err) return res.status(400).json({ error: 'Error al eliminar nota' });
    res.json({ message: 'Nota eliminada' });
  });
});

// SUBIR IMAGEN A NOTA (con manejo de errores mejorado)
app.post('/api/notes/:id/image', auth, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Imagen demasiado grande (máximo 2MB)' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'No se subió ninguna imagen' });
    const imageUrl = `/uploads/${req.file.filename}`;
    db.run('UPDATE notes SET image_url = ? WHERE id = ? AND user_id = ?', 
      [imageUrl, req.params.id, req.user.id], function(err) {
      if (err) return res.status(400).json({ error: 'Error al guardar imagen' });
      res.json({ imageUrl });
    });
  });
});

// OBTENER NOTAS PÚBLICAS (actualizada con filtros, autor y valoraciones)
app.get('/api/public', optionalAuth, (req, res) => {
  const { author, date_from, date_to } = req.query;
  
  let query = `
    SELECT n.id, n.title, n.text, n.image_url, n.created_at, n.is_anonymous,
           c.name as category_name,
           u.email as user_email, u.aka as user_aka, u.aka_public,
           (SELECT COUNT(*) FROM note_ratings WHERE note_id = n.id AND rating = 1) as likes,
           (SELECT COUNT(*) FROM note_ratings WHERE note_id = n.id AND rating = -1) as dislikes
    FROM notes n 
    LEFT JOIN categories c ON n.category_id = c.id 
    LEFT JOIN users u ON n.user_id = u.id
    WHERE n.is_public = 1
  `;
  
  const params = [];
  
  if (author) {
    query += ` AND (u.email LIKE ? OR u.aka LIKE ?)`;
    params.push(`%${author}%`, `%${author}%`);
  }
  
  if (date_from) {
    query += ` AND date(n.created_at) >= ?`;
    params.push(date_from);
  }
  
  if (date_to) {
    query += ` AND date(n.created_at) <= ?`;
    params.push(date_to);
  }
  
  query += ` ORDER BY n.created_at DESC`;
  
  db.all(query, params, (err, notes) => {
    if (err) return res.status(500).json({ error: 'Error al obtener notas públicas' });
    
    // Si hay usuario logueado, obtener sus valoraciones
    if (req.user) {
      const noteIds = notes.map(n => n.id);
      if (noteIds.length > 0) {
        const placeholders = noteIds.map(() => '?').join(',');
        db.all(
          `SELECT note_id, rating FROM note_ratings WHERE user_id = ? AND note_id IN (${placeholders})`,
          [req.user.id, ...noteIds],
          (err, userRatings) => {
            if (err) return res.status(500).json({ error: 'Error al obtener valoraciones' });
            
            const ratingsMap = {};
            userRatings.forEach(r => {
              ratingsMap[r.note_id] = r.rating;
            });
            
            const processedNotes = notes.map(note => {
              let displayAuthor = 'Anónimo';
              if (!note.is_anonymous) {
                if (note.aka_public && note.user_aka) {
                  displayAuthor = note.user_aka;
                } else {
                  displayAuthor = note.user_email;
                }
              }
              
              return {
                ...note,
                display_author: displayAuthor,
                user_rating: ratingsMap[note.id] || null
              };
            });
            
            res.json(processedNotes);
          }
        );
      } else {
        res.json([]);
      }
    } else {
      // Usuario no logueado
      const processedNotes = notes.map(note => {
        let displayAuthor = 'Anónimo';
        if (!note.is_anonymous) {
          if (note.aka_public && note.user_aka) {
            displayAuthor = note.user_aka;
          } else {
            displayAuthor = note.user_email;
          }
        }
        
        return {
          ...note,
          display_author: displayAuthor,
          user_rating: null
        };
      });
      
      res.json(processedNotes);
    }
  });
});

// OBTENER UNA NOTA PÚBLICA ESPECÍFICA (con valoraciones)
app.get('/api/public/:id', optionalAuth, (req, res) => {
  db.get(`
    SELECT n.*, c.name as category_name,
           u.email as user_email, u.aka as user_aka, u.aka_public,
           (SELECT COUNT(*) FROM note_ratings WHERE note_id = n.id AND rating = 1) as likes,
           (SELECT COUNT(*) FROM note_ratings WHERE note_id = n.id AND rating = -1) as dislikes
    FROM notes n 
    LEFT JOIN categories c ON n.category_id = c.id 
    LEFT JOIN users u ON n.user_id = u.id
    WHERE n.id = ? AND n.is_public = 1
  `, [req.params.id], (err, note) => {
    if (err || !note) return res.status(404).json({ error: 'Nota no encontrada' });
    
    // Procesar el autor
    let displayAuthor = 'Anónimo';
    if (!note.is_anonymous) {
      if (note.aka_public && note.user_aka) {
        displayAuthor = note.user_aka;
      } else {
        displayAuthor = note.user_email;
      }
    }
    
    // Si hay usuario logueado, obtener su valoración
    if (req.user) {
      db.get(
        'SELECT rating FROM note_ratings WHERE note_id = ? AND user_id = ?',
        [req.params.id, req.user.id],
        (err, userRating) => {
          res.json({
            ...note,
            display_author: displayAuthor,
            user_rating: userRating ? userRating.rating : null
          });
        }
      );
    } else {
      res.json({
        ...note,
        display_author: displayAuthor,
        user_rating: null
      });
    }
  });
});

// DAR LIKE/DISLIKE A UNA NOTA PÚBLICA
app.post('/api/public/:id/rate', auth, (req, res) => {
  const { rating } = req.body; // 1 para like, -1 para dislike
  const noteId = req.params.id;
  
  if (rating !== 1 && rating !== -1) {
    return res.status(400).json({ error: 'Rating debe ser 1 (like) o -1 (dislike)' });
  }
  
  // Verificar que la nota existe y es pública
  db.get('SELECT id FROM notes WHERE id = ? AND is_public = 1', [noteId], (err, note) => {
    if (err || !note) {
      return res.status(404).json({ error: 'Nota no encontrada o no es pública' });
    }
    
    // Insertar o actualizar la valoración
    db.run(
      'INSERT OR REPLACE INTO note_ratings (note_id, user_id, rating) VALUES (?, ?, ?)',
      [noteId, req.user.id, rating],
      function(err) {
        if (err) {
          return res.status(400).json({ error: 'Error al guardar valoración' });
        }
        res.json({ message: 'Valoración guardada', rating });
      }
    );
  });
});

// QUITAR VALORACIÓN DE UNA NOTA PÚBLICA
app.delete('/api/public/:id/rate', auth, (req, res) => {
  const noteId = req.params.id;
  
  db.run(
    'DELETE FROM note_ratings WHERE note_id = ? AND user_id = ?',
    [noteId, req.user.id],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Error al eliminar valoración' });
      }
      res.json({ message: 'Valoración eliminada' });
    }
  );
});

// OBTENER COMENTARIOS DE UNA NOTA PÚBLICA
app.get('/api/public/:id/comments', optionalAuth, (req, res) => {
  const noteId = req.params.id;
  db.all(`
    SELECT c.id, c.text, c.created_at, c.user_id,
           u.email as user_email, u.aka as user_aka, u.aka_public
    FROM note_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.note_id = ?
    ORDER BY c.created_at ASC
  `, [noteId], (err, comments) => {
    if (err) return res.status(500).json({ error: 'Error al obtener comentarios' });
    // Procesar autor
    const processed = comments.map(c => {
      let display_author = c.user_email;
      if (c.aka_public && c.user_aka) display_author = c.user_aka;
      return {
        id: c.id,
        text: c.text,
        created_at: c.created_at,
        user_id: c.user_id,
        display_author
      };
    });
    res.json(processed);
  });
});

// CREAR COMENTARIO EN UNA NOTA PÚBLICA
app.post('/api/public/:id/comments', auth, (req, res) => {
  const noteId = req.params.id;
  const { text } = req.body;
  if (!text || text.length < 1 || text.length > 1000) {
    return res.status(400).json({ error: 'El comentario debe tener entre 1 y 1000 caracteres' });
  }
  // Verificar que la nota es pública
  db.get('SELECT id FROM notes WHERE id = ? AND is_public = 1', [noteId], (err, note) => {
    if (err || !note) return res.status(404).json({ error: 'Nota no encontrada o no es pública' });
    db.run(
      'INSERT INTO note_comments (note_id, user_id, text) VALUES (?, ?, ?)',
      [noteId, req.user.id, text],
      function(err) {
        if (err) return res.status(400).json({ error: 'Error al guardar comentario' });
        res.json({ id: this.lastID, text, user_id: req.user.id });
      }
    );
  });
});

// ELIMINAR COMENTARIO (solo el autor puede)
app.delete('/api/public/:noteId/comments/:commentId', auth, (req, res) => {
  const { noteId, commentId } = req.params;
  db.get('SELECT * FROM note_comments WHERE id = ? AND note_id = ?', [commentId, noteId], (err, comment) => {
    if (err || !comment) return res.status(404).json({ error: 'Comentario no encontrado' });
    if (comment.user_id !== req.user.id) return res.status(403).json({ error: 'No puedes borrar este comentario' });
    db.run('DELETE FROM note_comments WHERE id = ?', [commentId], function(err) {
      if (err) return res.status(400).json({ error: 'Error al eliminar comentario' });
      res.json({ message: 'Comentario eliminado' });
    });
  });
});

// ELIMINAR IMAGEN DE UNA NOTA
app.delete('/api/notes/:id/image', auth, (req, res) => {
  db.get('SELECT image_url FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, note) => {
    if (err || !note || !note.image_url) return res.status(404).json({ error: 'Imagen no encontrada' });
    const filePath = path.join(__dirname, note.image_url);
    db.run('UPDATE notes SET image_url = NULL WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function(err2) {
      if (err2) return res.status(400).json({ error: 'Error al eliminar imagen' });
      // Elimina el archivo físico si existe
      fs.unlink(filePath, () => {});
      res.json({ message: 'Imagen eliminada' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});