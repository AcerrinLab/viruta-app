import { describe, expect, it } from 'vitest';
import { destinoInicio, resumenCliente } from './inicioCliente.js';

// Inicio del cliente con sesion (RF-05, RF-18, RF-19, RNF-02): lo primero que ve es lo que le toca
// hacer a el, no la lista de espera ni el acceso para carpinterias.

const pedido = (id, estado, creado = '2026-11-20T10:00:00', total = null) => ({
  id, estado, creado, diseno: { nombre: 'Mueble ' + id }, presupuesto: total ? { total, sena: total / 2 } : null,
});

describe('a donde lleva el logo segun quien entra', () => {
  it('sin sesion: la portada publica', () => {
    expect(destinoInicio(null)).toBe('publico');
  });
  it('cliente: su propio inicio', () => {
    expect(destinoInicio({ rol: 'CLIENTE' })).toBe('cliente');
  });
  it('carpinteria: su propio inicio; administracion: su panel', () => {
    expect(destinoInicio({ rol: 'CARPINTERIA' })).toBe('taller');
    expect(destinoInicio({ rol: 'ADMIN' })).toBe('/admin');
  });
});

describe('resumen del cliente', () => {
  it('primero lo que necesita su atencion: presupuestos listos para aceptar y pagar', () => {
    const r = resumenCliente([pedido(1, 'PENDIENTE'), pedido(2, 'PRESUPUESTADO', undefined, 200000), pedido(3, 'EN_FABRICACION')], []);
    expect(r.atencion.map((p) => p.id)).toEqual([2]);
    expect(r.atencion[0].accion).toBe('Aceptar y pagar la seña');
  });

  it('separa los pedidos en curso de los cerrados', () => {
    const r = resumenCliente([
      pedido(1, 'PENDIENTE'), pedido(2, 'ACEPTADO'), pedido(3, 'MEDIDAS_VERIFICADAS'),
      pedido(4, 'EN_FABRICACION'), pedido(5, 'ENTREGADO'), pedido(6, 'RECHAZADO'), pedido(7, 'VENCIDO'), pedido(8, 'CANCELADO'),
    ], []);
    expect(r.enCurso.map((p) => p.id).sort()).toEqual([1, 2, 3, 4]);
    expect(r.entregados).toBe(1);
  });

  it('los pedidos en curso van del mas nuevo al mas viejo', () => {
    const r = resumenCliente([pedido(1, 'PENDIENTE', '2026-11-01T10:00:00'), pedido(2, 'ACEPTADO', '2026-11-20T10:00:00')], []);
    expect(r.enCurso.map((p) => p.id)).toEqual([2, 1]);
  });

  it('ofrece retomar hasta 3 proyectos, los mas recientes primero', () => {
    const proyectos = [1, 2, 3, 4].map((id) => ({ id, diseno: { nombre: 'P' + id }, actualizado: `2026-11-0${id}T10:00:00` }));
    const r = resumenCliente([], proyectos);
    expect(r.proyectos.map((p) => p.id)).toEqual([4, 3, 2]);
  });

  it('sin nada todavia, el resumen viene vacio y sin errores', () => {
    const r = resumenCliente(null, null);
    expect(r).toEqual({ atencion: [], enCurso: [], entregados: 0, proyectos: [] });
  });
});
