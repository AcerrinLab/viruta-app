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
import Metricas from './paginas/Metricas.jsx';
import Cuenta from './paginas/Cuenta.jsx';
import { aplicarTema } from './componentes/Comunes.jsx';
import { Icono } from './componentes/Iconos.jsx';
import { guardarTema, seguirSistema, temaActual } from './lib/tema.js';

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
  return (
    <div className="usuario" ref={caja}>
      <button className="usuario-boton" aria-haspopup="menu" aria-expanded={abierto} onClick={() => setAbierto(!abierto)}>
        <span className="avatar" aria-hidden="true">{iniciales(sesion.nombre)}</span>
        <span className="usuario-nombre">{nombre.split(' ')[0]}</span>
      </button>
      {abierto && (
        <div className="usuario-menu" role="menu">
          <div className="cabecera">
            <span className="avatar" aria-hidden="true">{iniciales(sesion.nombre)}</span>
            <div><strong>{nombre}</strong><span>{ROLES[sesion.rol] || sesion.rol}</span></div>
          </div>
          <Link className="item" role="menuitem" to="/cuenta" onClick={() => setAbierto(false)}>
            <Icono nombre="persona" />{sesion.rol === 'CARPINTERIA' ? 'Mi taller' : 'Mi cuenta'}
          </Link>
          <button className="item" role="menuitem" onClick={() => { setAbierto(false); alSalir(); }}>
            <Icono nombre="salir" />Salir
          </button>
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
          {sesion?.rol === 'ADMIN' && <NavLink to="/metricas" className={(e) => 'solo-escritorio ' + activo(e)}>Métricas</NavLink>}
          <BotonTema />
          {sesion ? <Usuario sesion={sesion} alSalir={salir} /> : <NavLink to="/ingresar" className={(e) => 'solo-escritorio ' + activo(e)}>Ingresar</NavLink>}
        </nav>
      </header>
      <nav className="pestanas-inferiores" aria-label="Secciones">
        <NavLink to="/" end className={activo}><Icono nombre="casa" tam={22} /><span>Inicio</span></NavLink>
        {(!sesion || sesion.rol === 'CLIENTE') && <NavLink to="/disenar" className={activo}><Icono nombre="cubo" tam={22} /><span>Diseñar</span></NavLink>}
        {sesion?.rol === 'CLIENTE' && <NavLink to="/mis-pedidos" className={activo}><Icono nombre="bandeja" tam={22} /><span>Pedidos</span></NavLink>}
        {sesion?.rol === 'CARPINTERIA' && <NavLink to="/panel" className={activo}><Icono nombre="martillo" tam={22} /><span>Panel</span></NavLink>}
        {sesion?.rol === 'ADMIN' && <NavLink to="/metricas" className={activo}><Icono nombre="grafico" tam={22} /><span>Métricas</span></NavLink>}
        {sesion
          ? <NavLink to="/cuenta" className={activo}><Icono nombre="persona" tam={22} /><span>Cuenta</span></NavLink>
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
        <Route path="/metricas" element={<Solo rol="ADMIN"><Metricas /></Solo>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Sesion.Provider>
  );
}
