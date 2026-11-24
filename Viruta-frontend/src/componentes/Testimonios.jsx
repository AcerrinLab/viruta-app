import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useSesion } from '../App.jsx';
import { Icono } from './Iconos.jsx';
import { Blobatar } from '@blobatar/react';
import 'blobatar/motion.css';

// Testimonios de quienes probaron la version de testing. Solo se muestran los aprobados por un
// administrador. Si la persona entro con Google, se ve su foto de perfil.

/**
 * Avatar de la persona: su foto (Google) si tiene; si no, un blobatar unico generado a partir de
 * su email o su nombre (https://blobatar.dev). Siempre sale el mismo para la misma persona.
 * Los grandes (perfil) se animan al pasar el mouse.
 */
export function Avatar({ nombre, foto, semilla, tam = 56 }) {
  const [rota, setRota] = useState(false);
  if (foto && !rota) {
    return <img className="avatar-foto" src={foto} alt="" width={tam} height={tam} referrerPolicy="no-referrer" onError={() => setRota(true)} />;
  }
  const clave = (semilla || nombre || 'viruta').trim().toLowerCase();
  return (
    <span className="avatar-blob" style={{ width: tam, height: tam }} title={nombre || undefined}>
      {tam >= 72
        ? <Blobatar name={clave} size={tam} animate="hover" aria-hidden="true" />
        : <Blobatar name={clave} size={tam} alt="" aria-hidden="true" />}
    </span>
  );
}

export default function Testimonios() {
  const [lista, setLista] = useState(null);
  const pista = useRef(null);
  const { sesion } = useSesion();

  useEffect(() => {
    api('/api/testimonios').then(setLista).catch(() => setLista([]));
  }, []);

  if (!lista || lista.length === 0) {
    return sesion ? (
      <section className="testimonios vacio-testimonios">
        <p className="tenue">¿Probaste Viruta? Contanos cómo te fue.</p>
        <Link to="/cuenta/comentario" className="boton claro"><Icono nombre="enviar" />Dejar mi comentario</Link>
      </section>
    ) : null;
  }

  const mover = (dir) => pista.current?.scrollBy({ left: dir * pista.current.clientWidth * 0.9, behavior: 'smooth' });

  return (
    <section className="testimonios" aria-labelledby="titulo-testimonios">
      <div className="testimonios-cabeza">
        <div>
          <span className="antetitulo">Versión de testing</span>
          <h2 id="titulo-testimonios">Lo que dicen quienes ya la probaron</h2>
        </div>
        {lista.length > 3 && (
          <div className="fila">
            <button className="volver-circulo" onClick={() => mover(-1)} aria-label="Anteriores"><Icono nombre="volver" /></button>
            <button className="volver-circulo" onClick={() => mover(1)} aria-label="Siguientes"><Icono nombre="adelante" /></button>
          </div>
        )}
      </div>
      <div className="testimonios-pista" ref={pista}>
        {lista.map((t) => (
          <article key={t.id} className="tarjeta testimonio">
            <header>
              <Avatar nombre={t.nombre} foto={t.fotoUrl} />
              <div>
                <strong>{t.nombre}</strong>
                {t.detalle && <span className="tenue">{t.detalle}</span>}
              </div>
            </header>
            <blockquote>«{t.texto}»</blockquote>
          </article>
        ))}
      </div>
      {sesion && <Link to="/cuenta/comentario" className="boton plano"><Icono nombre="enviar" />Dejar mi comentario</Link>}
    </section>
  );
}
