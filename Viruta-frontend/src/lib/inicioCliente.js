// Inicio segun quien entra (RF-05, RF-18, RF-19, RNF-02). Sin sesion se ve la portada publica con la
// lista de espera; el cliente ve su propio inicio; carpinteria y administracion van a su panel.

const EN_CURSO = ['PENDIENTE', 'PRESUPUESTADO', 'ACEPTADO', 'MEDIDAS_VERIFICADAS', 'EN_FABRICACION'];

/** Lo que el cliente tiene que hacer en cada estado, si le toca a el. */
const ACCIONES = {
  PRESUPUESTADO: 'Aceptar y pagar la seña',
};

/** 'publico', 'cliente', 'taller' o la ruta del panel de administracion. */
export function destinoInicio(sesion) {
  if (!sesion) return 'publico';
  if (sesion.rol === 'CARPINTERIA') return 'taller';
  if (sesion.rol === 'ADMIN') return '/admin';
  return 'cliente';
}

const reciente = (campo) => (a, b) => String(b[campo] || '').localeCompare(String(a[campo] || ''));

/** Ordena lo que el cliente necesita ver al entrar. */
export function resumenCliente(pedidos, proyectos) {
  const lista = pedidos || [];
  const atencion = lista
    .filter((p) => ACCIONES[p.estado])
    .map((p) => ({ ...p, accion: ACCIONES[p.estado] }))
    .sort(reciente('creado'));
  return {
    atencion,
    enCurso: lista.filter((p) => EN_CURSO.includes(p.estado)).sort(reciente('creado')),
    entregados: lista.filter((p) => p.estado === 'ENTREGADO').length,
    proyectos: [...(proyectos || [])].sort(reciente('actualizado')).slice(0, 3),
  };
}
