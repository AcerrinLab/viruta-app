import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, escucharEventos } from '../api.js';
import Visor3D from '../componentes/Visor3D.jsx';
import { Chip, Materiales, Selector } from '../componentes/Comunes.jsx';
import { ACCION_CARPINTERIA, siguienteDeCarpinteria } from '../lib/estados.js';
import { COLORES, MATERIALES } from '../lib/diseno.js';
import { medidas, mmACm, pesos } from '../lib/unidades.js';
import { Icono } from '../componentes/Iconos.jsx';
import { usarMovil } from '../lib/tema.js';
import Miniatura from '../componentes/Miniatura.jsx';

const PESTANAS = [
  ['Nuevos', ['PENDIENTE']],
  ['Presupuestados', ['PRESUPUESTADO']],
  ['En curso', ['ACEPTADO', 'MEDIDAS_VERIFICADAS', 'EN_FABRICACION']],
  ['Entregados', ['ENTREGADO']],
];

function Perfil({ perfil, alGuardar }) {
  const [datos, setDatos] = useState({ ...perfil, zona: perfil.zona || '' });
  const [zonas, setZonas] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => { api('/api/carpinteria/zonas').then(setZonas).catch(() => {}); }, []);

  const alternar = (material) => {
    const tiene = datos.materiales.includes(material);
    setDatos({ ...datos, materiales: tiene ? datos.materiales.filter((m) => m !== material) : [...datos.materiales, material] });
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      alGuardar(await api('/api/carpinteria/perfil', { metodo: 'PUT', cuerpo: { ...datos, zona: datos.zona || null } }));
    } catch (problema) {
      setError(problema.message);
    }
  };

  return (
    <form className="tarjeta pila" style={{ maxWidth: 520 }} onSubmit={guardar}>
      <div>
        <h2>Tu carpintería</h2>
        <p className="tenue">Con zona y WhatsApp aparecés en el mapa.</p>
      </div>
      <label>Nombre<input type="text" required maxLength={80} value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} /></label>
      <label>
        Zona
        <select value={datos.zona} onChange={(e) => setDatos({ ...datos, zona: e.target.value })}>
          <option value="">Elegir</option>
          {zonas.map((z) => <option key={z.id} value={z.id}>{z.etiqueta}</option>)}
        </select>
      </label>
      <label>WhatsApp<input type="tel" value={datos.whatsapp} onChange={(e) => setDatos({ ...datos, whatsapp: e.target.value })} placeholder="388 ..." /></label>
      <label>Dirección del taller<input type="text" value={datos.direccion} onChange={(e) => setDatos({ ...datos, direccion: e.target.value })} /></label>
      <p className="tenue chico">La dirección y el WhatsApp se muestran al cliente recién cuando paga la seña.</p>
      <div className="opciones">
        {Object.entries(MATERIALES).map(([id, nombre]) => (
          <button type="button" key={id} className={'opcion ' + (datos.materiales.includes(id) ? 'elegida' : '')} onClick={() => alternar(id)}>{nombre}</button>
        ))}
      </div>
      {error && <p className="nota error">{error}</p>}
      <button className="boton">Guardar</button>
    </form>
  );
}

