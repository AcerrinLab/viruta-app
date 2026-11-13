import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useSesion } from '../App.jsx';
import { Chip, Interruptor, Selector } from '../componentes/Comunes.jsx';
import { Icono } from '../componentes/Iconos.jsx';
import TableroTaller from '../componentes/TableroTaller.jsx';
import TarjetasTaller from '../componentes/TarjetasTaller.jsx';
import { MATERIALES } from '../lib/diseno.js';
import { ESTADOS } from '../lib/estados.js';
import { guardarTema, olvidarTema, temaGuardado, usarAmbiente, usarMovil } from '../lib/tema.js';
import { medidas, pesos } from '../lib/unidades.js';

/** Secciones de la cuenta segun el rol: icono y nombre, como un menu de ajustes. */
const SECCIONES = {
  CLIENTE: [
    ['perfil', 'persona', 'Perfil'],
    ['proyectos', 'cubo', 'Mis proyectos'],
    ['pedidos', 'bandeja', 'Mis pedidos'],
    ['preferencias', 'ajustes', 'Preferencias'],
    ['seguridad', 'escudo', 'Seguridad'],
  ],
  CARPINTERIA: [
    ['resumen', 'grafico', 'Resumen'],
    ['perfil', 'martillo', 'Mi taller'],
    ['pedidos', 'bandeja', 'Pedidos'],
    ['cobros', 'billete', 'Cobros'],
    ['preferencias', 'ajustes', 'Preferencias'],
    ['seguridad', 'escudo', 'Seguridad'],
  ],
};

const EN_CURSO = ['ACEPTADO', 'MEDIDAS_VERIFICADAS', 'EN_FABRICACION'];
const COBRADOS = [...EN_CURSO, 'ENTREGADO'];

function iniciales(nombre = '') {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase() || 'V';
}

const fecha = (texto) => {
  if (!texto) return '';
  const d = new Date(texto);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
};

/** Lista de datos con etiqueta a la izquierda y valor a la derecha. */
function Datos({ titulo, filas, pie }) {
  return (
    <section className="tarjeta datos">
      <h3>{titulo}</h3>
      <dl>
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="dato-fila">
            <dt>{etiqueta}</dt>
            <dd>{valor ?? <span className="tenue">Sin cargar</span>}</dd>
          </div>
        ))}
      </dl>
      {pie}
    </section>
  );
}

function Indicador({ icono, etiqueta, valor, detalle }) {
  return (
    <div className="tarjeta indicador">
      <span className="indicador-icono"><Icono nombre={icono} tam={18} /></span>
      <span className="tenue">{etiqueta}</span>
      <span className="numero">{valor}</span>
      {detalle && <span className="tenue chico">{detalle}</span>}
    </div>
  );
}

function Cabecera({ sesion, subtitulo, verificado }) {
  return (
    <header className="perfil-cabecera">
      <div className="perfil-trama" aria-hidden="true" />
      <span className="avatar grande">{iniciales(sesion.nombre)}</span>
      <div>
        <h1>
          {sesion.nombre}
          {verificado && (
            <span className="sello" title="Taller visible en el mapa" aria-label="Visible en el mapa">
              <Icono nombre="sello" tam={22} />
            </span>
          )}
        </h1>
        <p className="tenue">{subtitulo}</p>
      </div>
    </header>
  );
}

function Fila({ icono, titulo, detalle, a, extra }) {
  const cuerpo = (
    <>
      <span className="fila-icono"><Icono nombre={icono} tam={18} /></span>
      <span className="fila-texto"><strong>{titulo}</strong><span className="tenue">{detalle}</span></span>
      {extra}
      {a && <span className="fila-flecha"><Icono nombre="adelante" tam={16} /></span>}
    </>
  );
  return a ? <Link to={a} className="fila-lista">{cuerpo}</Link> : <div className="fila-lista">{cuerpo}</div>;
}

