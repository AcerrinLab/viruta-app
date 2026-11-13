import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useSesion } from '../App.jsx';
import { Selector, aplicarTema } from '../componentes/Comunes.jsx';
import { IlustracionCliente, IlustracionTaller } from '../componentes/Ilustraciones.jsx';
import { Icono } from '../componentes/Iconos.jsx';

/** Ingreso y registro con rol Cliente o Carpinteria (RF-12). */
export default function Acceso() {
  const [parametros] = useSearchParams();
  const [nuevo, setNuevo] = useState(parametros.has('rol') || parametros.has('volver'));
  const [rol, setRol] = useState(parametros.get('rol') === 'CARPINTERIA' ? 'CARPINTERIA' : 'CLIENTE');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { entrar, sesion } = useSesion();
  const navegar = useNavigate();

  // Verde para quien encarga, nogal para el taller.
  useEffect(() => {
    aplicarTema(rol);
    return () => aplicarTema(sesion?.rol);
  }, [rol, sesion]);

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const datos = nuevo
        ? await api('/api/auth/registro', { metodo: 'POST', cuerpo: { nombre, email, clave, rol, consentimiento: acepta } })
        : await api('/api/auth/ingreso', { metodo: 'POST', cuerpo: { email, clave } });
      entrar(datos);
      const volver = parametros.get('volver');
      if (datos.rol === 'CARPINTERIA') navegar('/panel');
      else if (datos.rol === 'ADMIN') navegar('/metricas');
      else navegar(volver && volver.startsWith('/') ? volver : '/mis-pedidos');
    } catch (problema) {
      setError(problema.message);
    } finally {
      setEnviando(false);
    }
  };

  const taller = rol === 'CARPINTERIA';

  return (
    <main className="acceso-pagina">
      <div className="acceso">
        <form className="acceso-form" onSubmit={enviar}>
          <div className="pila" style={{ gap: 10 }}>
            <h1>{nuevo ? 'Creá tu cuenta' : 'Hola de nuevo'}</h1>
            <p className="bajada">
              {nuevo
                ? (taller ? 'Recibí pedidos con medidas claras.' : 'Diseñá tu mueble y encargalo.')
                : 'Ingresá para seguir con tus muebles.'}
            </p>
          </div>
          <Selector etiqueta="Perfil" ancho valor={rol} alCambiar={setRol}
            opciones={[['CLIENTE', 'Quiero un mueble'], ['CARPINTERIA', 'Soy carpintería']]} />
          {nuevo && (
            <label>
              Nombre
              <input type="text" required maxLength={80} value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" />
            </label>
          )}
          <label>
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
          <label>
            Contraseña
            <input type="password" required minLength={8} value={clave} onChange={(e) => setClave(e.target.value)}
              autoComplete={nuevo ? 'new-password' : 'current-password'} />
          </label>
          {nuevo && (
            <label className="marcar">
              <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />
              <span className="chico">Acepto que Viruta use mis datos para gestionar mis pedidos (Ley 25.326).</span>
            </label>
          )}
          {error && <p className="nota error">{error}</p>}
          <button className="boton ancho" disabled={enviando || (nuevo && !acepta)}>{nuevo ? 'Crear cuenta' : 'Ingresar'}<Icono nombre="flecha" /></button>
          <p className="acceso-cambio">
            {nuevo ? '¿Ya tenés cuenta?' : '¿Todavía no tenés cuenta?'}
            <button type="button" onClick={() => { setNuevo(!nuevo); setError(''); }}>
              {nuevo ? 'Ingresar' : 'Crear una'}
            </button>
          </p>
        </form>

        <aside className="acceso-arte">
          {taller ? <IlustracionTaller key="taller" /> : <IlustracionCliente key="cliente" />}
          <p className="leyenda vidrio">
            <strong>{taller ? 'Tu taller, con pedidos listos para cortar' : 'Miralo en tu casa antes de encargarlo'}</strong>
            {taller
              ? 'Medidas verificadas, despiece y seña cobrada antes de empezar.'
              : 'Ajustá las medidas, probalo con la cámara y elegí una carpintería de Jujuy.'}
          </p>
        </aside>
      </div>
    </main>
  );
}
