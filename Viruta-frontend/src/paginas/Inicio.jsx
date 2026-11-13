import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

/** Portada con la lista de espera y su contador real (RF-20). */
export default function Inicio() {
  const [contador, setContador] = useState(null);
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState('CLIENTE');
  const [acepta, setAcepta] = useState(false);
  const [mensaje, setMensaje] = useState(null);

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
        <h1>Tu mueble a medida, sin errores de medida.</h1>
        <p className="tenue" style={{ fontSize: '1.15rem' }}>
          Diseñalo, miralo en tu casa con la cámara y encargalo a una carpintería de Jujuy.
        </p>
        <div className="fila">
          <Link to="/disenar" className="boton">Diseñar mi mueble</Link>
          <Link to="/ingresar?rol=CARPINTERIA" className="boton claro">Soy carpintería</Link>
        </div>
      </section>

      <section className="tarjeta pila" style={{ marginTop: 32, maxWidth: 520 }}>
        <div>
          <h2>Lista de espera</h2>
          {contador && <p className="tenue"><span className="punto" />{contador.total} personas anotadas</p>}
        </div>
        <form className="pila" onSubmit={anotar}>
          <div className="opciones">
            <button type="button" className={'opcion ' + (tipo === 'CLIENTE' ? 'elegida' : '')} onClick={() => setTipo('CLIENTE')}>Quiero un mueble</button>
            <button type="button" className={'opcion ' + (tipo === 'CARPINTERIA' ? 'elegida' : '')} onClick={() => setTipo('CARPINTERIA')}>Tengo una carpintería</button>
          </div>
          <label>
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
          <label className="marcar">
            <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />
            <span className="chico">Acepto que Viruta guarde mi email para avisarme.</span>
          </label>
          {mensaje && <p className={'nota ' + mensaje.tono}>{mensaje.texto}</p>}
          <button className="boton" disabled={!acepta}>Anotarme</button>
        </form>
      </section>
    </main>
  );
}
