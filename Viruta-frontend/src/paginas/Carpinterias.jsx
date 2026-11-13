import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { MATERIALES } from '../lib/diseno.js';
import { medidas } from '../lib/unidades.js';
import { Icono } from '../componentes/Iconos.jsx';

const CLAVE_MAPS = import.meta.env.VITE_GOOGLE_MAPS_KEY;

/** Mapa de Google (RF-14). Si no hay clave o Maps falla, queda la lista (RNF-11). */
function Mapa({ carpinterias, elegida, alElegir }) {
  const caja = useRef(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!CLAVE_MAPS) return;
    if (window.google?.maps) return setListo(true);
    const guion = document.createElement('script');
    guion.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(CLAVE_MAPS)}`;
    guion.async = true;
    guion.onload = () => setListo(true);
    document.head.appendChild(guion);
  }, []);

  useEffect(() => {
    if (!listo || !caja.current || carpinterias.length === 0) return;
    const mapa = new window.google.maps.Map(caja.current, {
      center: { lat: -24.1858, lng: -65.2995 }, zoom: 9, disableDefaultUI: true, zoomControl: true,
    });
    carpinterias.forEach((c, i) => {
      const marca = new window.google.maps.Marker({
        map: mapa, title: c.nombre,
        position: { lat: c.latitud + (i % 5) * 0.004, lng: c.longitud + (i % 3) * 0.004 },
      });
      marca.addListener('click', () => alElegir(c));
    });
  }, [listo, carpinterias, alElegir]);

  if (!CLAVE_MAPS) return null;
  return <div ref={caja} className="tarjeta sin-relleno" style={{ height: 280 }} aria-label="Mapa de carpinterías" />;
}

/** F3: elegir una carpinteria que trabaje el material y pedirle presupuesto (RF-14, RF-15). */
export default function Carpinterias() {
  const [parametros] = useSearchParams();
  const proyectoId = Number(parametros.get('proyecto'));
  const [proyecto, setProyecto] = useState(null);
  const [lista, setLista] = useState(null);
  const [elegida, setElegida] = useState(null);
  const [telefono, setTelefono] = useState('');
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  // La misma clave en cada reintento evita pedidos duplicados si se corta la conexion.
  const claveEnvio = useRef(crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());
  const navegar = useNavigate();

  useEffect(() => {
    api('/api/proyectos/' + proyectoId)
      .then((p) => {
        setProyecto(p);
        return api('/api/carpinterias?material=' + p.diseno.material);
      })
      .then(setLista)
      .catch((problema) => setError(problema.message));
  }, [proyectoId]);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      await api('/api/pedidos', {
        metodo: 'POST',
        cuerpo: { proyectoId, carpinteriaId: elegida.id, claveEnvio: claveEnvio.current, telefono, consentimiento: acepta },
      });
      navegar('/mis-pedidos');
    } catch (problema) {
      setError(problema.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="pila">
      <div>
        <h2>Elegí una carpintería</h2>
        {proyecto && <p className="tenue">{proyecto.diseno.nombre} · {medidas(proyecto.diseno)} · {MATERIALES[proyecto.diseno.material]}</p>}
      </div>
      {error && !elegida && <p className="nota error">{error}</p>}
      {lista && lista.length > 0 && <Mapa carpinterias={lista} elegida={elegida} alElegir={setElegida} />}
      {lista && lista.length === 0 && (
        <p className="nota aviso">Todavía no hay carpinterías que trabajen ese material. Tu proyecto quedó guardado.</p>
      )}
      <div className="tres" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {(lista || []).map((c) => (
          <button key={c.id} className="tarjeta elegible pila" onClick={() => setElegida(c)}>
            <div>
              <h3>{c.nombre}</h3>
              <p className="tenue">{c.zona}</p>
            </div>
            <span className="chip bien">Pedir presupuesto</span>
          </button>
        ))}
      </div>

      {elegida && (
        <div className="velo" role="dialog" aria-modal="true">
          <form className="dialogo" onSubmit={enviar}>
            <div>
              <h2>{elegida.nombre}</h2>
              <p className="tenue">Recibe tu diseño, medidas y lista de materiales.</p>
            </div>
            <label>
              Tu teléfono
              <input type="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)} autoComplete="tel" placeholder="388 ..." />
            </label>
            <label className="marcar">
              <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />
              <span className="chico">Acepto compartir mi nombre, teléfono y diseño con esta carpintería.</span>
            </label>
            {error && <p className="nota error">{error}</p>}
            <button className="boton" disabled={!acepta || enviando}><Icono nombre="enviar" />Enviar pedido</button>
            <button type="button" className="boton plano" onClick={() => { setElegida(null); setError(''); }}>Cancelar</button>
          </form>
        </div>
      )}
    </main>
  );
}