function Preferencias() {
  const [tema, setTema] = useState(temaGuardado() || 'sistema');
  const [ambiente, setAmbiente] = usarAmbiente();
  const cambiar = (t) => {
    setTema(t);
    if (t === 'sistema') olvidarTema();
    else guardarTema(t);
  };
  return (
    <section className="tarjeta datos">
      <h3>Apariencia</h3>
      <p className="tenue chico" style={{ marginBottom: 12 }}>Elegí cómo se ve Viruta en este dispositivo.</p>
      <Selector etiqueta="Tema" valor={tema} alCambiar={cambiar}
        opciones={[['sistema', 'Automático'], ['claro', 'Claro'], ['oscuro', 'Oscuro']]} />
      <dl className="ajustes">
        <div className="dato-fila">
          <dt><strong>Luces de fondo</strong><span className="tenue chico">Los colores que se ven detrás del vidrio.</span></dt>
          <dd><Interruptor etiqueta="Luces de fondo" activo={ambiente.luces} alCambiar={(v) => setAmbiente({ luces: v })} /></dd>
        </div>
        <div className={'dato-fila' + (ambiente.luces ? '' : ' apagada')}>
          <dt><strong>Movimiento de las luces</strong><span className="tenue chico">Apagalo si preferís un fondo quieto.</span></dt>
          <dd><Interruptor etiqueta="Movimiento de las luces" activo={ambiente.luces && ambiente.movimiento} alCambiar={(v) => setAmbiente({ movimiento: v })} /></dd>
        </div>
      </dl>
    </section>
  );
}

function Seguridad({ sesion, alSalir }) {
  return (
    <Datos
      titulo="Sesión y datos"
      filas={[
        ['Sesión', 'Activa en este dispositivo'],
        ['Cuenta', sesion.email || sesion.nombre],
        ['Tus datos', 'Protegidos por la Ley 25.326'],
      ]}
      pie={<button className="boton claro" style={{ marginTop: 16 }} onClick={alSalir}><Icono nombre="salir" />Cerrar sesión</button>}
    />
  );
}

/* ---------------- Cliente ---------------- */

function CuentaCliente({ seccion, sesion, salir }) {
  const [pedidos, setPedidos] = useState(null);
  const [proyectos, setProyectos] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([api('/api/pedidos'), api('/api/proyectos')])
      .then(([a, b]) => { setPedidos(a); setProyectos(b); })
      .catch((p) => setError(p.message));
  }, []);
  const activos = (pedidos || []).filter((p) => !['ENTREGADO', 'RECHAZADO', 'VENCIDO', 'CANCELADO'].includes(p.estado)).length;

  return (
    <>
      {error && <p className="nota error">{error}</p>}
      {seccion === 'perfil' && (
        <>
          <Cabecera sesion={sesion} subtitulo={sesion.email || 'Cliente de Viruta'} />
          <Datos titulo="Datos personales" filas={[
            ['Nombre completo', sesion.nombre],
            ['Email', sesion.email],
            ['Tipo de cuenta', 'Cliente'],
            ['Proyectos guardados', proyectos ? proyectos.length : '...'],
            ['Pedidos activos', pedidos ? activos : '...'],
          ]} />
        </>
      )}
      {seccion === 'proyectos' && (
        <section className="tarjeta lista">
          <div className="lista-cabeza"><h3>Mis proyectos</h3><Link to="/disenar" className="boton claro"><Icono nombre="cubo" />Nuevo</Link></div>
          {proyectos?.length === 0 && <p className="tenue vacio">Todavía no guardaste ningún diseño.</p>}
          {(proyectos || []).map((p) => (
            <Fila key={p.id} icono="cubo" titulo={p.diseno.nombre} a={'/disenar?proyecto=' + p.id}
              detalle={`${medidas(p.diseno)} · ${MATERIALES[p.diseno.material]}${p.actualizado ? ' · ' + fecha(p.actualizado) : ''}`} />
          ))}
        </section>
      )}
      {seccion === 'pedidos' && (
        <section className="tarjeta lista">
          <div className="lista-cabeza"><h3>Mis pedidos</h3><Link to="/mis-pedidos" className="boton plano">Ver detalle</Link></div>
          {pedidos?.length === 0 && <p className="tenue vacio">Todavía no pediste ningún presupuesto.</p>}
          {(pedidos || []).map((p) => (
            <Fila key={p.id} icono="bandeja" titulo={p.diseno.nombre} a="/mis-pedidos"
              detalle={`${p.carpinteria?.nombre || ''}${p.presupuesto ? ' · ' + pesos(p.presupuesto.total) : ''}`}
              extra={<Chip estado={p.estado} />} />
          ))}
        </section>
      )}
      {seccion === 'preferencias' && <Preferencias />}
      {seccion === 'seguridad' && <Seguridad sesion={sesion} alSalir={salir} />}
    </>
  );
}

