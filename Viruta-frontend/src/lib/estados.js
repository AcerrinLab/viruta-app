// Estados del pedido, con el texto corto que ve cada persona.

export const ESTADOS = {
  PENDIENTE: { etiqueta: 'Esperando presupuesto', tono: 'neutro' },
  PRESUPUESTADO: { etiqueta: 'Presupuesto listo', tono: 'aviso' },
  ACEPTADO: { etiqueta: 'Seña pagada', tono: 'bien' },
  MEDIDAS_VERIFICADAS: { etiqueta: 'Medidas verificadas', tono: 'bien' },
  EN_FABRICACION: { etiqueta: 'En fabricación', tono: 'bien' },
  ENTREGADO: { etiqueta: 'Entregado', tono: 'bien' },
  RECHAZADO: { etiqueta: 'Rechazado', tono: 'apagado' },
  VENCIDO: { etiqueta: 'Vencido', tono: 'apagado' },
  CANCELADO: { etiqueta: 'Cancelado', tono: 'apagado' },
};

export const RECORRIDO = ['PENDIENTE', 'PRESUPUESTADO', 'ACEPTADO', 'MEDIDAS_VERIFICADAS', 'EN_FABRICACION', 'ENTREGADO'];

/** Cuantos pasos del recorrido ya se completaron (0 si el pedido se corto). */
export function avance(estado) {
  const i = RECORRIDO.indexOf(estado);
  return i < 0 ? 0 : i + 1;
}

/** Proximo estado que puede marcar la carpinteria, o null si no le toca a ella. */
export function siguienteDeCarpinteria(estado) {
  return { ACEPTADO: 'MEDIDAS_VERIFICADAS', MEDIDAS_VERIFICADAS: 'EN_FABRICACION', EN_FABRICACION: 'ENTREGADO' }[estado] || null;
}

export const ACCION_CARPINTERIA = {
  MEDIDAS_VERIFICADAS: 'Marcar medidas verificadas',
  EN_FABRICACION: 'Marcar en fabricación',
  ENTREGADO: 'Marcar entregado',
};
