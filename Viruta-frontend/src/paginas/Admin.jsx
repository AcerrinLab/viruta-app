import { useCallback, useEffect, useState } from 'react';
import { NavLink, Navigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useSesion } from '../App.jsx';
import { Icono } from '../componentes/Iconos.jsx';
import { Avatar } from '../componentes/Testimonios.jsx';
import { ESTADOS } from '../lib/estados.js';
import { pesos } from '../lib/unidades.js';

// Panel de administracion para los usuarios maestros: como viene la app, quien se suma,
// como se mueven los pedidos, la lista de espera, los testimonios y los inicios de sesion.

const SECCIONES = [
  ['resumen', 'grafico', 'Resumen'],
  ['usuarios', 'persona', 'Usuarios'],
  ['pedidos', 'bandeja', 'Pedidos'],
  ['testimonios', 'enviar', 'Testimonios'],
  ['espera', 'campana', 'Lista de espera'],
  ['ingresos', 'escudo', 'Inicios de sesión'],
];
const ROLES = { CLIENTE: 'Clientes', CARPINTERIA: 'Carpinterías', ADMIN: 'Administradores' };
const numero = (n) => Number(n || 0).toLocaleString('es-AR');
const fecha = (t) => (t ? new Date(t).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '');
const fechaHora = (t) => new Date(t).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function Indicador({ icono, titulo, valor, detalle }) {
  return (
    <div className="tarjeta indicador">
      <span className="indicador-icono"><Icono nombre={icono} tam={18} /></span>
      <span className="tenue">{titulo}</span>
      <span className="numero">{valor}</span>
      {detalle && <span className="tenue chico">{detalle}</span>}
    </div>
  );
}

/** Barras de los ultimos 30 dias. */
function Dias({ titulo, serie }) {
  const max = Math.max(1, ...(serie || []).map((d) => d.cantidad));
  const total = (serie || []).reduce((s, d) => s + d.cantidad, 0);
  return (
    <section className="tarjeta">
      <div className="t-cabeza"><span>{titulo}</span><span className="tenue chico">{total} en 30 días</span></div>
      <div className="barras-dias" role="img" aria-label={titulo}>
        {(serie || []).map((d) => (
          <span key={d.dia} title={`${fecha(d.dia + 'T12:00:00')}: ${d.cantidad}`}
            style={{ height: `${Math.max(3, (d.cantidad / max) * 100)}%` }} className={d.cantidad ? 'con' : ''} />
        ))}
      </div>
      <div className="curva-fechas tenue"><span>Hace 30 días</span><span>Hoy</span></div>
    </section>
  );
}

