// Inicio del carpintero (RF-27 a RF-30, RNF-02): lo que vence primero, lo que tiene que avanzar y lo
// que le falta al perfil. Logica pura, con el reloj inyectable para poder probarla.

import { ACCION_CARPINTERIA, siguienteDeCarpinteria } from './estados.js';

/** Sin respuesta de la carpinteria en 72 horas, el pedido vence (igual que el backend). */
export const HORAS_PARA_RESPONDER = 72;
const URGENTE = 24;
const CON_SENA = ['ACEPTADO', 'MEDIDAS_VERIFICADAS', 'EN_FABRICACION'];

const CAMPOS_PERFIL = [
  ['zona', 'Zona'],
  ['whatsapp', 'WhatsApp'],
  ['direccion', 'Dirección del taller'],
  ['materiales', 'Materiales que trabajás'],
];

const tiene = (v) => (Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && String(v).trim() !== '');

export function resumenTaller(pedidos, perfil, ahora = new Date()) {
  const lista = pedidos || [];
  const horasDesde = (fecha) => (ahora.getTime() - new Date(fecha).getTime()) / 3600000;

  const responder = lista
    .filter((p) => p.estado === 'PENDIENTE')
    .map((p) => {
      const horasRestantes = Math.max(0, Math.floor(HORAS_PARA_RESPONDER - horasDesde(p.creado)));
      return { ...p, horasRestantes, urgente: horasRestantes < URGENTE };
    })
    .sort((a, b) => a.horasRestantes - b.horasRestantes);

  const avanzar = lista
    .filter((p) => CON_SENA.includes(p.estado))
    .map((p) => ({ ...p, accion: ACCION_CARPINTERIA[siguienteDeCarpinteria(p.estado)] }))
    .sort((a, b) => CON_SENA.indexOf(a.estado) - CON_SENA.indexOf(b.estado));

  const faltan = CAMPOS_PERFIL.filter(([campo]) => !tiene(perfil?.[campo])).map(([, etiqueta]) => etiqueta);

  return {
    responder,
    avanzar,
    esperandoCliente: lista.filter((p) => p.estado === 'PRESUPUESTADO').length,
    entregados: lista.filter((p) => p.estado === 'ENTREGADO').length,
    sinLeer: lista.filter((p) => !p.leido).length,
    perfil: { completos: CAMPOS_PERFIL.length - faltan.length, total: CAMPOS_PERFIL.length, faltan },
  };
}
