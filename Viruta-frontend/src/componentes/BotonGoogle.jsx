import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

// Boton oficial de Google Identity Services. Solo aparece si hay VITE_GOOGLE_CLIENT_ID y el backend
// tiene configurado el mismo client id (GOOGLE_CLIENT_ID). La credencial la valida el backend.

const CLIENTE = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
let cargando = null;

function cargarScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!cargando) {
    cargando = new Promise((resolver, rechazar) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = resolver;
      s.onerror = rechazar;
      document.head.appendChild(s);
    });
  }
  return cargando;
}

export default function BotonGoogle({ rol, alEntrar, alError, texto = 'continue_with' }) {
  const caja = useRef(null);
  const rolActual = useRef(rol);
  const [disponible, setDisponible] = useState(false);
  rolActual.current = rol;

  useEffect(() => {
    if (!CLIENTE) return;
    api('/api/auth/opciones').then((o) => setDisponible(!!o.google)).catch(() => setDisponible(false));
  }, []);

  useEffect(() => {
    if (!disponible) return;
    let vigente = true;
    cargarScript().then(() => {
      if (!vigente || !caja.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENTE,
        callback: async ({ credential }) => {
          try {
            const datos = await api('/api/auth/google', {
              metodo: 'POST',
              cuerpo: { credencial: credential, rol: rolActual.current, consentimiento: true },
            });
            alEntrar(datos);
          } catch (e) {
            alError(e.message);
          }
        },
      });
      const oscuro = document.documentElement.dataset.tema === 'oscuro';
      window.google.accounts.id.renderButton(caja.current, {
        theme: oscuro ? 'filled_black' : 'outline', size: 'large', shape: 'pill', text: texto,
        width: Math.min(caja.current.clientWidth || 360, 400), locale: 'es',
      });
    }).catch(() => setDisponible(false));
    return () => { vigente = false; };
  }, [disponible, texto, alEntrar, alError]);

  if (!disponible) return null;
  return (
    <div className="google">
      <div className="separador"><span>o</span></div>
      <div ref={caja} className="google-boton" />
      <p className="tenue chico">Al continuar con Google aceptás que Viruta use tus datos para gestionar tus pedidos (Ley 25.326).</p>
    </div>
  );
}
