import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { guardarSesion, leerSesion } from './api.js';
import Inicio from './paginas/Inicio.jsx';
import Disenar from './paginas/Disenar.jsx';
import Acceso from './paginas/Acceso.jsx';
import Carpinterias from './paginas/Carpinterias.jsx';
import MisPedidos from './paginas/MisPedidos.jsx';
import Panel from './paginas/Panel.jsx';
import PagoSimulado from './paginas/PagoSimulado.jsx';
import Admin from './paginas/Admin.jsx';
import { Avatar } from './componentes/Testimonios.jsx';
import Cuenta from './paginas/Cuenta.jsx';
import Buscador from './componentes/Buscador.jsx';
import { Interruptor, aplicarTema } from './componentes/Comunes.jsx';
import { Icono } from './componentes/Iconos.jsx';
import { guardarTema, seguirSistema, temaActual, usarAmbiente, usarTema } from './lib/tema.js';

const Sesion = createContext(null);
export const useSesion = () => useContext(Sesion);

function Solo({ rol, children }) {
  const { sesion } = useSesion();
  if (!sesion) return <Navigate to="/ingresar" replace />;
  if (sesion.rol !== rol) return <Navigate to="/" replace />;
  return children;
}

const ROLES = { CLIENTE: 'Cliente', CARPINTERIA: 'Carpintería', ADMIN: 'Administración' };

function iniciales(nombre = '') {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase() || 'V';
}

