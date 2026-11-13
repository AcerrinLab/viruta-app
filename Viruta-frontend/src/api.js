// Cliente de la API. El token se guarda en el navegador; si el almacenamiento falla, la sesion vive en memoria.

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const CLAVE = 'viruta.sesion';
let memoria = null;

export function leerSesion() {
  if (memoria) return memoria;
  try {
    memoria = JSON.parse(localStorage.getItem(CLAVE));
  } catch {
    memoria = null;
  }
  return memoria;
}

export function guardarSesion(sesion) {
  memoria = sesion;
  try {
    if (sesion) localStorage.setItem(CLAVE, JSON.stringify(sesion));
    else localStorage.removeItem(CLAVE);
  } catch {
    // Sin almacenamiento disponible: la sesion dura hasta cerrar la pestana.
  }
}

export async function api(ruta, { metodo = 'GET', cuerpo } = {}) {
  const cabeceras = {};
  const sesion = leerSesion();
  if (sesion?.token) cabeceras.Authorization = 'Bearer ' + sesion.token;
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
  let respuesta;
  try {
    respuesta = await fetch(BASE + ruta, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new Error('No pudimos conectar. Revisá tu conexión.');
  }
  if (respuesta.status === 401 && sesion?.token) {
    guardarSesion(null);
    window.location.assign('/ingresar');
    throw new Error('Tu sesión venció. Ingresá de nuevo.');
  }
  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new Error(datos?.error || 'Algo salió mal. Probá de nuevo.');
  return datos;
}

/** Canal en tiempo real del panel (RF-29). Devuelve una funcion para cerrarlo. */
export function escucharEventos(alRecibir) {
  const sesion = leerSesion();
  if (!sesion?.token || typeof EventSource === 'undefined') return () => {};
  const fuente = new EventSource(BASE + '/api/eventos?token=' + encodeURIComponent(sesion.token));
  fuente.addEventListener('pedido-nuevo', (e) => alRecibir('pedido-nuevo', e.data));
  fuente.addEventListener('sena-pagada', (e) => alRecibir('sena-pagada', e.data));
  return () => fuente.close();
}

const BORRADOR = 'viruta.borrador';

export function leerBorrador() {
  try {
    return JSON.parse(localStorage.getItem(BORRADOR));
  } catch {
    return null;
  }
}

export function guardarBorrador(borrador) {
  try {
    if (borrador) localStorage.setItem(BORRADOR, JSON.stringify(borrador));
    else localStorage.removeItem(BORRADOR);
  } catch {
    // El borrador es una comodidad: si no se puede guardar, se sigue igual.
  }
}
