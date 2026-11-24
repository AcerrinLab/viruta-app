import { describe, expect, it } from 'vitest';
import { bordeDe, luminancia, piezasDe } from './miniatura.js';

// Miniatura del mueble en las listas (RF-19, RF-28, RNF-02): se tiene que ver el diseno en el cuadro,
// tanto para el cliente como para la carpinteria, y en los dos temas.

const pieza = { nombre: 'Lateral', rol: 'VERTICAL', x: 0, y: 0, z: 0, dx: 18, dy: 300, dz: 900 };

describe('de donde salen las piezas de la miniatura', () => {
  it('en las listas vienen sueltas, en "piezas"', () => {
    expect(piezasDe({ piezas: [pieza], calculo: null })).toEqual([pieza]);
  });
  it('en el detalle vienen dentro del calculo', () => {
    expect(piezasDe({ calculo: { piezas: [pieza] } })).toEqual([pieza]);
  });
  it('sin piezas devuelve una lista vacia, sin fallar', () => {
    expect(piezasDe({})).toEqual([]);
    expect(piezasDe(null)).toEqual([]);
  });
});

describe('contorno de las piezas', () => {
  it('una madera clara lleva un contorno mas oscuro que ella', () => {
    expect(luminancia(bordeDe('#D4A373'))).toBeLessThan(luminancia('#D4A373'));
  });
  it('una madera oscura (grafito, nogal) lleva un contorno claro para no perderse en el tema oscuro', () => {
    expect(luminancia(bordeDe('#3F3F3C'))).toBeGreaterThan(luminancia('#3F3F3C'));
    expect(luminancia(bordeDe('#6E4E37'))).toBeGreaterThan(luminancia('#6E4E37'));
  });
});
