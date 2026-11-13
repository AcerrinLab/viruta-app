import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useSesion } from '../App.jsx';
import { Selector, aplicarTema } from '../componentes/Comunes.jsx';
import { Icono } from '../componentes/Iconos.jsx';

/** Portada con la lista de espera y su contador real (RF-20). */
export default function Inicio() {
  const [contador, setContador] = useState(null);
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState('CLIENTE');
  const [acepta, setAcepta] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const { sesion } = useSesion();

  // El color de la pagina acompana al perfil elegido en la lista de espera.
  useEffect(() => {
    aplicarTema(sesion ? sesion.rol : tipo);
    return () => aplicarTema(sesion?.rol);
  }, [tipo, sesion]);

  useEffect(() => {
    api('/api/lista-espera/contador').then(setContador).catch(() => {});
  }, []);

  const anotar = async (e) => {
    e.preventDefault();
    try {
      setContador(await api('/api/lista-espera', { metodo: 'POST', cuerpo: { email, tipo, consentimiento: acepta } }));
      setMensaje({ texto: 'Listo. Te avisamos cuando abramos en tu zona.', tono: '' });
      setEmail('');
    } catch (error) {
      setMensaje({ texto: error.message, tono: 'error' });
    }
  };

  return (
    <main>
      <section className="portada">
        <span className="antetitulo">Muebles a medida en Jujuy</span>
        <h1>Tu mueble a medida, sin errores de medida.</h1>
        <p className="bajada">
          Diseñalo, miralo en tu casa con la cámara y encargalo a una carpintería de Jujuy.
        </p>
        <div className="fila">
          <Link to="/disenar" className="boton"><Icono nombre="cubo" />Diseñar mi mueble</Link>
          <Link to="/ingresar?rol=CARPINTERIA" className="boton claro"><Icono nombre="martillo" />Soy carpintería</Link>
        </div>
      </section>

      <section className="tarjeta pila" style={{ marginTop: 36, maxWidth: 520, padding: 24, borderRadius: 24 }}>
        <div>
          <h2>Lista de espera</h2>
          {contador && <p className="tenue"><span className="punto" />{contador.total} personas anotadas</p>}
        </div>
        <form className="pila" onSubmit={anotar}>
          <Selector etiqueta="Perfil" ancho valor={tipo} alCambiar={setTipo}
            opciones={[['CLIENTE', 'Quiero un mueble'], ['CARPINTERIA', 'Tengo una carpintería']]} />
          <label>
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
          <label className="marcar">
            <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />
            <span className="chico">Acepto que Viruta guarde mi email para avisarme.</span>
          </label>
          {mensaje && <p className={'nota ' + mensaje.tono}>{mensaje.texto}</p>}
          <button className="boton" disabled={!acepta}><Icono nombre="campana" />Anotarme</button>
        </form>
      </section>
    </main>
  );
}
