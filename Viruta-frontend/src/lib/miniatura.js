// Datos de la miniatura del mueble. Las listas de pedidos traen solo "piezas" (liviano); el detalle
// trae el calculo completo, que tambien las incluye.

export const piezasDe = (pedido) => pedido?.piezas || pedido?.calculo?.piezas || [];

const canales = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};
const aHex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

/** Brillo percibido entre 0 (negro) y 1 (blanco). */
export function luminancia(hex) {
  const [r, g, b] = canales(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Oscurece (f < 1) o lleva hacia el blanco (f > 1) un color. */
export function ajustar(hex, f) {
  const c = canales(hex);
  return aHex(f <= 1 ? c.map((v) => v * f) : c.map((v) => v + (255 - v) * (f - 1)));
}

/** Contorno de las piezas: mas oscuro en maderas claras, mas claro en grafito o nogal. */
export const bordeDe = (hex) => (luminancia(hex) < 0.4 ? ajustar(hex, 1.45) : ajustar(hex, 0.7));