function Detalle({ id, alCambiar, alCerrar }) {
  const [p, setP] = useState(null);
  const [error, setError] = useState('');
  const [materiales, setMateriales] = useState('');
  const [mano, setMano] = useState('');
  const [plazo, setPlazo] = useState('');
  const [clienteCompra, setClienteCompra] = useState(false);

  useEffect(() => {
    setP(null);
    api('/api/carpinteria/pedidos/' + id).then(setP).catch((problema) => setError(problema.message));
  }, [id]);

  const accion = async (ruta, cuerpo) => {
    try {
      setP(await api(`/api/carpinteria/pedidos/${id}/${ruta}`, { metodo: 'POST', cuerpo }));
      setError('');
      alCambiar();
    } catch (problema) {
      setError(problema.message);
    }
  };

  if (!p) return <div className="tarjeta">{error ? <p className="nota error">{error}</p> : <p className="tenue">Cargando…</p>}</div>;

  const d = p.diseno;
  const siguiente = siguienteDeCarpinteria(p.estado);
  const total = (clienteCompra ? 0 : Number(materiales) || 0) + (Number(mano) || 0);

  return (
    <div className="pila">
      <div className="tarjeta sin-relleno">
        <Visor3D piezas={p.calculo.piezas} color={d.color} alto={260} />
        <div className="pila" style={{ padding: 20 }}>
          <div className="fila entre">
            <div>
              <h2>{d.nombre}</h2>
              <p className="tenue">{p.cliente.nombre} · {p.cliente.telefono}</p>
            </div>
            <Chip estado={p.estado} />
          </div>
          <div className="tres">
            <div className="dato"><span className="tenue">Mueble</span><strong>{medidas(d)}</strong></div>
            <div className="dato">
              <span className="tenue">Espacio</span>
              <strong>{d.espacioAncho ? `${mmACm(d.espacioAncho)} × ${mmACm(d.espacioAlto)} × ${mmACm(Math.min(d.espacioProfAdelante, d.espacioProfAtras))} cm` : 'Sin cargar'}</strong>
            </div>
            <div className="dato"><span className="tenue">Material</span><strong>{MATERIALES[d.material]} · {COLORES[d.color]?.etiqueta}</strong></div>
          </div>
          {p.calculo.avisos.map((a, i) => <p key={i} className="nota aviso">{a.mensaje}</p>)}
        </div>
      </div>

      {error && <p className="nota error">{error}</p>}

      {p.estado === 'PENDIENTE' && (
        <form className="tarjeta pila" onSubmit={(e) => { e.preventDefault(); accion('presupuesto', { materiales: Number(materiales) || 0, manoDeObra: Number(mano) || 0, clienteCompraMaterial: clienteCompra, plazoDias: plazo ? Number(plazo) : null }); }}>
          <h3>Tu presupuesto</h3>
          <div className="tres">
            <label>Materiales ($)<input type="number" min="0" required value={materiales} onChange={(e) => setMateriales(e.target.value)} /></label>
            <label>Mano de obra ($)<input type="number" min="1" required value={mano} onChange={(e) => setMano(e.target.value)} /></label>
            <label>Plazo (días)<input type="number" min="1" max="365" value={plazo} onChange={(e) => setPlazo(e.target.value)} /></label>
          </div>
          <label className="marcar">
            <input type="checkbox" checked={clienteCompra} onChange={(e) => setClienteCompra(e.target.checked)} />
            <span>El cliente compra el material</span>
          </label>
          <div className="fila entre">
            <div className="dato"><span className="tenue">Total a cobrar</span><span className="numero">{pesos(total)}</span></div>
            <button className="boton"><Icono nombre="enviar" />Enviar presupuesto</button>
          </div>
        </form>
      )}

      {p.presupuesto && (
        <div className="tarjeta tres">
          <div className="dato"><span className="tenue">Total</span><strong>{pesos(p.presupuesto.total)}</strong></div>
          <div className="dato"><span className="tenue">Seña</span><strong>{pesos(p.presupuesto.sena)}</strong></div>
          <div className="dato"><span className="tenue">Material</span><strong>{p.presupuesto.clienteCompraMaterial ? 'Lo compra el cliente' : pesos(p.presupuesto.materiales)}</strong></div>
        </div>
      )}

      {siguiente && <button className="boton" onClick={() => accion('estado', { estado: siguiente })}>{ACCION_CARPINTERIA[siguiente]}</button>}

      <Materiales lista={p.calculo.materiales} />
      <button className="boton plano" onClick={alCerrar}><Icono nombre="volver" />Volver a la bandeja</button>
    </div>
  );
}

