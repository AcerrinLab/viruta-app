import { createContext, useContext, useState } from 'react';
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

const Sesion = createContext(null);
export const useSesion = () => useContext(Sesion);

function Solo({ rol, children }) {
  const { sesion } = useSesion();
  if (!sesion) return <Navigate to="/ingresar" replace />;
  if (sesion.rol !== rol) return <Navigate to="/" replace />;
  return children;
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

  return (
    <Sesion.Provider value={{ sesion, entrar, salir }}>
      <header className="barra">
        <Link to="/" className="marca">
          <img src="/icono.svg" alt="" />
          Viruta
        </Link>
        <nav>
          {(!sesion || sesion.rol === 'CLIENTE') && <NavLink to="/disenar" className={activo}>Diseñar</NavLink>}
          {sesion?.rol === 'CLIENTE' && <NavLink to="/mis-pedidos" className={activo}>Mis pedidos</NavLink>}
          {sesion?.rol === 'CARPINTERIA' && <NavLink to="/panel" className={activo}>Panel</NavLink>}
          {sesion?.rol === 'ADMIN' && <NavLink to="/metricas" className={activo}>Métricas</NavLink>}
          {sesion ? <button onClick={salir}>Salir</button> : <NavLink to="/ingresar" className={activo}>Ingresar</NavLink>}
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
