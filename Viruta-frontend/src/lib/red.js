// Pedidos HTTP pensados para servidores gratis que se duermen (RNF-04, RNF-11, RNF-14).
// - Reintenta solo lo seguro: GET ante cortes de red o 502/503/504 (el servidor esta arrancando).
//   Nunca reintenta POST, PUT o DELETE: podria duplicar un pedido o un pago.
// - Si la respuesta tarda, avisa "despertando" para que la pantalla lo diga, y "listo" al terminar.

const ARRANCANDO = new Set([502, 503, 504]);

const dormirReal = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {string} url
 * @param {RequestInit} opciones
 * @param {{ fetch?: typeof fetch, dormir?: (ms: number) => Promise<void>, intentos?: number,
 *           umbralLento?: number, alCambiarEstado?: (estado: 'despertando' | 'listo') => void }} [config]
 * @returns {Promise<Response>}
 */
export async function pedir(url, opciones = {}, config = {}) {
  const {
    fetch: traer = globalThis.fetch,
    dormir = dormirReal,
    intentos = 5,
    umbralLento = 2500,
    alCambiarEstado = () => {},
  } = config;
  const metodo = (opciones.method || 'GET').toUpperCase();
  const reintentable = metodo === 'GET' || metodo === 'HEAD';
  const maximo = reintentable ? Math.max(1, intentos) : 1;

  let avisado = false;
  const reloj = setTimeout(() => { avisado = true; alCambiarEstado('despertando'); }, umbralLento);
  try {
    for (let intento = 1; ; intento++) {
      try {
        const respuesta = await traer(url, opciones);
        if (reintentable && ARRANCANDO.has(respuesta.status) && intento < maximo) {
          await dormir(espera(intento));
          continue;
        }
        return respuesta;
      } catch (error) {
        if (intento >= maximo) throw error;
        await dormir(espera(intento));
      }
    }
  } finally {
    clearTimeout(reloj);
    if (avisado) alCambiarEstado('listo');
  }
}

/** 1 s, 2 s, 4 s, 8 s... con tope de 10 s: un servidor dormido tarda entre 20 y 60 s en arrancar. */
function espera(intento) {
  return Math.min(1000 * 2 ** (intento - 1), 10000);
}
