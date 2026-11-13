import { Link } from 'react-router-dom';
import { Icono } from './Iconos.jsx';
import { pesos } from '../lib/unidades.js';

// Tablero del carpintero en grilla: etapas numeradas, curva de senas, perfil, numeros clave
// y rendimiento. Todo sale de los pedidos y del resumen que ya da el backend.

const EN_CURSO = ['ACEPTADO', 'MEDIDAS_VERIFICADAS', 'EN_FABRICACION'];
const COBRADOS = [...EN_CURSO, 'ENTREGADO'];
const PRESUPUESTADOS = ['PRESUPUESTADO', ...COBRADOS, 'RECHAZADO', 'VENCIDO'];

const porcentaje = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '—');
const corta = (d) => d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

/** Curva acumulada de senas cobradas, ordenada por fecha del pedido. */
function Curva({ pedidos }) {
  const cobrados = pedidos
    .filter((p) => COBRADOS.includes(p.estado) && p.presupuesto)
    .map((p) => ({ fecha: new Date(p.creado || Date.now()), sena: p.presupuesto.sena || 0 }))
    .sort((a, b) => a.fecha - b.fecha);
  let suma = 0;
  const puntos = [{ x: 0, y: 0 }, ...cobrados.map((c, i) => ({ x: i + 1, y: (suma += c.sena) }))];
  const W = 320;
  const H = 150;
  const maxX = Math.max(1, puntos.length - 1);
  const maxY = Math.max(1, suma);
  const xy = puntos.map((p) => [(p.x / maxX) * W, H - 8 - (p.y / maxY) * (H - 24)]);
  const linea = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${linea} L${W} ${H} L0 ${H} Z`;
  return (
    <>
      <svg className="curva" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Señas cobradas acumuladas">
        <defs>
          <linearGradient id="curva-relleno" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity=".18" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[1, 2, 3, 4, 5].map((i) => (
          <line key={i} x1={(W / 6) * i} x2={(W / 6) * i} y1="0" y2={H} className="curva-guia" />
        ))}
        {cobrados.length > 0 && <path d={area} fill="url(#curva-relleno)" />}
        <path d={linea} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="curva-fechas tenue">
        <span>{cobrados[0] ? corta(cobrados[0].fecha) : 'Inicio'}</span>
        <span>{cobrados.length ? corta(cobrados[cobrados.length - 1].fecha) : 'Hoy'}</span>
      </div>
    </>
  );
}

export default function TableroTaller({ pedidos, resumen, perfil, zona }) {
  const por = (estados) => pedidos.filter((p) => estados.includes(p.estado));
  const nuevos = por(['PENDIENTE']);
  const presupuestados = por(['PRESUPUESTADO']);
  const enCurso = por(EN_CURSO);
  const entregados = por(['ENTREGADO']);
  const cobrados = por(COBRADOS);
  const conPresupuesto = por(PRESUPUESTADOS);
  const sinLeer = nuevos.filter((p) => !p.leido).length;
  const facturado = cobrados.reduce((s, p) => s + (p.presupuesto?.total || 0), 0);
  const completo = perfil ? [perfil.zona, perfil.whatsapp, perfil.direccion, perfil.materiales?.length].filter(Boolean).length : 0;

  const etapas = [
    ['01', 'Pedidos nuevos', nuevos.length, 'Esperan tu presupuesto. Respondé dentro de las 72 horas.', sinLeer],
    ['02', 'Presupuestados', presupuestados.length, 'El cliente tiene 7 días para pagar la seña.'],
    ['03', 'En curso', enCurso.length, 'Con seña pagada: verificá medidas y fabricá.'],
  ];

  return (
    <div className="tablero">
      {/* Etapas numeradas */}
      <section className="tarjeta t-etapas">
        <div className="etapas">
          {etapas.map(([n, titulo, valor, texto, extra]) => (
            <div key={n} className={'etapa' + (n === '03' ? ' ancha' : '')}>
              <span className="etapa-num">{n}{extra > 0 && <span className="insignia">{extra} sin leer</span>}</span>
              <strong>{titulo} <span className="etapa-valor">{valor}</span></strong>
              <p className="tenue">{texto}</p>
            </div>
          ))}
        </div>
        <div className="puntos" aria-hidden="true" />
        <Link to="/panel" className="boton ancho">Abrir la bandeja<Icono nombre="flecha" /></Link>
      </section>

      {/* Perfil del taller */}
      <section className="tarjeta t-perfil">
        <div className="perfil-trama" aria-hidden="true" />
        <span className="t-perfil-icono"><Icono nombre="martillo" tam={26} /></span>
        <h3>{perfil?.nombre || 'Tu taller'}</h3>
        <p className="tenue">{zona ? `Carpintería en ${zona}` : 'Completá tu zona para aparecer en el mapa'}</p>
        <div className="progreso"><span style={{ width: `${(completo / 4) * 100}%` }} /></div>
        <p className="tenue chico">{completo} de 4 datos cargados · {perfil?.visible ? 'Visible en el mapa' : 'Oculto en el mapa'}</p>
        <Link to="/cuenta/perfil" className="boton claro ancho">Ver mi taller</Link>
      </section>

      {/* Curva de senas */}
      <section className="tarjeta t-curva">
        <div className="t-cabeza">
          <span className="tenue"><Icono nombre="grafico" tam={16} />Señas cobradas</span>
          <Link to="/cuenta/cobros" className="t-accion" aria-label="Ver cobros"><Icono nombre="billete" tam={16} /></Link>
        </div>
        <div className="t-monto">
          <span className="numero">{pesos(resumen?.senasCobradas)}</span>
          {cobrados.length > 0 && <span className="chip bien"><Icono nombre="flecha" tam={12} />{cobrados.length} con seña</span>}
        </div>
        <Curva pedidos={pedidos} />
      </section>

      {/* Numeros clave */}
      <section className="tarjeta t-claves">
        <div className="t-claves-cabeza">
          <h3>Tu taller en números</h3>
          <span className="tenue chico">Desde que te sumaste</span>
        </div>
        <div className="claves">
          <div><strong><Icono nombre="lista" tam={18} />{resumen?.trabajos || 0}</strong><span className="tenue">Trabajos pagados</span></div>
          <div><strong><Icono nombre="caja" tam={18} />{entregados.length}</strong><span className="tenue">Entregados</span></div>
          <div><strong><Icono nombre="escudo" tam={18} />{porcentaje(cobrados.length, conPresupuesto.length)}</strong><span className="tenue">Aceptación</span></div>
        </div>
        <Link to="/cuenta/cobros" className="boton claro ancho"><Icono nombre="billete" />Ver cobros <span className="etiqueta-suave">{pesos(resumen?.senasCobradas)}</span></Link>
      </section>

      {/* Rendimiento */}
      <section className="tarjeta t-rendimiento">
        <div className="t-cabeza">
          <span><Icono nombre="reloj" tam={16} />Rendimiento</span>
          <span className="chip">{pedidos.length} pedidos</span>
        </div>
        <div className="cajas">
          <div><span className="tenue"><i className="punto-color" />Total presupuestado</span><span className="numero">{pesos(facturado)}</span></div>
          <div><span className="tenue"><i className="punto-color otro" />Comisión Viruta</span><span className="numero">{pesos(resumen?.comision)}</span></div>
        </div>
        <ul className="tabla-limpia">
          <li><span><strong>Presupuestos enviados</strong><span className="tenue">{conPresupuesto.length} de {pedidos.length}</span></span><span>{porcentaje(conPresupuesto.length, pedidos.length)}</span></li>
          <li><span><strong>Señas pagadas</strong><span className="tenue">{cobrados.length} de {conPresupuesto.length}</span></span><span>{porcentaje(cobrados.length, conPresupuesto.length)}</span></li>
          <li><span><strong>Entregados</strong><span className="tenue">{entregados.length} de {cobrados.length}</span></span><span>{porcentaje(entregados.length, cobrados.length)}</span></li>
        </ul>
      </section>
    </div>
  );
}
