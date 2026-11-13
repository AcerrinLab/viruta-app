import { useEffect, useState } from 'react';

// Tema claro u oscuro. Si la persona no eligio, sigue al sistema y cambia junto con el.

const CLAVE = 'viruta.tema';

export function temaGuardado() {
  try {
    const t = localStorage.getItem(CLAVE);
    return t === 'claro' || t === 'oscuro' ? t : null;
  } catch {
    return null;
  }
}

const sistemaOscuro = () => typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;

export function temaActual() {
  return temaGuardado() || (sistemaOscuro() ? 'oscuro' : 'claro');
}

export function aplicarTemaVisual(tema = temaActual()) {
  document.documentElement.dataset.tema = tema;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', tema === 'oscuro' ? '#131513' : '#F0F5F2');
}

export function guardarTema(tema) {
  try {
    localStorage.setItem(CLAVE, tema);
  } catch {
    // Sin almacenamiento: el tema dura hasta recargar.
  }
  aplicarTemaVisual(tema);
  window.dispatchEvent(new Event('viruta-tema'));
}

/** Vuelve a seguir el tema del sistema. */
export function olvidarTema() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // nada
  }
  aplicarTemaVisual();
  window.dispatchEvent(new Event('viruta-tema'));
}

/** Escucha los cambios del sistema mientras la persona no haya elegido un tema. */
export function seguirSistema(alCambiar) {
  if (typeof matchMedia !== 'function') return () => {};
  const consulta = matchMedia('(prefers-color-scheme: dark)');
  const oyente = () => {
    if (!temaGuardado()) {
      aplicarTemaVisual();
      alCambiar(temaActual());
    }
  };
  consulta.addEventListener('change', oyente);
  return () => consulta.removeEventListener('change', oyente);
}

// ---------- Ambiente: luces de fondo y su movimiento ----------

const CLAVE_AMBIENTE = 'viruta.ambiente';
const AMBIENTE_INICIAL = { luces: false, movimiento: true };

export function leerAmbiente() {
  try {
    return { ...AMBIENTE_INICIAL, ...JSON.parse(localStorage.getItem(CLAVE_AMBIENTE) || '{}') };
  } catch {
    return { ...AMBIENTE_INICIAL };
  }
}

export function aplicarAmbiente(a = leerAmbiente()) {
  const raiz = document.documentElement;
  raiz.dataset.luces = a.luces ? 'si' : 'no';
  raiz.dataset.movimiento = a.movimiento ? 'si' : 'no';
}

export function guardarAmbiente(a) {
  try {
    localStorage.setItem(CLAVE_AMBIENTE, JSON.stringify(a));
  } catch {
    // Sin almacenamiento: dura hasta recargar.
  }
  aplicarAmbiente(a);
  window.dispatchEvent(new Event('viruta-ambiente'));
}

/** Estado del ambiente compartido entre el menu del usuario y las preferencias. */
export function usarAmbiente() {
  const [ambiente, setAmbiente] = useState(leerAmbiente());
  useEffect(() => {
    const oir = () => setAmbiente(leerAmbiente());
    window.addEventListener('viruta-ambiente', oir);
    return () => window.removeEventListener('viruta-ambiente', oir);
  }, []);
  return [ambiente, (cambios) => guardarAmbiente({ ...leerAmbiente(), ...cambios })];
}

/** Tema actual, al dia con el boton, el menu y el sistema. */
export function usarTema() {
  const [tema, setTema] = useState(temaActual());
  useEffect(() => {
    const oir = () => setTema(temaActual());
    window.addEventListener('viruta-tema', oir);
    const dejar = seguirSistema(setTema);
    return () => { window.removeEventListener('viruta-tema', oir); dejar(); };
  }, []);
  return tema;
}

/** true en pantallas de celular. */
export function usarMovil() {
  const consulta = '(max-width: 767px)';
  const [movil, setMovil] = useState(() => typeof matchMedia === 'function' && matchMedia(consulta).matches);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return undefined;
    const m = matchMedia(consulta);
    const oir = () => setMovil(m.matches);
    m.addEventListener('change', oir);
    return () => m.removeEventListener('change', oir);
  }, []);
  return movil;
}
