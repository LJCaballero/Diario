# Backend de Notas Abiertas

Este es el servidor backend de la app Notas Abiertas.  
Aquí se gestionan usuarios, notas, categorías, comentarios y la autenticación.

## ¿Qué tecnologías usa?

- **Node.js** con **Express** para el servidor.
- **SQLite** como base de datos (fácil de usar y sin configuración extra).
- **JWT** para autenticación de usuarios.

## ¿Cómo lo ejecuto? (Modo local)

1. **Instala dependencias**  
   En la carpeta `/backend` ejecuta:
   npm install


2. **Arranca el servidor**  
npm start

El backend correrá en [http://localhost:3001](http://localhost:3001)

3. **Base de datos**  
- Se crea automáticamente un archivo `database.sqlite` en la carpeta.
- Si quieres empezar de cero, borra ese archivo y reinicia el servidor.

## ¿Qué endpoints hay?

- POST`/api/register` — Crea un usuario nuevo.
- POST`/api/login` — Devuelve un token JWT.
- GET, POST, PUT, PATCH, DELETE`/api/notes` — CRUD de notas (privadas y públicas).
- GET, POST, PUT, PATCH, DELETE`/api/categories` — CRUD de categorías.
- GET`/api/public` — Consulta de notas públicas.
- POST`/api/comments` — Comentar en notas públicas.
- GET, PATCH`/api/user` — Perfil y alias del usuario.

Todos los endpoints privados requieren el header:  
Authorization:


## ¿Cómo se conecta con el frontend?

- El frontend hace peticiones HTTP a este backend usando fetch o axios.
- El token JWT se guarda en el navegador y se manda en cada petición privada.

## ¿Puedo cambiar la base de datos?

Sí, pero por defecto es SQLite para que no tengas que configurar nada.  
Si quieres usar otra base, adapta la conexión en `index.js`.

---

**¡Listo! El backend está pensado para que puedas probar, modificar y entenderlo fácilmente.**