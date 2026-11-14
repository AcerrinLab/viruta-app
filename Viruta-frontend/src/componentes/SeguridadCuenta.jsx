import { useEffect, useState } from 'react';
import { api, guardarSesion, leerSesion } from '../api.js';
import { Icono } from './Iconos.jsx';

const fechaHora = (t) => new Date(t).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Verificacion del telefono con un codigo que llega por WhatsApp. */
function Telefono({ perfil, alVerificar, whatsapp }) {
  const [telefono, setTelefono] = useState('');
  const [enviado, setEnviado] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const pedir = async (e) => {
    e?.preventDefault();
    setError('');
    setOcupado(true);
    try {
      setEnviado(await api('/api/usuarios/yo/telefono', { metodo: 'POST', cuerpo: { telefono } }));
      setCodigo('');
    } catch (p) {
      setError(p.message);
    } finally {
      setOcupado(false);
    }
  };

  const confirmar = async (e) => {
    e.preventDefault();
    setError('');
    setOcupado(true);
    try {
      const nuevo = await api('/api/usuarios/yo/telefono/confirmar', { metodo: 'POST', cuerpo: { codigo } });
      setEnviado(null);
      alVerificar(nuevo);
    } catch (p) {
      setError(p.message);
    } finally {
      setOcupado(false);
    }
  };

  if (whatsapp === false && !perfil?.telefonoVerificado) {
    return (
      <section className="tarjeta datos">
        <h3>Teléfono</h3>
        <div className="verificado">
          <span className="sello-ok"><Icono nombre="reloj" tam={18} /></span>
          <div>
            <strong>Verificación por WhatsApp: próximamente</strong>
            <span className="tenue chico">Cuando conectemos WhatsApp vas a poder verificar tu número y recibir avisos de tus pedidos y de los inicios de sesión.</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="tarjeta datos">
      <h3>Teléfono</h3>
      {perfil?.telefonoVerificado && !enviado ? (
        <div className="verificado">
          <span className="sello-ok"><Icono nombre="escudo" tam={18} /></span>
          <div><strong>{perfil.telefono}</strong><span className="tenue chico">Verificado. Te avisamos por WhatsApp si alguien entra a tu cuenta desde otro dispositivo.</span></div>
          <button className="boton plano" onClick={() => { setEnviado(null); setTelefono(''); alVerificar({ ...perfil, telefonoVerificado: false }); }}>Cambiar</button>
        </div>
      ) : enviado ? (
        <form className="pila verificar" onSubmit={confirmar}>
          <p className="tenue">Te mandamos un código por WhatsApp al {enviado.telefono}. Vence en 10 minutos.</p>
          <label>
            Código de 6 dígitos
            <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))} className="codigo" />
          </label>
          {error && <p className="nota error">{error}</p>}
          <div className="fila">
            <button className="boton" disabled={ocupado || codigo.length !== 6}>Verificar</button>
            <button type="button" className="boton plano" disabled={ocupado} onClick={pedir}>Reenviar código</button>
          </div>
        </form>
      ) : (
        <form className="pila verificar" onSubmit={pedir}>
          <p className="tenue">Verificá tu número para recibir avisos de tus pedidos y de los inicios de sesión.</p>
          <label>
            Celular con código de área
            <input type="tel" placeholder="388 456-7890" value={telefono} onChange={(e) => setTelefono(e.target.value)} autoComplete="tel" />
          </label>
          {error && <p className="nota error">{error}</p>}
          <button className="boton" disabled={ocupado || telefono.replace(/\D/g, '').length < 10}><Icono nombre="enviar" />Enviarme el código</button>
        </form>
      )}
    </section>
  );
}

