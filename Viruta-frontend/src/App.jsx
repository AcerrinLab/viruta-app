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
import { aplicarTema } from './componentes/Comunes.jsx';
import { Icono } from './componentes/Iconos.jsx';

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
          <button className="item" role="menuitem" onClick={() => { setAbierto(false); alSalir(); }}>
            <Icono nombre="salir" />Salir
          </button>
        </div>
      )}
    </div>
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
          {(!sesion || sesion.rol === 'CLIENTE') && <NavLink to="/disenar" className={activo}>Diseñar</NavLink>}
          {sesion?.rol === 'CLIENTE' && <NavLink to="/mis-pedidos" className={activo}>Mis pedidos</NavLink>}
          {sesion?.rol === 'CARPINTERIA' && <NavLink to="/panel" className={activo}>Panel</NavLink>}
          {sesion?.rol === 'ADMIN' && <NavLink to="/metricas" className={activo}>Métricas</NavLink>}
          {sesion ? <Usuario sesion={sesion} alSalir={salir} /> : <NavLink to="/ingresar" className={activo}>Ingresar</NavLink>}
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/disenar" element={<Disenar />} />
        <Route path="/ingresar" element={<Acceso />} />
        <Route path="/carpinterias" element={<Solo rol="CLIENTE"><Carpinterias /></Solo>} />
        <Route path="/mis-pedidos" element={<Solo rol="CLIENTE"><MisPedidos /></Solo>} />
        <Route path="/pago-simulado" element={<Solo rol="CLIENTE"><PagoSimulado /></Solo>} />
        <Route path="/panel" element={<Solo rol="CARPINTERIA"><Panel /></Solo>} />
        <Route path="/metricas" element={<Solo rol="ADMIN"><Metricas /></Solo>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Sesion.Provider>
  );
}
