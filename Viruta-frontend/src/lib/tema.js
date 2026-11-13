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
