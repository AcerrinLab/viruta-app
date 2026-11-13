import { describe, expect, it } from 'vitest';
import { cmAMm, mmACm, pesos, medidas } from './unidades.js';
import { PLANTILLAS, ajustarARango, aSolicitud, disenoInicial, tieneEspacio } from './diseno.js';
import { cajas, envolvente, tono } from './modelo.js';
import { ACCION_CARPINTERIA, ESTADOS, RECORRIDO, avance, siguienteDeCarpinteria } from './estados.js';

describe('unidades', () => {
  it('convierte centimetros a milimetros enteros una sola vez', () => {
    expect(cmAMm('80')).toBe(800);
    expect(cmAMm('29,5')).toBe(295);
    expect(cmAMm('29.5')).toBe(295);
    expect(cmAMm('')).toBeNull();
    expect(cmAMm('abc')).toBeNull();
  });

  it('muestra milimetros como centimetros', () => {
    expect(mmACm(800)).toBe('80');
    expect(mmACm(295)).toBe('29,5');
    expect(mmACm(null)).toBe('');
  });

  it('ida y vuelta no cambia la medida', () => {
    for (const mm of [150, 295, 764, 2400]) expect(cmAMm(mmACm(mm))).toBe(mm);
  });

  it('formatea pesos y medidas', () => {
    expect(pesos(263000)).toMatch(/263[.\s]?000/);
    expect(medidas({ ancho: 800, alto: 900, profundidad: 300 })).toBe('80 × 90 × 30 cm');
  });
});

describe('diseno', () => {
  it('cada plantilla arranca dentro de su rango', () => {
    for (const id of Object.keys(PLANTILLAS)) {
      const d = disenoInicial(id);
      expect(ajustarARango(d)).toEqual(d);
    }
  });

  it('ajusta las medidas fuera de rango', () => {
    const d = ajustarARango({ ...disenoInicial('ESTANTE'), ancho: 5000, profundidad: 10, estantes: 9 });
    expect(d.ancho).toBe(2400);
    expect(d.profundidad).toBe(150);
    expect(d.estantes).toBe(6);
  });

  it('manda el espacio solo cuando estan las cuatro medidas', () => {
    const base = disenoInicial('ESTANTE');
    expect(tieneEspacio(base)).toBe(false);
    const parcial = { ...base, espacioAncho: 900, espacioAlto: 1000 };
    expect(aSolicitud(parcial).espacioAncho).toBeNull();
    const completo = { ...parcial, espacioProfAdelante: 320, espacioProfAtras: 290 };
    expect(aSolicitud(completo).espacioProfAtras).toBe(290);
    expect(tieneEspacio(completo)).toBe(true);
  });
});

describe('modelo 3D', () => {
  const piezas = [
    { nombre: 'Lateral', rol: 'VERTICAL', x: 0, y: 0, z: 0, dx: 18, dy: 300, dz: 900 },
    { nombre: 'Lateral', rol: 'VERTICAL', x: 782, y: 0, z: 0, dx: 18, dy: 300, dz: 900 },
    { nombre: 'Base', rol: 'HORIZONTAL', x: 18, y: 0, z: 0, dx: 764, dy: 300, dz: 18 },
  ];

  it('pasa de milimetros a metros a escala real', () => {
    expect(envolvente(piezas)).toEqual([0.8, 0.9, 0.3]);
    const [lateral] = cajas(piezas);
    expect(lateral.tam).toEqual([0.018, 0.9, 0.3]);
  });

  it('centra el mueble y lo apoya en el piso', () => {
    const [izquierdo, derecho, base] = cajas(piezas);
    expect(izquierdo.centro[0]).toBeCloseTo(-0.391);
    expect(derecho.centro[0]).toBeCloseTo(0.391);
    expect(base.centro[1]).toBeCloseTo(0.009);
    expect(base.centro[2]).toBeCloseTo(0);
  });

  it('sin piezas no dibuja nada', () => {
    expect(cajas([])).toEqual([]);
    expect(envolvente(null)).toEqual([0, 0, 0]);
  });

  it('el tono devuelve un color valido', () => {
    expect(tono('#D4A373', 'VERTICAL')).toBe('#d4a373');
    expect(tono('#D4A373', 'HORIZONTAL')).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('estados', () => {
  it('todos los estados del recorrido tienen etiqueta', () => {
    for (const e of RECORRIDO) expect(ESTADOS[e].etiqueta).toBeTruthy();
  });

  it('el avance sigue el orden de la maquina de estados', () => {
    expect(avance('PENDIENTE')).toBe(1);
    expect(avance('ENTREGADO')).toBe(6);
    expect(avance('CANCELADO')).toBe(0);
  });

  it('la carpinteria solo avanza despues de la sena', () => {
    expect(siguienteDeCarpinteria('PENDIENTE')).toBeNull();
    expect(siguienteDeCarpinteria('PRESUPUESTADO')).toBeNull();
    expect(siguienteDeCarpinteria('ACEPTADO')).toBe('MEDIDAS_VERIFICADAS');
    expect(siguienteDeCarpinteria('EN_FABRICACION')).toBe('ENTREGADO');
    expect(siguienteDeCarpinteria('ENTREGADO')).toBeNull();
    expect(ACCION_CARPINTERIA.ENTREGADO).toBeTruthy();
  });
});