/* ---------------- Carpinteria ---------------- */

/** El resumen se puede ver en grilla o en tarjetas; la eleccion queda guardada. */
function VistaResumen(props) {
  const [vista, setVista] = useState(() => {
    try { return localStorage.getItem('viruta.vistaResumen') || 'grilla'; } catch { return 'grilla'; }
  });
  const cambiar = (v) => {
    setVista(v);
    try { localStorage.setItem('viruta.vistaResumen', v); } catch { /* sin almacenamiento */ }
  };
  return (
    <>
      <div className="vista-resumen">
        <Selector etiqueta="Vista de las estadísticas" valor={vista} alCambiar={cambiar}
          opciones={[['grilla', 'Grilla'], ['tarjetas', 'Tarjetas']]} />
      </div>
      {vista === 'tarjetas' ? <TarjetasTaller {...props} /> : <TableroTaller {...props} />}
    </>
  );
}

function CuentaTaller({ seccion, sesion, salir }) {
  const [perfil, setPerfil] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [zonas, setZonas] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/carpinteria/perfil').then(setPerfil).catch((p) => setError(p.message));
    api('/api/carpinteria/zonas').then(setZonas).catch(() => {});
    Promise.all([api('/api/carpinteria/pedidos'), api('/api/carpinteria/resumen')])
      .then(([a, b]) => { setPedidos(a || []); setResumen(b); })
      .catch(() => {});
  }, []);

  const cuenta = useMemo(() => {
    const por = (estados) => pedidos.filter((p) => estados.includes(p.estado));
    const presupuestados = por(['PRESUPUESTADO', ...COBRADOS, 'RECHAZADO', 'VENCIDO']).length;
    const aceptados = por(COBRADOS).length;
    return {
      nuevos: por(['PENDIENTE']).length,
      esperando: por(['PRESUPUESTADO']).length,
      enCurso: por(EN_CURSO).length,
      entregados: por(['ENTREGADO']).length,
      aceptacion: presupuestados ? Math.round((aceptados / presupuestados) * 100) + '%' : '—',
      facturado: por(COBRADOS).reduce((s, p) => s + (p.presupuesto?.total || 0), 0),
      cobrados: por(COBRADOS),
    };
  }, [pedidos]);

  const zona = zonas.find((z) => z.id === perfil?.zona)?.etiqueta || perfil?.zona;
  const completo = perfil ? [perfil.zona, perfil.whatsapp, perfil.direccion, perfil.materiales?.length].filter(Boolean).length : 0;
  const estados = Object.keys(ESTADOS)
    .map((e) => [e, pedidos.filter((p) => p.estado === e).length])
    .filter(([, n]) => n > 0);
  const maximo = Math.max(1, ...estados.map(([, n]) => n));

  return (
    <>
      {error && <p className="nota error">{error}</p>}

      {seccion === 'resumen' && <VistaResumen pedidos={pedidos} resumen={resumen} perfil={perfil} zona={zona} />}

      {seccion === 'perfil' && perfil && (
        <>
          <Cabecera sesion={{ ...sesion, nombre: perfil.nombre || sesion.nombre }} verificado={perfil.visible}
            subtitulo={zona ? `Carpintería · ${zona}` : 'Carpintería'} />
          <Datos titulo="Datos del taller" filas={[
            ['Nombre', perfil.nombre],
            ['Zona', zona],
            ['WhatsApp', perfil.whatsapp || null],
            ['Dirección', perfil.direccion || null],
            ['Materiales', perfil.materiales?.length ? perfil.materiales.map((m) => MATERIALES[m]).join(', ') : null],
            ['En el mapa', perfil.visible ? 'Visible' : 'Oculto hasta completar el perfil'],
            ['Email de la cuenta', sesion.email],
          ]} pie={<Link to="/panel?editar=1" className="boton claro" style={{ marginTop: 16 }}><Icono nombre="ajustes" />Editar datos</Link>} />
        </>
      )}

      {seccion === 'pedidos' && (
        <section className="tarjeta lista">
          <div className="lista-cabeza"><h3>Pedidos</h3><Link to="/panel" className="boton plano">Abrir bandeja</Link></div>
          {pedidos.length === 0 && <p className="tenue vacio">Todavía no te llegaron pedidos.</p>}
          {pedidos.map((p) => (
            <Fila key={p.id} icono="bandeja" titulo={p.diseno.nombre} a={'/panel?pedido=' + p.id}
              detalle={`${p.cliente?.nombre || ''} · ${medidas(p.diseno)}${p.creado ? ' · ' + fecha(p.creado) : ''}`}
              extra={<Chip estado={p.estado} />} />
          ))}
        </section>
      )}

      {seccion === 'cobros' && (
        <>
          <div className="indicadores">
            <Indicador icono="billete" etiqueta="Señas cobradas" valor={pesos(resumen?.senasCobradas)} />
            <Indicador icono="lista" etiqueta="Trabajos pagados" valor={resumen?.trabajos || 0} />
            <Indicador icono="escudo" etiqueta="Comisión Viruta" valor={pesos(resumen?.comision)} />
          </div>
          <section className="tarjeta lista">
            <div className="lista-cabeza"><h3>Trabajos con seña</h3></div>
            {cuenta.cobrados.length === 0 && <p className="tenue vacio">Cuando un cliente pague la seña lo vas a ver acá.</p>}
            {cuenta.cobrados.map((p) => (
              <Fila key={p.id} icono="billete" titulo={p.diseno.nombre} a={'/panel?pedido=' + p.id}
                detalle={`Seña ${pesos(p.presupuesto?.sena)} · Total ${pesos(p.presupuesto?.total)}`}
                extra={<Chip estado={p.estado} />} />
            ))}
          </section>
        </>
      )}

      {seccion === 'preferencias' && <Preferencias />}
      {seccion === 'seguridad' && <Seguridad sesion={sesion} alSalir={salir} />}
    </>
  );
}

