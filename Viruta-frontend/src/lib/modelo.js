// Convierte las piezas del backend (milimetros; X derecha, Y fondo, Z arriba) en cajas para
// three.js (metros; Y arriba, el frente mira hacia +Z). Es la misma geometria para el 3D y la AR.

export function cajas(piezas) {
  if (!piezas || piezas.length === 0) return [];
  const ancho = Math.max(...piezas.map((p) => p.x + p.dx));
  const fondo = Math.max(...piezas.map((p) => p.y + p.dy));
  return piezas.map((p) => ({
    nombre: p.nombre,
    rol: p.rol,
    tam: [p.dx / 1000, p.dz / 1000, p.dy / 1000],
    centro: [
      (p.x + p.dx / 2 - ancho / 2) / 1000,
      (p.z + p.dz / 2) / 1000,
      -(p.y + p.dy / 2 - fondo / 2) / 1000,
    ],
  }));
}

/** Medidas generales del mueble en metros: [ancho, alto, fondo]. */
export function envolvente(piezas) {
  if (!piezas || piezas.length === 0) return [0, 0, 0];
  return [
    Math.max(...piezas.map((p) => p.x + p.dx)) / 1000,
    Math.max(...piezas.map((p) => p.z + p.dz)) / 1000,
    Math.max(...piezas.map((p) => p.y + p.dy)) / 1000,
  ];
}

/** Las piezas horizontales van apenas mas oscuras para que el mueble se lea mejor. */
export function tono(hex, rol) {
  const factor = rol === 'HORIZONTAL' || rol === 'REFUERZO' ? 0.93 : rol === 'PUERTA' ? 1.04 : 1;
  const n = parseInt(hex.slice(1), 16);
  const canal = (v) => Math.max(0, Math.min(255, Math.round(v * factor)));
  const r = canal(n >> 16);
  const g = canal((n >> 8) & 255);
  const b = canal(n & 255);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
