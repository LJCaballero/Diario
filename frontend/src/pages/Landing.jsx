export default function Landing({ setPage }) {
  return (
    <div className="container" style={{alignItems: 'center', textAlign: 'center'}}>
      <h2>📝 Notas Abiertas</h2>
      <p style={{lineHeight: '1.6', marginBottom: '2em'}}>
        Bienvenido a <b>Notas Abiertas</b>, el lugar donde puedes guardar tus notas personales y compartir ideas con el mundo.
        <br /><br />
        <b>¿Qué puedes hacer aquí?</b><br />
        ✅ Crear notas privadas solo para ti<br />
        ✅ Hacer públicas tus notas para que todos las vean<br />
        ✅ Ver el muro público de notas de toda la comunidad<br />
        ✅ Organizar tus notas por categorías<br />
        ✅ Agregar imágenes a tus notas
        <br /><br />
        <b>¡Empieza ahora!</b>
      </p>
      <button onClick={() => setPage('publicwall')}>🌍 Ver Notas Públicas</button>
      <button className="secondary" style={{marginTop: '1em'}} onClick={() => setPage('login')}>🔐 Iniciar sesión / Registrarse</button>
    </div>
  );
}