/** Seguridad de la cuenta: telefono verificado, ultimos inicios de sesion y salida. */
export function SeguridadCuenta({ sesion, alSalir }) {
  const [perfil, setPerfil] = useState(null);
  const [ingresos, setIngresos] = useState([]);
  const [whatsapp, setWhatsapp] = useState(null);

  useEffect(() => {
    api('/api/auth/opciones').then((o) => setWhatsapp(!!o.whatsapp)).catch(() => setWhatsapp(false));
    api('/api/usuarios/yo').then(setPerfil).catch(() => {});
    api('/api/usuarios/yo/ingresos').then(setIngresos).catch(() => {});
  }, []);

  const verificado = (nuevo) => {
    setPerfil(nuevo);
    const s = leerSesion();
    if (s) guardarSesion({ ...s, telefonoVerificado: !!nuevo.telefonoVerificado });
  };

  return (
    <>
      <Telefono perfil={perfil} alVerificar={verificado} whatsapp={whatsapp} />

      <section className="tarjeta lista">
        <div className="lista-cabeza"><h3>Inicios de sesión recientes</h3></div>
        {ingresos.length === 0 && <p className="tenue vacio">Todavía no hay registros.</p>}
        {ingresos.map((i, n) => (
          <div key={n} className="fila-lista">
            <span className={'fila-icono' + (i.exitoso ? '' : ' alerta')}><Icono nombre={i.exitoso ? 'escudo' : 'cerrar'} tam={18} /></span>
            <span className="fila-texto">
              <strong>{i.dispositivo}</strong>
              <span className="tenue">{fechaHora(i.instante)} · {i.metodo === 'GOOGLE' ? 'Con Google' : 'Con contraseña'}{i.ip ? ' · ' + i.ip : ''}</span>
            </span>
            {!i.exitoso && <span className="chip aviso">Fallido</span>}
          </div>
        ))}
      </section>

      <section className="tarjeta datos">
        <h3>Sesión y datos</h3>
        <dl>
          <div className="dato-fila"><dt>Cuenta</dt><dd>{perfil?.email || sesion.email || sesion.nombre}</dd></div>
          <div className="dato-fila"><dt>Formas de entrar</dt><dd>{[perfil?.conClave && 'Contraseña', perfil?.conGoogle && 'Google'].filter(Boolean).join(' y ') || '...'}</dd></div>
          <div className="dato-fila"><dt>Tus datos</dt><dd>Protegidos por la Ley 25.326</dd></div>
        </dl>
        <button className="boton claro" style={{ marginTop: 16 }} onClick={alSalir}><Icono nombre="salir" />Cerrar sesión</button>
      </section>
    </>
  );
}

/** Comentario propio sobre la version de testing. Lo publica un administrador al aprobarlo. */
export function Comentario() {
  const [texto, setTexto] = useState('');
  const [detalle, setDetalle] = useState('');
  const [mio, setMio] = useState(null);
  const [estado, setEstado] = useState(null);

  useEffect(() => {
    api('/api/testimonios/mio').then((t) => {
      if (t) { setMio(t); setTexto(t.texto); setDetalle(t.detalle || ''); }
    }).catch(() => {});
  }, []);

  const enviar = async (e) => {
    e.preventDefault();
    try {
      const t = await api('/api/testimonios', { metodo: 'POST', cuerpo: { texto, detalle } });
      setMio(t);
      setEstado({ tono: '', texto: '¡Gracias! Lo vamos a revisar y publicar en el inicio.' });
    } catch (p) {
      setEstado({ tono: 'error', texto: p.message });
    }
  };

  return (
    <form className="tarjeta datos" onSubmit={enviar}>
      <h3>Tu experiencia con Viruta</h3>
      <div className="pila" style={{ padding: '16px 20px 20px' }}>
        <p className="tenue">Si probaste la versión de testing, contanos cómo te fue. Si entraste con Google, se va a ver tu foto.</p>
        {mio && (
          <p className={'chip ' + (mio.aprobado ? 'bien' : 'aviso')} style={{ justifySelf: 'start' }}>
            {mio.aprobado ? 'Publicado en el inicio' : 'Pendiente de revisión'}
          </p>
        )}
        <label>
          Quién sos <span className="tenue">(opcional)</span>
          <input type="text" maxLength={120} placeholder="Cliente en Palpalá, carpintería en Tilcara..." value={detalle} onChange={(e) => setDetalle(e.target.value)} />
        </label>
        <label>
          Tu comentario
          <textarea rows={5} maxLength={600} value={texto} onChange={(e) => setTexto(e.target.value)} />
        </label>
        <span className="tenue chico" style={{ justifySelf: 'end' }}>{texto.length}/600</span>
        {estado && <p className={'nota ' + estado.tono}>{estado.texto}</p>}
        <button className="boton" disabled={texto.trim().length < 10}><Icono nombre="enviar" />{mio ? 'Actualizar comentario' : 'Enviar comentario'}</button>
      </div>
    </form>
  );
}
