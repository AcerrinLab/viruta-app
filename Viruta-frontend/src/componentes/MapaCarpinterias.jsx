import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Mapa de carpinterias (RF-14). Por defecto usa OpenStreetMap con Leaflet: gratis y sin clave.
// Si hay VITE_GOOGLE_MAPS_KEY usa Google Maps. Si el mapa no carga, queda la lista (RNF-11).
// Los marcadores van en el centro de la zona de cada taller: la direccion exacta se comparte
// recien cuando el cliente paga la sena.

const CLAVE_GOOGLE = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const CENTRO_JUJUY = [-24.1858, -65.2995];

// Mosaicos publicos de OpenStreetMap: gratis, sin clave, con atribucion obligatoria.
// Para mucho trafico conviene un proveedor de mosaicos sobre OSM; se cambia en VITE_MAPA_MOSAICOS.
const CAPA = import.meta.env.VITE_MAPA_MOSAICOS || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATRIBUCION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/** Corre un poco los talleres de la misma zona para que no queden uno encima del otro. */
const posicion = (c, i) => [c.latitud + (i % 5) * 0.004, c.longitud + (i % 3) * 0.004];

function MapaOsm({ carpinterias, alElegir }) {
  const caja = useRef(null);

  useEffect(() => {
    if (!caja.current || carpinterias.length === 0) return undefined;
    const mapa = L.map(caja.current, { zoomControl: true, scrollWheelZoom: false, attributionControl: true })
      .setView(CENTRO_JUJUY, 9);
    L.tileLayer(CAPA, { attribution: ATRIBUCION, maxZoom: 19 }).addTo(mapa);

    const puntos = carpinterias.map((c, i) => {
      // Marcador propio con el color del sistema (evita las imagenes por defecto de Leaflet).
      const icono = L.divIcon({
        className: 'marca-taller',
        html: '<span></span>',
        iconSize: [26, 26],
        iconAnchor: [13, 26],
        popupAnchor: [0, -24],
      });
      const p = posicion(c, i);
      const marca = L.marker(p, { icon: icono, title: c.nombre, keyboard: true }).addTo(mapa);
      const ficha = document.createElement('div');
      ficha.className = 'ficha-mapa';
      const nombre = document.createElement('strong');
      nombre.textContent = c.nombre;
      const zona = document.createElement('span');
      zona.textContent = c.zona;
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.textContent = 'Pedir presupuesto';
      boton.addEventListener('click', () => alElegir(c));
      ficha.append(nombre, zona, boton);
      marca.bindPopup(ficha, { closeButton: false });
      return p;
    });
    // Encuadra cuando la tarjeta ya tiene su tamano final (si no, Leaflet calcula con 0 px).
    const encuadrar = () => {
      mapa.invalidateSize();
      if (puntos.length > 1) mapa.fitBounds(puntos, { padding: [36, 36], maxZoom: 12 });
      else mapa.setView(puntos[0], 12);
    };
    const espera = setTimeout(encuadrar, 60);
    const observador = new ResizeObserver(() => mapa.invalidateSize());
    observador.observe(caja.current);

    return () => { clearTimeout(espera); observador.disconnect(); mapa.remove(); };
  }, [carpinterias, alElegir]);

  return <div ref={caja} className="tarjeta sin-relleno mapa-talleres" aria-label="Mapa de carpinterías" />;
}

function MapaGoogle({ carpinterias, alElegir }) {
  const caja = useRef(null);
  const [listo, setListo] = useState(!!window.google?.maps);

  useEffect(() => {
    if (window.google?.maps) return;
    const guion = document.createElement('script');
    guion.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(CLAVE_GOOGLE)}`;
    guion.async = true;
    guion.onload = () => setListo(true);
    document.head.appendChild(guion);
  }, []);

  useEffect(() => {
    if (!listo || !caja.current || carpinterias.length === 0) return;
    const mapa = new window.google.maps.Map(caja.current, {
      center: { lat: CENTRO_JUJUY[0], lng: CENTRO_JUJUY[1] }, zoom: 9, disableDefaultUI: true, zoomControl: true,
    });
    carpinterias.forEach((c, i) => {
      const [lat, lng] = posicion(c, i);
      const marca = new window.google.maps.Marker({ map: mapa, title: c.nombre, position: { lat, lng } });
      marca.addListener('click', () => alElegir(c));
    });
  }, [listo, carpinterias, alElegir]);

  return <div ref={caja} className="tarjeta sin-relleno mapa-talleres" aria-label="Mapa de carpinterías" />;
}

export default function MapaCarpinterias(props) {
  return CLAVE_GOOGLE ? <MapaGoogle {...props} /> : <MapaOsm {...props} />;
}
