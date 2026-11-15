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

  if (!disponible) {
    // En desarrollo se muestra un aviso para saber que falta configurar; en produccion no aparece nada.
    if (!import.meta.env.DEV) return null;
    return (
      <div className="google">
        <div className="separador"><span>o</span></div>
        <div className="google-falta" title="Falta GOOGLE_CLIENT_ID en el backend y VITE_GOOGLE_CLIENT_ID en el frontend">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
          </svg>
          Google: falta configurar el client id
        </div>
      </div>
    );
  }
  return (
    <div className="google">
      <div className="separador"><span>o</span></div>
      <div ref={caja} className="google-boton" />
      <p className="tenue chico">Al continuar con Google aceptás que Viruta use tus datos para gestionar tus pedidos (Ley 25.326).</p>
    </div>
  );
}
