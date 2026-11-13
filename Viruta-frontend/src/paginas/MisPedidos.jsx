import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Chip, PasosPedido } from '../componentes/Comunes.jsx';
import { MATERIALES } from '../lib/diseno.js';
import { medidas, pesos } from '../lib/unidades.js';

/** Pantalla del cliente: sus pedidos con el estado actualizado y sus proyectos guardados (RF-05, RF-18, RF-19). */
export default function MisPedidos() {
  const [pedidos, setPedidos] = useState(null);
  const [proyectos, setProyectos] = useState([]);
  const [error, setError] = useState('');

  const cargar = () => {
    Promise.all([api('/api/pedidos'), api('/api/proyectos')])
      .then(([a, b]) => { setPedidos(a); setProyectos(b); })
      .catch((problema) => setError(problema.message));
  };
  useEffect(cargar, []);

  const pagar = async (id) => {
    try {
      const { urlPago } = await api(`/api/pagos/pedidos/${id}/iniciar`, { metodo: 'POST' });
      window.location.assign(urlPago);
    } catch (problema) {
      setError(problema.message);
    }
  };

  const rechazar = async (id) => {
    try {
      await api(`/api/pedidos/${id}/rechazar`, { metodo: 'POST' });
      cargar();
    } catch (problema) {
      setError(problema.message);
    }
  };

  return (
    <main className="pila">
      <div className="fila entre">
        <h2>Mis pedidos</h2>
        <Link to="/disenar" className="boton claro">Nuevo mueble</Link>
      </div>
      {error && <p className="nota error">{error}</p>}
      {pedidos && pedidos.length === 0 && <p className="tenue">Todavía no pediste ningún presupuesto.</p>}

      {(pedidos || []).map((p) => (
        <article key={p.id} className="tarjeta pila">
          <div className="fila entre">
            <div>
              <h3>{p.diseno.nombre}</h3>
              <p className="tenue">{p.carpinteria?.nombre} · {medidas(p.diseno)}</p>
            </div>
            <Chip estado={p.estado} />
          </div>
          <PasosPedido estado={p.estado} />

          {p.presupuesto && (
            <div className="tres">
              <div className="dato"><span className="tenue">Total</span><strong>{pesos(p.presupuesto.total)}</strong></div>
              <div className="dato"><span className="tenue">Seña</span><strong>{pesos(p.presupuesto.sena)}</strong></div>
              {p.presupuesto.plazoDias && <div className="dato"><span className="tenue">Plazo</span><strong>{p.presupuesto.plazoDias} días</strong></div>}
            </div>
          )}
          {p.presupuesto?.clienteCompraMaterial && (
            <p className="tenue chico">Vos comprás el material ({pesos(p.presupuesto.materiales)} aprox.). El total es la mano de obra.</p>
          )}
          {p.estado === 'PRESUPUESTADO' && (
            <div className="fila">
              <button className="boton" onClick={() => pagar(p.id)}>Aceptar y pagar seña</button>
              <button className="boton plano" onClick={() => rechazar(p.id)}>Rechazar</button>
            </div>
          )}
          {p.carpinteria?.direccion && (
            <p className="nota">Taller: {p.carpinteria.direccion} · WhatsApp {p.carpinteria.whatsapp}</p>
          )}
        </article>
      ))}

      {proyectos.length > 0 && <h2 style={{ marginTop: 16 }}>Mis proyectos</h2>}
      <div className="tres" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {proyectos.map((p) => (
          <article key={p.id} className="tarjeta pila">
            <div>
              <h3>{p.diseno.nombre}</h3>
              <p className="tenue">{medidas(p.diseno)} · {MATERIALES[p.diseno.material]}</p>
            </div>
            <div className="fila">
              <Link to={'/disenar?proyecto=' + p.id} className="boton claro">Abrir</Link>
              <Link to={'/carpinterias?proyecto=' + p.id} className="boton plano">Pedir presupuesto</Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