/** Pagina de la cuenta: menu lateral con iconos y nombres, y el contenido de cada seccion. */
/** Accesos del menu lateral: proyectos recientes del cliente o pedidos recientes del taller. */
function Accesos({ sesion, plegado }) {
  const [items, setItems] = useState([]);
  const taller = sesion.rol === 'CARPINTERIA';
  useEffect(() => {
    const ruta = taller ? '/api/carpinteria/pedidos' : '/api/proyectos';
    api(ruta).then((lista) => {
      const orden = [...(lista || [])].sort((a, b) => String(b.actualizado || b.creado || '').localeCompare(String(a.actualizado || a.creado || '')));
      setItems(orden.slice(0, 4).map((x) => ({
        id: x.id,
        titulo: x.diseno?.nombre || 'Sin nombre',
        a: taller ? '/panel?pedido=' + x.id : '/disenar?proyecto=' + x.id,
      })));
    }).catch(() => {});
  }, [taller]);
  if (items.length === 0 || plegado) return null;
  return (
    <div className="accesos">
      <p className="accesos-titulo">{taller ? 'Pedidos recientes' : 'Proyectos recientes'}</p>
      {items.map((x) => (
        <Link key={x.id} to={x.a} title={x.titulo}><Icono nombre="documento" tam={18} /><span>{x.titulo}</span></Link>
      ))}
    </div>
  );
}

/** Inicio de la cuenta en el celular: avatar al centro y la lista de opciones. */
function Hub({ sesion, secciones, salir }) {
  const taller = sesion.rol === 'CARPINTERIA';
  const principales = secciones.filter(([id]) => id !== 'preferencias' && id !== 'seguridad');
  const ajustes = secciones.filter(([id]) => id === 'preferencias' || id === 'seguridad');
  const fila = ([id, icono, nombre]) => (
    <Link key={id} to={'/cuenta/' + id} className="hub-fila">
      <Icono nombre={icono} tam={20} /><span>{nombre}</span>
      <span className="hub-ir"><Icono nombre="flecha" tam={15} /></span>
    </Link>
  );
  return (
    <main className="hub">
      <div className="hub-perfil">
        <span className="avatar grande">{iniciales(sesion.nombre)}</span>
        <h1>{sesion.nombre}</h1>
        <p className="tenue">{sesion.email || (taller ? 'Carpintería' : 'Cliente')}</p>
      </div>
      <Link to={taller ? '/panel' : '/disenar'} className="hub-destacado">
        <Icono nombre={taller ? 'bandeja' : 'cubo'} tam={20} />
        <span>{taller ? 'Abrir la bandeja de pedidos' : 'Diseñar un mueble nuevo'}</span>
        <svg className="hub-arte" viewBox="0 0 120 90" aria-hidden="true">
          <rect x="30" y="14" width="8" height="70" rx="2" fill="#D4A373" />
          <rect x="90" y="14" width="8" height="70" rx="2" fill="#D4A373" />
          <rect x="30" y="14" width="68" height="7" rx="2" fill="#C9945F" />
          <rect x="34" y="40" width="60" height="6" rx="2" fill="#E2C8A2" />
          <rect x="34" y="62" width="60" height="6" rx="2" fill="#E2C8A2" />
          <rect x="30" y="78" width="68" height="7" rx="2" fill="#C9945F" />
          <rect x="44" y="26" width="7" height="14" rx="1.5" fill="var(--acento)" />
          <rect x="53" y="29" width="6" height="11" rx="1.5" fill="#6E4E37" />
          <circle cx="80" cy="56" r="5" fill="var(--acento)" opacity=".7" />
        </svg>
      </Link>
      <div className="hub-grupo">{principales.map(fila)}</div>
      <div className="hub-grupo">{ajustes.map(fila)}</div>
      <button className="hub-salir" onClick={salir}><Icono nombre="salir" tam={18} />Cerrar sesión</button>
    </main>
  );
}

