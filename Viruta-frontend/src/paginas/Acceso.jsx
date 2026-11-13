import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useSesion } from '../App.jsx';

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
  const { entrar } = useSesion();
  const navegar = useNavigate();

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

  return (
    <main className="angosto">
      <form className="tarjeta pila" onSubmit={enviar}>
        <h2>{nuevo ? 'Crear cuenta' : 'Ingresar'}</h2>
        {nuevo && (
          <>
            <div className="opciones">
              <button type="button" className={'opcion ' + (rol === 'CLIENTE' ? 'elegida' : '')} onClick={() => setRol('CLIENTE')}>Quiero un mueble</button>
              <button type="button" className={'opcion ' + (rol === 'CARPINTERIA' ? 'elegida' : '')} onClick={() => setRol('CARPINTERIA')}>Soy carpintería</button>
            </div>
            <label>
              Nombre
              <input type="text" required maxLength={80} value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" />
            </label>
          </>
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
        <button className="boton" disabled={enviando || (nuevo && !acepta)}>{nuevo ? 'Crear cuenta' : 'Ingresar'}</button>
        <button type="button" className="boton plano" onClick={() => { setNuevo(!nuevo); setError(''); }}>
          {nuevo ? 'Ya tengo cuenta' : 'Crear una cuenta'}
        </button>
      </form>
    </main>
  );
}
