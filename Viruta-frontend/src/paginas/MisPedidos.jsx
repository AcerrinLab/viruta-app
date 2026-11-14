import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Chip, PasosPedido } from '../componentes/Comunes.jsx';
import { MATERIALES } from '../lib/diseno.js';
import { medidas, pesos } from '../lib/unidades.js';
import { Icono } from '../componentes/Iconos.jsx';
import Miniatura from '../componentes/Miniatura.jsx';
import { ESTADOS } from '../lib/estados.js';

/** Pantalla del cliente: sus pedidos con el estado actualizado y sus proyectos guardados (RF-05, RF-18, RF-19). */
export default function MisPedidos() {
  const [pedidos, setPedidos] = useState(null);
  const [proyectos, setProyectos] = useState([]);
  const [error, setError] = useState('');
  const [estado, setEstado] = useState('TODOS');
  const [taller, setTaller] = useState('TODOS');
  const [orden, setOrden] = useState('RECIENTES');

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

  const GRUPOS = {
    TODOS: ['Todos los estados', null],
    PRESUPUESTO: ['Esperando presupuesto', ['PENDIENTE']],
    RESPONDER: ['Para responder', ['PRESUPUESTADO']],
    CURSO: ['En curso', ['ACEPTADO', 'MEDIDAS_VERIFICADAS', 'EN_FABRICACION']],
    ENTREGADO: ['Entregados', ['ENTREGADO']],
    CERRADO: ['Cerrados', ['RECHAZADO', 'VENCIDO', 'CANCELADO']],
  };
  const talleres = useMemo(() => [...new Set((pedidos || []).map((p) => p.carpinteria?.nombre).filter(Boolean))].sort(), [pedidos]);
  const visibles = useMemo(() => {
    const lista = (pedidos || []).filter((p) => (!GRUPOS[estado][1] || GRUPOS[estado][1].includes(p.estado))
      && (taller === 'TODOS' || p.carpinteria?.nombre === taller));
    const total = (p) => p.presupuesto?.total ?? null;
    if (orden === 'MENOR') return [...lista].sort((a, b) => (total(a) ?? Infinity) - (total(b) ?? Infinity));
    if (orden === 'MAYOR') return [...lista].sort((a, b) => (total(b) ?? -1) - (total(a) ?? -1));
    return [...lista].sort((a, b) => String(b.creado || '').localeCompare(String(a.creado || '')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidos, estado, taller, orden]);
  const filtrando = estado !== 'TODOS' || taller !== 'TODOS';

  return (
    <main className="pila">
      <div className="fila entre">
        <h2>Mis pedidos</h2>
        <Link to="/disenar" className="boton claro"><Icono nombre="cubo" />Nuevo mueble</Link>
      </div>
      {error && <p className="nota error">{error}</p>}
      {pedidos && pedidos.length === 0 && <p className="tenue">Todavía no pediste ningún presupuesto.</p>}

      {pedidos && pedidos.length > 0 && (
        <div className="filtros-pedidos">
          <label className="filtro">
            <Icono nombre="filtro" tam={16} />
            <select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Filtrar por estado">
              {Object.entries(GRUPOS).map(([id, [nombre]]) => <option key={id} value={id}>{nombre}</option>)}
            </select>
            <Icono nombre="abajo" tam={14} />
          </label>
          <label className="filtro">
            <Icono nombre="martillo" tam={16} />
            <select value={taller} onChange={(e) => setTaller(e.target.value)} aria-label="Filtrar por carpintería">
              <option value="TODOS">Todas las carpinterías</option>
              {talleres.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <Icono nombre="abajo" tam={14} />
          </label>
          <label className="filtro">
            <Icono nombre="billete" tam={16} />
            <select value={orden} onChange={(e) => setOrden(e.target.value)} aria-label="Ordenar">
              <option value="RECIENTES">Más recientes</option>
              <option value="MENOR">Menor precio</option>
              <option value="MAYOR">Mayor precio</option>
            </select>
            <Icono nombre="abajo" tam={14} />
          </label>
          <span className="tenue chico">{visibles.length} de {pedidos.length}</span>
          {filtrando && <button className="boton plano" onClick={() => { setEstado('TODOS'); setTaller('TODOS'); }}>Limpiar filtros</button>}
        </div>
      )}
      {pedidos && pedidos.length > 0 && visibles.length === 0 && <p className="tenue">No hay pedidos con esos filtros.</p>}

      {visibles.map((p) => (
        <article key={p.id} className="tarjeta pila">
          <div className="pedido-cabeza">
            <Miniatura piezas={p.calculo?.piezas} color={p.diseno.color} />
            <div className="pedido-titulo">
              <h3>{p.diseno.nombre}</h3>
              <p className="tenue">{p.carpinteria?.nombre} · {medidas(p.diseno)}</p>
              {p.presupuesto && <p className="pedido-precio">{pesos(p.presupuesto.total)}</p>}
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
              <button className="boton" onClick={() => pagar(p.id)}><Icono nombre="carrito" />Aceptar y pagar seña</button>
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