/** Panel de la carpinteria: bandeja, detalle, avisos en tiempo real y resumen (RF-27 a RF-30). */
export default function Panel() {
  const [parametros, setParametros] = useSearchParams();
  const abierto = parametros.get('pedido');
  const [perfil, setPerfil] = useState(null);
  const [editandoPerfil, setEditandoPerfil] = useState(parametros.has('editar'));
  const [pedidos, setPedidos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [pestana, setPestana] = useState(0);
  const movil = usarMovil();
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    Promise.all([api('/api/carpinteria/pedidos'), api('/api/carpinteria/resumen')])
      .then(([a, b]) => { setPedidos(a); setResumen(b); })
      .catch((problema) => setError(problema.message));
  }, []);

  useEffect(() => {
    api('/api/carpinteria/perfil').then(setPerfil).catch((problema) => setError(problema.message));
  }, []);

  useEffect(() => {
    if (!perfil?.visible) return;
    cargar();
    return escucharEventos(cargar);
  }, [perfil, cargar]);

  if (!perfil) return <main>{error && <p className="nota error">{error}</p>}</main>;
  if (!perfil.visible || editandoPerfil) {
    return <main><Perfil perfil={perfil} alGuardar={(p) => { setPerfil(p); setEditandoPerfil(false); }} /></main>;
  }
  if (abierto) {
    return <main><Detalle id={abierto} alCambiar={cargar} alCerrar={() => setParametros({})} /></main>;
  }

  const nuevos = pedidos.filter((p) => p.estado === 'PENDIENTE').length;
  const visibles = pedidos.filter((p) => PESTANAS[pestana][1].includes(p.estado));

  return (
    <main className="pila">
      <div className="fila entre">
        <h2>{perfil.nombre}</h2>
        <button className="boton plano" onClick={() => setEditandoPerfil(true)}>Editar perfil</button>
      </div>
      {error && <p className="nota error">{error}</p>}

      <div className="tres">
        <div className="tarjeta dato"><span className="tenue">Pedidos nuevos</span><span className="numero">{nuevos}</span></div>
        <div className="tarjeta dato"><span className="tenue">Señas cobradas</span><span className="numero">{pesos(resumen?.senasCobradas)}</span><span className="tenue">{resumen?.trabajos || 0} trabajos</span></div>
        <div className="tarjeta dato"><span className="tenue">Comisión Viruta</span><span className="numero">{pesos(resumen?.comision)}</span></div>
      </div>

      {movil ? (
        <label className="filtro">
          <Icono nombre="filtro" tam={18} />
          <span className="filtro-etiqueta">Mostrar</span>
          <select value={pestana} onChange={(e) => setPestana(Number(e.target.value))} aria-label="Filtrar pedidos">
            {PESTANAS.map(([nombre, estados], i) => {
              const cantidad = pedidos.filter((p) => estados.includes(p.estado)).length;
              return <option key={nombre} value={i}>{nombre}{cantidad > 0 ? ` (${cantidad})` : ''}</option>;
            })}
          </select>
          <Icono nombre="abajo" tam={16} />
        </label>
      ) : (
      <div className="pestanas">
        <Selector
          etiqueta="Pedidos"
          opciones={PESTANAS.map(([nombre, estados], i) => {
            const cantidad = pedidos.filter((p) => estados.includes(p.estado)).length;
            return [i, nombre + (cantidad > 0 ? ` (${cantidad})` : '')];
          })}
          valor={pestana}
          alCambiar={setPestana}
        />
      </div>
      )}

      {visibles.length === 0 && <p className="tenue">No hay pedidos acá.</p>}
      {visibles.map((p) => (
        <button key={p.id} className="tarjeta elegible fila entre pedido-bandeja" onClick={() => setParametros({ pedido: p.id })}>
          <Miniatura piezas={p.calculo?.piezas} color={p.diseno.color} tam={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3>{!p.leido && <span className="punto" aria-label="Sin leer" />}{p.diseno.nombre}</h3>
            <p className="tenue">{p.cliente.nombre} · {medidas(p.diseno)} · {MATERIALES[p.diseno.material]}</p>
          </div>
          <Chip estado={p.estado} />
        </button>
      ))}
    </main>
  );
}
