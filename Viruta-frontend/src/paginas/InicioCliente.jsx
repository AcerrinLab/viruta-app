import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Chip, PasosPedido } from '../componentes/Comunes.jsx';
import { Icono } from '../componentes/Iconos.jsx';
import Miniatura, { piezasDe } from '../componentes/Miniatura.jsx';
import { MATERIALES, PLANTILLAS } from '../lib/diseno.js';
import { resumenCliente } from '../lib/inicioCliente.js';
import { medidas, pesos } from '../lib/unidades.js';

/**
 * Inicio del cliente con sesion: lo que le toca hacer, sus pedidos en curso y sus proyectos para
 * retomar. Reemplaza a la portada publica (lista de espera y "Soy carpinteria") cuando ya entro.
 */
export default function InicioCliente({ sesion }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/api/pedidos'), api('/api/proyectos')])
      .then(([pedidos, proyectos]) => setDatos(resumenCliente(pedidos, proyectos)))
      .catch((p) => { setError(p.message); setDatos(resumenCliente([], [])); });
  }, []);

  const nombre = (sesion.nombre || '').split(' ')[0];
  const vacio = datos && datos.enCurso.length === 0 && datos.proyectos.length === 0 && datos.entregados === 0;

  return (
    <main className="inicio-cliente">
      <section className="ic-cabeza">
        <div>
          <span className="antetitulo">Tu espacio en Viruta</span>
          <h1>Hola, {nombre}.</h1>
          <p className="bajada">
            {datos?.atencion.length
              ? `Tenés ${datos.atencion.length === 1 ? 'un presupuesto listo' : datos.atencion.length + ' presupuestos listos'} para revisar.`
              : 'Esto es lo que tenés en marcha.'}
          </p>
        </div>
        <div className="fila">
          <Link to="/disenar" className="boton"><Icono nombre="cubo" />Diseñar un mueble nuevo</Link>
          <Link to="/mis-pedidos" className="boton claro"><Icono nombre="bandeja" />Mis pedidos</Link>
        </div>
        {datos && !vacio && (
          <div className="ic-numeros">
            <span><b>{datos.enCurso.length}</b> en curso</span>
            <span><b>{datos.entregados}</b> entregados</span>
            <span><b>{datos.proyectos.length}</b> proyectos recientes</span>
          </div>
        )}
      </section>

      {error && <p className="nota error">{error}</p>}
      {!datos && (
        <div className="cargando" aria-busy="true">
          <span className="esqueleto esqueleto-bloque corto" />
          <span className="esqueleto esqueleto-bloque" />
        </div>
      )}

      {datos?.atencion.length > 0 && (
        <section className="ic-seccion">
          <h2>Para resolver ahora</h2>
          <div className="ic-atencion">
            {datos.atencion.map((p) => (
              <article key={p.id} className="tarjeta ic-destacado">
                <Miniatura piezas={piezasDe(p)} color={p.diseno.color} tam={84} />
                <div className="ic-texto">
                  <span className="chip aviso">Presupuesto listo</span>
                  <h3>{p.diseno.nombre}</h3>
                  <p className="tenue">{p.carpinteria?.nombre}{p.presupuesto ? ` · ${pesos(p.presupuesto.total)} (seña ${pesos(p.presupuesto.sena)})` : ''}</p>
                </div>
                <Link to="/mis-pedidos" className="boton"><Icono nombre="carrito" />{p.accion}</Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {datos?.enCurso.length > 0 && (
        <section className="ic-seccion">
          <div className="ic-titulo"><h2>Pedidos en curso</h2><Link to="/mis-pedidos" className="boton plano">Ver todos</Link></div>
          <div className="ic-lista">
            {datos.enCurso.map((p) => (
              <Link key={p.id} to="/mis-pedidos" className="tarjeta ic-pedido">
                <Miniatura piezas={piezasDe(p)} color={p.diseno.color} tam={56} />
                <div className="ic-texto">
                  <div className="ic-fila"><strong>{p.diseno.nombre}</strong><Chip estado={p.estado} /></div>
                  <span className="tenue chico">{p.carpinteria?.nombre} · {medidas(p.diseno)}</span>
                  <PasosPedido estado={p.estado} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {datos?.proyectos.length > 0 && (
        <section className="ic-seccion">
          <div className="ic-titulo"><h2>Retomá un diseño</h2><Link to="/cuenta/proyectos" className="boton plano">Ver todos</Link></div>
          <div className="ic-proyectos">
            {datos.proyectos.map((p) => (
              <Link key={p.id} to={'/disenar?proyecto=' + p.id} className={'tarjeta ic-proyecto' + (PLANTILLAS[p.diseno.plantilla]?.coleccion === 'ANTIGUOS' ? ' pieza-antigua' : '')}>
                <span className="ic-proyecto-ico"><Icono nombre="cubo" tam={22} /></span>
                <strong>{p.diseno.nombre}</strong>
                <span className="tenue chico">{medidas(p.diseno)} · {MATERIALES[p.diseno.material]}</span>
                <span className="ic-seguir">Seguir diseñando <Icono nombre="flecha" tam={14} /></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {vacio && (
        <section className="tarjeta ic-vacio">
          <h2>Empezá tu primer mueble</h2>
          <p className="tenue">Elegí una plantilla, ajustá las medidas a tu espacio y miralo en tu casa con la cámara.</p>
          <div className="ic-plantillas">
            {Object.entries(PLANTILLAS).map(([id, p]) => (
              <Link key={id} to="/disenar" className={'opcion' + (p.coleccion === 'ANTIGUOS' ? ' antigua' : '')}>{p.etiqueta}</Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
