import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Chip, PasosPedido } from '../componentes/Comunes.jsx';
import { Icono } from '../componentes/Iconos.jsx';
import Miniatura, { piezasDe } from '../componentes/Miniatura.jsx';
import { resumenTaller } from '../lib/inicioTaller.js';
import { medidas, pesos } from '../lib/unidades.js';
import { MATERIALES } from '../lib/diseno.js';

const horas = (h) => (h <= 0 ? 'Vence hoy' : h < 24 ? `Quedan ${h} h` : `Quedan ${Math.floor(h / 24)} d ${h % 24} h`);

/**
 * Inicio del carpintero con sesion: lo que vence primero (pedidos nuevos, 72 h para responder), los
 * trabajos que tiene que avanzar, sus numeros y lo que le falta al perfil para aparecer en el mapa.
 */
export default function InicioTaller({ sesion }) {
  const [datos, setDatos] = useState(null);
  const [cobros, setCobros] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/api/carpinteria/pedidos'), api('/api/carpinteria/perfil')])
      .then(([pedidos, p]) => { setPerfil(p); setDatos(resumenTaller(pedidos, p)); })
      .catch((e) => { setError(e.message); setDatos(resumenTaller([], null)); });
    api('/api/carpinteria/resumen').then(setCobros).catch(() => {});
  }, []);

  const nombre = perfil?.nombre || (sesion.nombre || '').split(' ')[0];
  const urgentes = datos?.responder.filter((p) => p.urgente).length || 0;

  return (
    <main className="inicio-cliente inicio-taller">
      <section className="ic-cabeza">
        <div>
          <span className="antetitulo">Tu taller en Viruta</span>
          <h1>Hola, {nombre}.</h1>
          <p className="bajada">
            {!datos ? 'Revisando tus pedidos…'
              : datos.responder.length
                ? `Tenés ${datos.responder.length === 1 ? 'un pedido nuevo' : datos.responder.length + ' pedidos nuevos'} para presupuestar${urgentes ? `, ${urgentes} por vencer` : ''}.`
                : datos.avanzar.length ? 'No hay pedidos nuevos. Estos son tus trabajos en marcha.' : 'Todo al día. Cuando entre un pedido te avisamos acá.'}
          </p>
        </div>
        <div className="fila">
          <Link to="/panel" className="boton"><Icono nombre="bandeja" />Abrir la bandeja</Link>
          <Link to="/cuenta/resumen" className="boton claro"><Icono nombre="grafico" />Ver estadísticas</Link>
        </div>
      </section>

      {error && <p className="nota error">{error}</p>}
      {!datos && (
        <div className="cargando" aria-busy="true">
          <span className="esqueleto esqueleto-bloque corto" />
          <span className="esqueleto esqueleto-bloque" />
        </div>
      )}

      {datos && (
        <div className="it-numeros">
          <div className="tarjeta it-numero"><span className="indicador-icono"><Icono nombre="campana" tam={18} /></span><span className="numero">{datos.responder.length}</span><span className="tenue chico">para presupuestar</span></div>
          <div className="tarjeta it-numero"><span className="indicador-icono"><Icono nombre="reloj" tam={18} /></span><span className="numero">{datos.avanzar.length}</span><span className="tenue chico">trabajos en marcha</span></div>
          <div className="tarjeta it-numero"><span className="indicador-icono"><Icono nombre="persona" tam={18} /></span><span className="numero">{datos.esperandoCliente}</span><span className="tenue chico">esperando al cliente</span></div>
          <div className="tarjeta it-numero"><span className="indicador-icono"><Icono nombre="billete" tam={18} /></span><span className="numero">{pesos(cobros?.senasCobradas)}</span><span className="tenue chico">en señas cobradas</span></div>
        </div>
      )}

      {datos?.responder.length > 0 && (
        <section className="ic-seccion">
          <div className="ic-titulo"><h2>Para presupuestar</h2><span className="tenue chico">Tenés 72 h para responder cada pedido</span></div>
          <div className="ic-atencion">
            {datos.responder.map((p) => (
              <article key={p.id} className={'tarjeta ic-destacado' + (p.urgente ? '' : ' tranquilo')}>
                <Miniatura piezas={piezasDe(p)} color={p.diseno.color} tam={84} />
                <div className="ic-texto">
                  <span className={'chip ' + (p.urgente ? 'aviso' : '')}>{!p.leido ? 'Nuevo · ' : ''}{horas(p.horasRestantes)}</span>
                  <h3>{p.diseno.nombre}</h3>
                  <p className="tenue">{p.cliente?.nombre} · {medidas(p.diseno)} · {MATERIALES[p.diseno.material]}</p>
                </div>
                <Link to={'/panel?pedido=' + p.id} className="boton"><Icono nombre="enviar" />Presupuestar</Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {datos?.avanzar.length > 0 && (
        <section className="ic-seccion">
          <div className="ic-titulo"><h2>Trabajos en marcha</h2><Link to="/panel" className="boton plano">Ver la bandeja</Link></div>
          <div className="ic-lista">
            {datos.avanzar.map((p) => (
              <Link key={p.id} to={'/panel?pedido=' + p.id} className="tarjeta ic-pedido">
                <Miniatura piezas={piezasDe(p)} color={p.diseno.color} tam={56} />
                <div className="ic-texto">
                  <div className="ic-fila"><strong>{p.diseno.nombre}</strong><Chip estado={p.estado} /></div>
                  <span className="tenue chico">{p.cliente?.nombre}{p.presupuesto ? ` · ${pesos(p.presupuesto.total)}` : ''} · Siguiente: {p.accion}</span>
                  <PasosPedido estado={p.estado} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {datos && datos.perfil.faltan.length > 0 && (
        <section className="tarjeta it-perfil">
          <div className="ic-texto">
            <h3>Completá tu taller para aparecer en el mapa</h3>
            <div className="progreso"><span style={{ width: `${(datos.perfil.completos / datos.perfil.total) * 100}%` }} /></div>
            <p className="tenue chico">Te falta: {datos.perfil.faltan.join(', ')}.</p>
          </div>
          <Link to="/panel?editar=1" className="boton claro"><Icono nombre="martillo" />Completar perfil</Link>
        </section>
      )}

      {datos && datos.responder.length === 0 && datos.avanzar.length === 0 && (
        <section className="tarjeta ic-vacio">
          <h2>Mientras tanto</h2>
          <p className="tenue">Los clientes de tu zona te encuentran en el mapa cuando eligen dónde pedir. Tener el perfil completo y responder rápido te pone primero.</p>
          <div className="ic-plantillas">
            <Link to="/cuenta/perfil" className="opcion">Mi taller</Link>
            <Link to="/cuenta/cobros" className="opcion">Cobros</Link>
            <Link to="/cuenta/comentario" className="opcion">Dejar un comentario</Link>
          </div>
        </section>
      )}
    </main>
  );
}