/** Quien esta logueado: avatar con iniciales y un menu con la salida. */
function Usuario({ sesion, alSalir }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef(null);
  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e) => { if (!caja.current?.contains(e.target)) setAbierto(false); };
    const tecla = (e) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('pointerdown', cerrar);
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('pointerdown', cerrar); document.removeEventListener('keydown', tecla); };
  }, [abierto]);
  const nombre = sesion.nombre || 'Mi cuenta';
  const taller = sesion.rol === 'CARPINTERIA';
  const tema = usarTema();
  const [ambiente, setAmbiente] = usarAmbiente();
  const cerrar = () => setAbierto(false);
  return (
    <div className="usuario" ref={caja}>
      <button className="usuario-boton" aria-haspopup="menu" aria-expanded={abierto} onClick={() => setAbierto(!abierto)}>
        <Avatar nombre={sesion.nombre} foto={sesion.fotoUrl} tam={32} />
        <span className="usuario-nombre">{nombre.split(' ')[0]}</span>
      </button>
      {abierto && (
        <div className="usuario-menu" role="menu">
          <div className="menu-cabeza">
            <strong>{nombre}</strong>
            <span>{ROLES[sesion.rol] || sesion.rol}</span>
          </div>
          <div className="menu-grupo">
            {(taller
              ? [['resumen', 'grafico', 'Resumen'], ['perfil', 'martillo', 'Mi taller'], ['pedidos', 'bandeja', 'Pedidos']]
              : [['perfil', 'persona', 'Mi perfil'], ['proyectos', 'cubo', 'Mis proyectos'], ['pedidos', 'bandeja', 'Mis pedidos']]
            ).map(([id, icono, texto]) => (
              <Link key={id} className="item" role="menuitem" to={'/cuenta/' + id} onClick={cerrar}>
                <Icono nombre={icono} tam={16} />{texto}
              </Link>
            ))}
          </div>
          <div className="menu-grupo">
            <Link className="item" role="menuitem" to="/cuenta/preferencias" onClick={cerrar}>
              <Icono nombre="ajustes" tam={16} />Preferencias<span className="item-fin"><Icono nombre="adelante" tam={14} /></span>
            </Link>
            <div className="item" role="menuitemcheckbox" aria-checked={tema === 'oscuro'}>
              <Icono nombre="luna" tam={16} />Tema oscuro
              <span className="item-fin"><Interruptor etiqueta="Tema oscuro" activo={tema === 'oscuro'} alCambiar={(v) => guardarTema(v ? 'oscuro' : 'claro')} /></span>
            </div>
            <div className="item" role="menuitemcheckbox" aria-checked={ambiente.luces}>
              <Icono nombre="sol" tam={16} />Luces de fondo
              <span className="item-fin"><Interruptor etiqueta="Luces de fondo" activo={ambiente.luces} alCambiar={(v) => setAmbiente({ luces: v })} /></span>
            </div>
          </div>
          <div className="menu-grupo">
            <button className="item" role="menuitem" onClick={() => { cerrar(); alSalir(); }}>
              <Icono nombre="salir" tam={16} />Salir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Boton para pasar de claro a oscuro y al reves. */
function BotonTema() {
  const [tema, setTema] = useState(temaActual());
  useEffect(() => seguirSistema(setTema), []);
  useEffect(() => {
    const oir = () => setTema(temaActual());
    window.addEventListener('viruta-tema', oir);
    return () => window.removeEventListener('viruta-tema', oir);
  }, []);
  const oscuro = tema === 'oscuro';
  const cambiar = () => {
    const nuevo = oscuro ? 'claro' : 'oscuro';
    guardarTema(nuevo);
    setTema(nuevo);
  };
  return (
    <button className="tema-boton" onClick={cambiar} aria-label={oscuro ? 'Usar tema claro' : 'Usar tema oscuro'} title={oscuro ? 'Tema claro' : 'Tema oscuro'}>
      <Icono nombre={oscuro ? 'sol' : 'luna'} tam={19} />
    </button>
  );
}

export default function App() {
  const [sesion, setSesion] = useState(leerSesion());
  const navegar = useNavigate();

  const entrar = (datos) => {
    guardarSesion(datos);
    setSesion(datos);
  };
  const salir = () => {
    guardarSesion(null);
    setSesion(null);
    navegar('/');
  };
  const activo = ({ isActive }) => (isActive ? 'activo' : '');

  // Verde para clientes, nogal para talleres.
  useEffect(() => aplicarTema(sesion?.rol), [sesion]);

  return (
    <Sesion.Provider value={{ sesion, entrar, salir }}>
      <div className="ambiente" aria-hidden="true">
        <span className="mancha m1" />
        <span className="mancha m2" />
        <span className="mancha m3" />
        <span className="luz l1" />
        <span className="luz l2" />
        <span className="luz l3" />
        <span className="luz l4" />
      </div>
      <header className="barra">
        <Link to="/" className="marca" aria-label="Viruta, inicio">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <rect className="fondo-marca" width="32" height="32" rx="9" />
            <path d="M9 9l7 15 7-15" fill="none" stroke="#E2C8A2" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Viruta</span>
        </Link>
        <nav>
          {(!sesion || sesion.rol === 'CLIENTE') && <NavLink to="/disenar" className={(e) => 'solo-escritorio ' + activo(e)}>Diseñar</NavLink>}
          {sesion?.rol === 'CLIENTE' && <NavLink to="/mis-pedidos" className={(e) => 'solo-escritorio ' + activo(e)}>Mis pedidos</NavLink>}
          {sesion?.rol === 'CARPINTERIA' && <NavLink to="/panel" className={(e) => 'solo-escritorio ' + activo(e)}>Panel</NavLink>}
          {sesion?.rol === 'ADMIN' && <NavLink to="/admin" className={(e) => 'solo-escritorio ' + activo(e)}>Administración</NavLink>}
          <Buscador sesion={sesion} />
          <BotonTema />
          {sesion ? <Usuario sesion={sesion} alSalir={salir} /> : <NavLink to="/ingresar" className={(e) => 'solo-escritorio ' + activo(e)}>Ingresar</NavLink>}
        </nav>
      </header>
      <nav className="pestanas-inferiores" aria-label="Secciones">
        <NavLink to="/" end className={activo}><Icono nombre="casa" tam={22} /><span>Inicio</span></NavLink>
        {(!sesion || sesion.rol === 'CLIENTE') && <NavLink to="/disenar" className={activo}><Icono nombre="cubo" tam={22} /><span>Diseñar</span></NavLink>}
        {sesion?.rol === 'CLIENTE' && <NavLink to="/cuenta/proyectos" className={activo}><Icono nombre="lista" tam={22} /><span>Proyectos</span></NavLink>}
        {sesion?.rol === 'CLIENTE' && <NavLink to="/mis-pedidos" className={activo}><Icono nombre="bandeja" tam={22} /><span>Pedidos</span></NavLink>}
        {sesion?.rol === 'CARPINTERIA' && <NavLink to="/panel" className={activo}><Icono nombre="martillo" tam={22} /><span>Panel</span></NavLink>}
        {sesion?.rol === 'ADMIN' && <NavLink to="/admin" className={activo}><Icono nombre="grafico" tam={22} /><span>Administración</span></NavLink>}
        {sesion
          ? <NavLink to="/cuenta" end className={({ isActive }) => (isActive || (window.location.pathname.startsWith('/cuenta/') && !window.location.pathname.endsWith('/proyectos')) ? 'activo' : '')}><Icono nombre="persona" tam={22} /><span>Cuenta</span></NavLink>
          : <NavLink to="/ingresar" className={activo}><Icono nombre="persona" tam={22} /><span>Ingresar</span></NavLink>}
      </nav>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/disenar" element={<Disenar />} />
        <Route path="/ingresar" element={<Acceso />} />
        <Route path="/carpinterias" element={<Solo rol="CLIENTE"><Carpinterias /></Solo>} />
        <Route path="/mis-pedidos" element={<Solo rol="CLIENTE"><MisPedidos /></Solo>} />
        <Route path="/pago-simulado" element={<Solo rol="CLIENTE"><PagoSimulado /></Solo>} />
        <Route path="/panel" element={<Solo rol="CARPINTERIA"><Panel /></Solo>} />
        <Route path="/cuenta" element={<Cuenta />} />
        <Route path="/cuenta/:seccion" element={<Cuenta />} />
        <Route path="/admin" element={<Solo rol="ADMIN"><Admin /></Solo>} />
        <Route path="/admin/:seccion" element={<Solo rol="ADMIN"><Admin /></Solo>} />
        <Route path="/metricas" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Sesion.Provider>
  );
}
