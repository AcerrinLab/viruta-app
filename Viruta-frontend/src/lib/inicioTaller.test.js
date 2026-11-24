import { describe, expect, it } from 'vitest';
import { destinoInicio } from './inicioCliente.js';
import { resumenTaller } from './inicioTaller.js';

// Inicio del carpintero (RF-27 a RF-30, RNF-02): primero lo que vence, despues lo que tiene que avanzar.

const AHORA = new Date('2026-11-24T12:00:00Z');
const hace = (horas) => new Date(AHORA.getTime() - horas * 3600 * 1000).toISOString();
const pedido = (id, estado, horas = 1, extra = {}) => ({ id, estado, creado: hace(horas), leido: true, diseno: { nombre: 'M' + id }, ...extra });

describe('a donde lleva el logo a la carpinteria', () => {
  it('a su propio inicio, no a la lista de espera', () => {
    expect(destinoInicio({ rol: 'CARPINTERIA' })).toBe('taller');
  });
});

describe('resumen del taller', () => {
  it('los pedidos nuevos van primero los mas viejos, con las horas que les quedan antes de vencer (72 h)', () => {
    const r = resumenTaller([pedido(1, 'PENDIENTE', 10), pedido(2, 'PENDIENTE', 60), pedido(3, 'ACEPTADO')], null, AHORA);
    expect(r.responder.map((p) => p.id)).toEqual([2, 1]);
    expect(r.responder[0].horasRestantes).toBe(12);
    expect(r.responder[0].urgente).toBe(true);
    expect(r.responder[1].horasRestantes).toBe(62);
    expect(r.responder[1].urgente).toBe(false);
  });

  it('un pedido vencido por tiempo no queda con horas negativas', () => {
    expect(resumenTaller([pedido(1, 'PENDIENTE', 80)], null, AHORA).responder[0].horasRestantes).toBe(0);
  });

  it('los trabajos con sena pagada muestran el siguiente paso que le toca al taller', () => {
    const r = resumenTaller([pedido(1, 'ACEPTADO'), pedido(2, 'MEDIDAS_VERIFICADAS'), pedido(3, 'EN_FABRICACION')], null, AHORA);
    expect(r.avanzar.map((p) => p.accion)).toEqual(['Marcar medidas verificadas', 'Marcar en fabricación', 'Marcar entregado']);
  });

  it('cuenta los presupuestos que esperan al cliente y los pedidos sin leer', () => {
    const r = resumenTaller([pedido(1, 'PRESUPUESTADO'), pedido(2, 'PRESUPUESTADO'), pedido(3, 'PENDIENTE', 1, { leido: false })], null, AHORA);
    expect(r.esperandoCliente).toBe(2);
    expect(r.sinLeer).toBe(1);
  });

  it('dice que le falta al perfil para aparecer completo en el mapa', () => {
    const r = resumenTaller([], { zona: 'SAN_SALVADOR', whatsapp: '', direccion: null, materiales: ['PINO'] }, AHORA);
    expect(r.perfil.completos).toBe(2);
    expect(r.perfil.faltan).toEqual(['WhatsApp', 'Dirección del taller']);
  });

  it('sin datos no falla', () => {
    const r = resumenTaller(null, null, AHORA);
    expect(r.responder).toEqual([]);
    expect(r.avanzar).toEqual([]);
    expect(r.perfil.completos).toBe(0);
  });
});
