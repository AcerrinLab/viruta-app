import * as THREE from 'three';

// Texturas de madera generadas en el navegador (sin imagenes externas). Se usan igual en el
// visor 3D y en el modelo que se exporta para la AR, asi el mueble se ve igual en los dos.

const TAM = 512;
const cache = new Map();

/** Cuanto se nota la veta segun la terminacion: la madera natural mas, la melamina lisa casi nada. */
const VETA = { '#D4A373': 0.2, '#6E4E37': 0.26, '#F1EEE7': 0.035, '#3F3F3C': 0.06 };

function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

/** Ruido suave y repetible en los bordes: solo usa senos con periodos enteros del tamano. */
function ondas(x, y, semilla) {
  const t = (2 * Math.PI) / TAM;
  return (
    Math.sin(t * (1 * x) + semilla) * 6 +
    Math.sin(t * (3 * x + 1 * y) + semilla * 2.1) * 3 +
    Math.sin(t * (7 * x - 1 * y) + semilla * 0.7) * 1.2 +
    Math.sin(t * (2 * y) + semilla * 3.3) * 5
  );
}

function pintar(hex, intensidad) {
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = TAM;
  const ctx = lienzo.getContext('2d');
  const img = ctx.createImageData(TAM, TAM);
  const [r, g, b] = rgb(hex);
  const t = (2 * Math.PI) / TAM;

  for (let y = 0; y < TAM; y++) {
    for (let x = 0; x < TAM; x++) {
      // Vetas largas a lo largo de X, con anillos que se ondulan.
      const desvio = ondas(x, y, 1.3);
      // Dos familias de anillos con periodos distintos para que no se vea un patron regular.
      const anillo = Math.sin(t * 7 * (y + desvio)) * 0.6 + Math.sin(t * 13 * (y + desvio * 1.3) + 1.7) * 0.4;
      const fino = Math.sin(t * 47 * (y + desvio * 0.5) + Math.sin(t * 2 * x) * 1.5);
      const poro = Math.sin(t * (157 * x + 7 * y)) * Math.sin(t * (211 * y + 3 * x));
      let f = 0.6 * Math.pow((anillo + 1) / 2, 4) + 0.22 * ((fino + 1) / 2) + 0.18 * ((poro + 1) / 2);
      f = 1 - intensidad * f + intensidad * 0.4;
      const i = (y * TAM + x) * 4;
      img.data[i] = Math.min(255, r * f);
      img.data[i + 1] = Math.min(255, g * f);
      img.data[i + 2] = Math.min(255, b * f);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return lienzo;
}

/** Textura de madera para un color de terminacion. Se genera una sola vez por color. */
export function texturaMadera(hex) {
  const clave = hex.toUpperCase();
  if (cache.has(clave)) return cache.get(clave);
  const textura = new THREE.CanvasTexture(pintar(clave, VETA[clave] ?? 0.16));
  textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 8;
  cache.set(clave, textura);
  return textura;
}

/**
 * Caja con coordenadas de textura en metros, para que la veta corra siempre a lo largo de la
 * cara mas larga de cada pieza y no se estire. `semilla` corre la veta para que dos piezas
 * iguales no se vean calcadas.
 */
export function cajaMadera(tam, semilla = 0) {
  const geo = new THREE.BoxGeometry(...tam);
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = geo.attributes.uv;
  const escala = 1.1; // metros que ocupa una repeticion de la textura
  const corrimiento = (semilla * 0.37) % 1;

  for (let i = 0; i < pos.count; i++) {
    const n = [Math.abs(nor.getX(i)), Math.abs(nor.getY(i)), Math.abs(nor.getZ(i))];
    const eje = n.indexOf(Math.max(...n));
    const [a, b] = [0, 1, 2].filter((k) => k !== eje);
    const largoA = tam[a];
    const largoB = tam[b];
    const p = [pos.getX(i), pos.getY(i), pos.getZ(i)];
    const [u, v] = largoA >= largoB ? [p[a], p[b]] : [p[b], p[a]];
    uv.setXY(i, u / escala + corrimiento, v / escala + corrimiento * 1.7);
  }
  uv.needsUpdate = true;
  return geo;
}
