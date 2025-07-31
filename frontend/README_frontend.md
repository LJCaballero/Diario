# Frontend de Notas Abiertas

Este es el frontend de la app Notas Abiertas.  
Aquí es donde los usuarios interactúan con la aplicación.

## ¿Qué tecnologías usa?

- **React** (con hooks y componentes funcionales)
- **CSS** moderno y responsivo
- **axios** para conectar con el backend

## ¿Cómo lo ejecuto? (Modo local)

1. **Instala dependencias**  
   En la carpeta `/frontend` ejecuta:
   npm install


2. **Arranca el servidor de desarrollo**  
npm run dev

El frontend correrá en [http://localhost:5173](http://localhost:5173) (o el puerto que indique Vite).

3. **Conexión con el backend**  
- Por defecto, el frontend espera que el backend esté en `http://localhost:3001`.
- Si cambias el puerto del backend, actualiza las URLs en `axiosInstance.js`.

## ¿Cómo está organizado el código?

- **/pages**: Cada página principal de la app (Login, Registro, Notas, etc.).
- **/components**: (si tienes) Componentes reutilizables.
- **App.jsx**: Controla la navegación y el estado global.
- **axiosInstance.js**: Configura las peticiones HTTP y el manejo del token.

## ¿Cómo funciona la autenticación?

- Al iniciar sesión, el token se guarda en localStorage.
- El token se manda en cada petición privada.
- Si el token expira o es inválido, la app te pide volver a iniciar sesión.

## ¿Cómo puedo personalizarlo?

- Cambia los estilos en el archivo CSS principal.
- Agrega o modifica páginas en `/pages`.
- Puedes adaptar la navegación, los formularios o las categorías según tus necesidades.

---

**¡El frontend está pensado para ser fácil de modificar y entender, tanto si eres nuevo en React como si ya tienes experiencia!**