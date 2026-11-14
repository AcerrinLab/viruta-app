import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useSesion } from '../App.jsx';
import { Selector, aplicarTema } from '../componentes/Comunes.jsx';
import { Icono } from '../componentes/Iconos.jsx';
import Testimonios from '../componentes/Testimonios.jsx';

/** Pagina publica de la lista de espera (la landing en Vercel). Se puede cambiar con VITE_WISHLIST_URL. */
const WISHLIST = (import.meta.env.VITE_WISHLIST_URL || 'https://viruta-wishlist.vercel.app/').replace(/\/?$/, '/');

const numero = (n) => Number(n || 0).toLocaleString('es-AR');

/** Portada: propuesta, lista de espera conectada a la wishlist y testimonios (RF-20). */
export default function Inicio() {
  const [contador, setContador] = useState(null);
  const [tipo, setTipo] = useState('CLIENTE');
  const { sesion } = useSesion();

  // El color de la pagina acompana al perfil elegido en la lista de espera.
  useEffect(() => {
    aplicarTema(sesion ? sesion.rol : tipo);
    return () => aplicarTema(sesion?.rol);
  }, [tipo, sesion]);

  useEffect(() => {
    api('/api/lista-espera/contador').then(setContador).catch(() => {});
  }, []);

  const destino = WISHLIST + (tipo === 'CARPINTERIA' ? '?rol=taller' : '');

  return (
    <main>
      <section className="portada">
        <span className="antetitulo">Muebles a medida en Jujuy</span>
        <h1>Tu mueble a medida, sin errores de medida.</h1>
        <p className="bajada">
          Diseñalo, miralo en tu casa con la cámara y encargalo a una carpintería de Jujuy.
        </p>
        <div className="fila">
          <Link to="/disenar" className="boton"><Icono nombre="cubo" />Diseñar mi mueble</Link>
          <Link to="/ingresar?rol=CARPINTERIA" className="boton claro"><Icono nombre="martillo" />Soy carpintería</Link>
        </div>
      </section>

      <section className="tarjeta pila espera" style={{ marginTop: 36, maxWidth: 520, padding: 24, borderRadius: 24 }}>
        <div>
          <h2>Lista de espera</h2>
          <p className="tenue">Sumate desde nuestra página y te avisamos cuando abramos en tu zona.</p>
        </div>
        {contador && (
          <div className="espera-numeros" aria-label="Personas anotadas">
            <div><span className="numero">{numero(contador.total)}</span><span className="tenue chico">anotados</span></div>
            <div><span className="numero">{numero(contador.clientes)}</span><span className="tenue chico">quieren un mueble</span></div>
            <div><span className="numero">{numero(contador.carpinterias)}</span><span className="tenue chico">talleres</span></div>
          </div>
        )}
        <Selector etiqueta="Perfil" ancho valor={tipo} alCambiar={setTipo}
          opciones={[['CLIENTE', 'Quiero un mueble'], ['CARPINTERIA', 'Tengo una carpintería']]} />
        <a className="boton ancho" href={destino} target="_blank" rel="noopener noreferrer">
          <Icono nombre="campana" />{tipo === 'CARPINTERIA' ? 'Pre-inscribir mi taller' : 'Sumarme a la lista'}<Icono nombre="flecha" />
        </a>
        <p className="tenue chico">Se abre la página de la lista de espera en otra pestaña.</p>
      </section>

      <Testimonios />
    </main>
  );
}