export default function Cuenta() {
  const { sesion, salir } = useSesion();
  const { seccion } = useParams();
  const movil = usarMovil();
  const navegar = useNavigate();
  const [plegado, setPlegado] = useState(() => {
    try { const v = localStorage.getItem('viruta.menuCuenta'); return v === null ? null : v === 'plegado'; } catch { return null; }
  });
  const plegar = () => {
    const tablet = typeof matchMedia === 'function' && matchMedia('(max-width: 1023px)').matches;
    const nuevo = !(plegado ?? tablet);
    setPlegado(nuevo);
    try { localStorage.setItem('viruta.menuCuenta', nuevo ? 'plegado' : 'abierto'); } catch { /* sin almacenamiento */ }
  };
  if (!sesion) return <Navigate to="/ingresar?volver=/cuenta" replace />;
  const secciones = SECCIONES[sesion.rol] || SECCIONES.CLIENTE;
  const actual = secciones.find(([id]) => id === seccion);
  if (!seccion && movil) return <Hub sesion={sesion} secciones={secciones} salir={salir} />;
  if (!actual) return <Navigate to={'/cuenta/' + secciones[0][0]} replace />;
  const taller = sesion.rol === 'CARPINTERIA';

  return (
    <main className={'cuenta' + (plegado === true ? ' plegado' : plegado === false ? ' desplegado' : '')}>
      {movil && (
        <div className="cuenta-volver">
          <button className="volver-circulo" aria-label="Volver a la cuenta" onClick={() => navegar('/cuenta')}>
            <Icono nombre="volver" tam={18} />
          </button>
          <h2>{actual[2]}</h2>
          <span />
        </div>
      )}
      <aside className="cuenta-menu">
        <div className="cuenta-grupo">
          <span>{taller ? 'Mi taller' : 'Mi cuenta'}</span>
          <button className="plegar" onClick={plegar} aria-label="Plegar o desplegar el menú" title="Plegar o desplegar el menú">
            <Icono nombre="panel" tam={18} />
          </button>
        </div>
        <nav aria-label="Secciones de la cuenta">
          {secciones.map(([id, icono, nombre]) => (
            <NavLink key={id} to={'/cuenta/' + id} title={nombre} className={({ isActive }) => (isActive ? 'activo' : '')}>
              <Icono nombre={icono} tam={19} /><span>{nombre}</span>
            </NavLink>
          ))}
        </nav>
        <Accesos sesion={sesion} plegado={plegado === true} />
        <Link to="/cuenta/perfil" className="tarjeta-usuario" title={sesion.nombre}>
          <span className="avatar">{iniciales(sesion.nombre)}</span>
          <span className="tarjeta-usuario-texto"><strong>{sesion.nombre}</strong><span>{taller ? 'Carpintería' : 'Cliente'}</span></span>
        </Link>
      </aside>
      <section className="cuenta-contenido">
        <p className="migas">
          <span className="tenue">{taller ? 'Mi taller' : 'Mi cuenta'}</span>
          <span className="tenue">/</span>
          <Icono nombre={actual[1]} tam={17} />{actual[2]}
        </p>
        {taller
          ? <CuentaTaller seccion={seccion} sesion={sesion} salir={salir} />
          : <CuentaCliente seccion={seccion} sesion={sesion} salir={salir} />}
      </section>
    </main>
  );
}
