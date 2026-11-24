// Carga de pantallas bajo demanda y precarga en momentos ociosos (RNF-04, RNF-05).
// Cada funcion devuelve el import dinamico de su pagina: Vite la separa en su propio archivo.

export const paginas = {
  disenar: () => import('../paginas/Disenar.jsx'),
  carpinterias: () => import('../paginas/Carpinterias.jsx'),
  misPedidos: () => import('../paginas/MisPedidos.jsx'),
  panel: () => import('../paginas/Panel.jsx'),
  pagoSimulado: () => import('../paginas/PagoSimulado.jsx'),
  admin: () => import('../paginas/Admin.jsx'),
  cuenta: () => import('../paginas/Cuenta.jsx'),
  inicioCliente: () => import('../paginas/InicioCliente.jsx'),
  inicioTaller: () => import('../paginas/InicioTaller.jsx'),
};

/** Que conviene tener listo segun quien entra: lo mas probable que abra despues. */
export function pantallasProbables(rol) {
  if (rol === 'CARPINTERIA') return ['inicioTaller', 'panel', 'cuenta'];
  if (rol === 'ADMIN') return ['admin', 'cuenta'];
  if (rol === 'CLIENTE') return ['inicioCliente', 'disenar', 'misPedidos', 'cuenta'];
  return ['disenar'];
}

/**
 * Precarga las pantallas probables cuando el navegador esta ocioso, sin competir con lo que la
 * persona esta viendo. Respeta el "ahorro de datos" del celular: con el ahorro prendido no precarga.
 */
export function precargarSegunRol(rol, entorno = globalThis) {
  const conexion = entorno.navigator?.connection;
  if (conexion?.saveData || /(^|-)2g$/.test(conexion?.effectiveType || '')) return [];
  const lista = pantallasProbables(rol);
  const ocioso = entorno.requestIdleCallback || ((f) => setTimeout(f, 1500));
  ocioso(() => lista.forEach((p) => paginas[p]().catch(() => {})));
  return lista;
}