function Barras({ titulo, filas }) {
  const max = Math.max(1, ...filas.map(([, n]) => n));
  const total = filas.reduce((s, [, n]) => s + n, 0);
  return (
    <section className="tarjeta">
      <div className="t-cabeza"><span>{titulo}</span><span className="tenue chico">{numero(total)} en total</span></div>
      <div className="estados-tabla">
        {filas.map(([nombre, n]) => (
          <div key={nombre} className="estados-fila">
            <span>{nombre}</span>
            <span className="barra-pista"><span style={{ width: `${(n / max) * 100}%` }} /></span>
            <strong>{numero(n)}</strong>
            <span className="tenue">{total ? Math.round((n / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonios() {
  const [lista, setLista] = useState([]);
  const [nuevo, setNuevo] = useState({ nombre: '', detalle: '', texto: '', fotoUrl: '' });
  const [error, setError] = useState('');
  const cargar = useCallback(() => api('/api/admin/testimonios').then(setLista).catch((p) => setError(p.message)), []);
  useEffect(() => { cargar(); }, [cargar]);

  const accion = async (ruta, metodo = 'PUT') => {
    try { await api(ruta, { metodo }); cargar(); } catch (p) { setError(p.message); }
  };
  const crear = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/api/admin/testimonios', { metodo: 'POST', cuerpo: { ...nuevo, fotoUrl: nuevo.fotoUrl || null } });
      setNuevo({ nombre: '', detalle: '', texto: '', fotoUrl: '' });
      cargar();
    } catch (p) { setError(p.message); }
  };
  const pendientes = lista.filter((t) => !t.aprobado).length;

  return (
    <>
      <form className="tarjeta datos" onSubmit={crear}>
        <h3>Cargar un testimonio</h3>
        <div className="pila" style={{ padding: '16px 20px 20px' }}>
          <div className="tres" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <label>Nombre<input type="text" maxLength={80} value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} /></label>
            <label>Quién es<input type="text" maxLength={120} placeholder="Cliente en Palpalá" value={nuevo.detalle} onChange={(e) => setNuevo({ ...nuevo, detalle: e.target.value })} /></label>
          </div>
          <label>Testimonio<textarea rows={3} maxLength={600} value={nuevo.texto} onChange={(e) => setNuevo({ ...nuevo, texto: e.target.value })} /></label>
          <label>Foto (enlace https, opcional)<input type="text" placeholder="https://..." value={nuevo.fotoUrl} onChange={(e) => setNuevo({ ...nuevo, fotoUrl: e.target.value })} /></label>
          {error && <p className="nota error">{error}</p>}
          <button className="boton" disabled={!nuevo.nombre.trim() || nuevo.texto.trim().length < 10}><Icono nombre="enviar" />Publicar</button>
        </div>
      </form>
      <section className="tarjeta lista">
        <div className="lista-cabeza"><h3>Todos los testimonios</h3>{pendientes > 0 && <span className="chip aviso">{pendientes} pendientes</span>}</div>
        {lista.length === 0 && <p className="tenue vacio">Todavía no hay testimonios.</p>}
        {lista.map((t) => (
          <div key={t.id} className="fila-lista testimonio-admin">
            <Avatar nombre={t.nombre} foto={t.fotoUrl} tam={38} />
            <span className="fila-texto">
              <strong>{t.nombre}{t.detalle ? <span className="tenue"> · {t.detalle}</span> : null}</strong>
              <span className="testimonio-texto">«{t.texto}»</span>
            </span>
            <span className={'chip ' + (t.aprobado ? 'bien' : 'aviso')}>{t.aprobado ? 'Publicado' : 'Pendiente'}</span>
            <div className="fila">
              {t.aprobado
                ? <button className="boton plano" onClick={() => accion(`/api/admin/testimonios/${t.id}/ocultar`)}>Ocultar</button>
                : <button className="boton plano" onClick={() => accion(`/api/admin/testimonios/${t.id}/aprobar`)}>Aprobar</button>}
              <button className="boton plano peligro" onClick={() => window.confirm('¿Borrar este testimonio? No se puede deshacer.') && accion(`/api/admin/testimonios/${t.id}`, 'DELETE')}>Borrar</button>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

export default function Admin() {
  const { seccion } = useParams();
  const { sesion } = useSesion();
  const [metricas, setMetricas] = useState(null);
  const [usuarios, setUsuarios] = useState(null);
  const [pedidos, setPedidos] = useState(null);
  const [espera, setEspera] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/metricas').then(setMetricas).catch((p) => setError(p.message));
    api('/api/admin/usuarios').then(setUsuarios).catch((p) => setError(p.message));
    api('/api/admin/pedidos').then(setPedidos).catch((p) => setError(p.message));
    api('/api/lista-espera/contador').then(setEspera).catch(() => {});
  }, []);

  const actual = SECCIONES.find(([id]) => id === seccion);
  if (!actual) return <Navigate to="/admin/resumen" replace />;

  const porEstado = pedidos ? Object.entries(pedidos.porEstado).filter(([, n]) => n > 0).map(([e, n]) => [ESTADOS[e]?.etiqueta || e, n]) : [];
  const porRol = usuarios ? Object.entries(usuarios.porRol).map(([r, n]) => [ROLES[r] || r, n]) : [];

  return (
    <main className="cuenta admin">
      <aside className="cuenta-menu">
        <div className="cuenta-grupo"><span>Administración</span></div>
        <nav aria-label="Secciones de administración">
          {SECCIONES.map(([id, icono, nombre]) => (
            <NavLink key={id} to={'/admin/' + id} title={nombre} className={({ isActive }) => (isActive ? 'activo' : '')}>
              <Icono nombre={icono} tam={19} /><span>{nombre}</span>
            </NavLink>
          ))}
        </nav>
        <div className="tarjeta-usuario">
          <Avatar nombre={sesion.nombre} foto={sesion.fotoUrl} tam={32} />
          <span className="tarjeta-usuario-texto"><strong>{sesion.nombre}</strong><span>Administración</span></span>
        </div>
      </aside>

      <section className="cuenta-contenido">
        <div className="admin-movil">
          {SECCIONES.map(([id, icono, nombre]) => (
            <NavLink key={id} to={'/admin/' + id} className={({ isActive }) => 'opcion' + (isActive ? ' elegida' : '')}>{nombre}</NavLink>
          ))}
        </div>
        <p className="migas"><span className="tenue">Administración</span><span className="tenue">/</span><Icono nombre={actual[1]} tam={17} />{actual[2]}</p>
        {error && <p className="nota error">{error}</p>}

        {seccion === 'resumen' && (
          <>
            <div className="indicadores">
              <Indicador icono="persona" titulo="Usuarios" valor={numero(metricas?.usuarios)} detalle={usuarios ? `${numero(usuarios.porRol.CARPINTERIA)} carpinterías` : null} />
              <Indicador icono="campana" titulo="Lista de espera" valor={numero(espera?.total)} detalle={espera?.fuente === 'wishlist' ? 'desde la planilla' : 'lista local'} />
              <Indicador icono="cubo" titulo="Diseños guardados" valor={numero(metricas?.proyectos)} />
              <Indicador icono="bandeja" titulo="Pedidos" valor={numero(metricas?.pedidos)} detalle={pedidos ? `${pedidos.carpinteriasActivas} talleres con pedidos` : null} />
              <Indicador icono="billete" titulo="Señas cobradas" valor={pesos(metricas?.montoSenas)} detalle={`${numero(metricas?.senas)} señas`} />
              <Indicador icono="escudo" titulo="Teléfonos verificados" valor={numero(usuarios?.telefonosVerificados)} detalle={`${numero(usuarios?.conGoogle)} con Google`} />
            </div>
            <div className="kpis-dos">
              <Dias titulo="Registros por día" serie={usuarios?.registrosPorDia} />
              <Dias titulo="Pedidos por día" serie={pedidos?.porDia} />
            </div>
            <div className="kpis-dos">
              <Barras titulo="Usuarios por tipo" filas={porRol} />
              <Barras titulo="Pedidos por estado" filas={porEstado.length ? porEstado : [['Sin pedidos', 0]]} />
            </div>
          </>
        )}

        {seccion === 'usuarios' && usuarios && (
          <>
            <div className="indicadores">
              {porRol.map(([nombre, n]) => <Indicador key={nombre} icono="persona" titulo={nombre} valor={numero(n)} />)}
              <Indicador icono="escudo" titulo="Teléfonos verificados" valor={numero(usuarios.telefonosVerificados)} />
            </div>
            <Dias titulo="Registros por día" serie={usuarios.registrosPorDia} />
            <section className="tarjeta lista">
              <div className="lista-cabeza"><h3>Últimos registros</h3></div>
              {usuarios.ultimos.map((u) => (
                <div key={u.id} className="fila-lista">
                  <Avatar nombre={u.nombre} foto={u.fotoUrl} tam={38} />
                  <span className="fila-texto"><strong>{u.nombre}</strong><span className="tenue">{u.email} · {fecha(u.creado)}</span></span>
                  {u.conGoogle && <span className="chip">Google</span>}
                  {u.telefonoVerificado && <span className="chip bien">Teléfono</span>}
                  <span className="chip">{ROLES[u.rol]?.replace(/s$/, '').replace(/ías$/, 'ía') || u.rol}</span>
                </div>
              ))}
            </section>
          </>
        )}

        {seccion === 'pedidos' && pedidos && (
          <>
            <div className="indicadores">
              <Indicador icono="bandeja" titulo="Pedidos" valor={numero(pedidos.total)} />
              <Indicador icono="lista" titulo="Presupuestado aceptado" valor={pesos(pedidos.presupuestado)} />
              <Indicador icono="martillo" titulo="Talleres con pedidos" valor={numero(pedidos.carpinteriasActivas)} />
              <Indicador icono="billete" titulo="Señas cobradas" valor={pesos(metricas?.montoSenas)} />
            </div>
            <div className="kpis-dos">
              <Dias titulo="Pedidos por día" serie={pedidos.porDia} />
              <Barras titulo="Pedidos por estado" filas={porEstado.length ? porEstado : [['Sin pedidos', 0]]} />
            </div>
          </>
        )}

        {seccion === 'testimonios' && <Testimonios />}

        {seccion === 'espera' && (
          <>
            <div className="indicadores">
              <Indicador icono="campana" titulo="Anotados" valor={numero(espera?.total)} />
              <Indicador icono="cubo" titulo="Quieren un mueble" valor={numero(espera?.clientes)} />
              <Indicador icono="martillo" titulo="Talleres" valor={numero(espera?.carpinterias)} />
            </div>
            <section className="tarjeta datos">
              <h3>De dónde salen los números</h3>
              <dl>
                <div className="dato-fila"><dt>Fuente</dt><dd>{espera?.fuente === 'wishlist' ? 'Planilla de Google Sheets de la wishlist' : 'Lista local de la app (falta configurar WISHLIST_SHEETS_URL)'}</dd></div>
                <div className="dato-fila"><dt>Página pública</dt><dd><a href="https://viruta-wishlist.vercel.app/" target="_blank" rel="noopener noreferrer">viruta-wishlist.vercel.app</a></dd></div>
              </dl>
            </section>
          </>
        )}

        {seccion === 'ingresos' && usuarios && (
          <section className="tarjeta lista">
            <div className="lista-cabeza"><h3>Inicios de sesión recientes</h3><span className="chip aviso">{numero(usuarios.ingresosFallidos)} fallidos en total</span></div>
            {usuarios.ingresos.map((i, n) => (
              <div key={n} className="fila-lista">
                <span className={'fila-icono' + (i.exitoso ? '' : ' alerta')}><Icono nombre={i.exitoso ? 'escudo' : 'cerrar'} tam={18} /></span>
                <span className="fila-texto"><strong>{i.email}</strong><span className="tenue">{fechaHora(i.instante)} · {i.dispositivo} · {i.metodo === 'GOOGLE' ? 'Google' : 'Contraseña'}</span></span>
                {!i.exitoso && <span className="chip aviso">Fallido</span>}
              </div>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}
