import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ESTADOS, RECORRIDO, avance } from '../lib/estados.js';
import { cmAMm, limitar, mmACm } from '../lib/unidades.js';

/**
 * Tema por rol: verde para clientes, nogal para talleres. Lo aplica sobre <body> para que
 * el fondo, los botones y el vidrio cambien juntos.
 */
export function aplicarTema(rol) {
  document.body.dataset.rol = rol === 'CARPINTERIA' ? 'taller' : 'cliente';
}

/** Selector segmentado de vidrio, estilo iOS: una "gota" se desliza hasta la opcion elegida. */
export function Selector({ opciones, valor, alCambiar, etiqueta, ancho = false }) {
  const caja = useRef(null);
  const [gota, setGota] = useState(null);
  const [moviendo, setMoviendo] = useState(false);

  useLayoutEffect(() => {
    const medir = () => {
      const elegido = caja.current?.querySelector('[aria-checked="true"]');
      if (elegido) setGota({ x: elegido.offsetLeft, w: elegido.offsetWidth });
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(caja.current);
    return () => observador.disconnect();
  }, [valor, opciones.length]);

  useEffect(() => {
    setMoviendo(true);
    const t = setTimeout(() => setMoviendo(false), 260);
    return () => clearTimeout(t);
  }, [valor]);

  return (
    <div ref={caja} role="radiogroup" aria-label={etiqueta} className={'selector vidrio' + (ancho ? ' ancho' : '') + (moviendo ? ' moviendo' : '')}>
      {gota && <span className="gota" style={{ width: gota.w, transform: `translateX(${gota.x}px)` }} aria-hidden="true" />}
      {opciones.map(([id, texto]) => (
        <button key={id} type="button" role="radio" aria-checked={valor === id} onClick={() => alCambiar(id)}>
          {texto}
        </button>
      ))}
    </div>
  );
}

/** Interruptor tipo iOS. */
export function Interruptor({ activo, alCambiar, etiqueta }) {
  return (
    <button type="button" role="switch" aria-checked={activo} aria-label={etiqueta}
      className={'interruptor' + (activo ? ' activo' : '')} onClick={() => alCambiar(!activo)}>
      <span />
    </button>
  );
}

export function Chip({ estado }) {
  const e = ESTADOS[estado] || { etiqueta: estado, tono: 'neutro' };
  return <span className={'chip ' + e.tono}>{e.etiqueta}</span>;
}

export function Pasos({ hechos, total }) {
  return (
    <div className="pasos" aria-label={`Paso ${hechos} de ${total}`}>
      {Array.from({ length: total }, (_, i) => <span key={i} className={i < hechos ? 'hecho' : ''} />)}
    </div>
  );
}

export function PasosPedido({ estado }) {
  return <Pasos hechos={avance(estado)} total={RECORRIDO.length} />;
}

/** Una medida del mueble: deslizador mas campo en centimetros. Solo acepta valores dentro del rango. */
export function Medida({ etiqueta, valor, rango, alCambiar }) {
  const [texto, setTexto] = useState(mmACm(valor));
  useEffect(() => setTexto(mmACm(valor)), [valor]);

  const confirmar = () => {
    const mm = cmAMm(texto);
    if (mm === null) return setTexto(mmACm(valor));
    const dentro = limitar(mm, rango[0], rango[1]);
    setTexto(mmACm(dentro));
    if (dentro !== valor) alCambiar(dentro);
  };

  return (
    <div className="medida">
      <div className="cabeza">
        <span>{etiqueta}</span>
        <span className="valor">
          <input
            type="text"
            inputMode="decimal"
            aria-label={etiqueta + ' en centímetros'}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={confirmar}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
          />
          cm
        </span>
      </div>
      <input
        type="range"
        aria-label={etiqueta}
        min={rango[0]}
        max={rango[1]}
        step={10}
        value={valor}
        onChange={(e) => alCambiar(Number(e.target.value))}
      />
    </div>
  );
}

/** Campo de una medida del espacio, en centimetros. Vacio significa "todavia no medi". */
export function CampoCm({ etiqueta, valor, alCambiar }) {
  const [texto, setTexto] = useState(mmACm(valor));
  useEffect(() => {
    if (cmAMm(texto) !== valor) setTexto(mmACm(valor));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);
  return (
    <label>
      {etiqueta}
      <input
        type="text"
        inputMode="decimal"
        placeholder="cm"
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          const mm = cmAMm(e.target.value);
          alCambiar(mm !== null && mm > 0 ? mm : null);
        }}
      />
    </label>
  );
}

/** Guia visual de como medir el espacio (RF-06). */
export function GuiaMedir({ alCerrar }) {
  return (
    <div className="velo" role="dialog" aria-modal="true" aria-label="Cómo medir">
      <div className="dialogo">
        <h2>Cómo medir</h2>
        <svg viewBox="0 0 320 210" role="img" aria-label="Esquema del espacio con ancho, alto y profundidad adelante y atrás">
          <polygon points="60,40 260,40 290,70 290,190 30,190 30,70" fill="var(--suave)" stroke="var(--borde-medio)" />
          <polygon points="60,40 260,40 260,150 60,150" fill="var(--tarjeta)" stroke="var(--borde-medio)" />
          <line x1="60" y1="150" x2="30" y2="190" stroke="var(--borde-medio)" />
          <line x1="260" y1="150" x2="290" y2="190" stroke="var(--borde-medio)" />
          <g stroke="var(--acento)" strokeWidth="2.5" strokeLinecap="round">
            <line x1="70" y1="140" x2="250" y2="140" />
            <line x1="76" y1="50" x2="76" y2="132" />
            <line x1="44" y1="186" x2="66" y2="156" />
            <line x1="276" y1="186" x2="254" y2="156" />
          </g>
          <g fontSize="12" fill="var(--acento)" fontWeight="600">
            <text x="160" y="133" textAnchor="middle">1 Ancho</text>
            <text x="84" y="95">2 Alto</text>
            <text x="70" y="180">3 Fondo izq.</text>
            <text x="250" y="180" textAnchor="end">4 Fondo der.</text>
          </g>
        </svg>
        <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6 }}>
          <li>Ancho: de pared a pared, a la altura del mueble.</li>
          <li>Alto: del piso hasta donde puede llegar.</li>
          <li>Fondo: medilo en los dos costados. Si no coincide, usamos el menor.</li>
        </ol>
        <p className="tenue chico">La carpintería verifica las medidas en tu casa antes de fabricar.</p>
        <button className="boton" onClick={alCerrar}>Entendido</button>
      </div>
    </div>
  );
}

/** Lista de materiales (F2). Todo es estimado (RNF-10). */
export function Materiales({ lista }) {
  if (!lista) return null;
  const fraccion = String(lista.placasExactas).replace('.', ',');
  return (
    <div className="pila">
      <div className="tres">
        <div className="tarjeta dato">
          <span className="tenue">Placas</span>
          <span className="numero">{lista.placas}</span>
          <span className="tenue">de {lista.placaLargo / 10} × {lista.placaAncho / 10} cm (usa {fraccion})</span>
        </div>
        <div className="tarjeta dato">
          <span className="tenue">Tornillos</span>
          <span className="numero">{lista.tornillos}</span>
          {lista.bisagras > 0 ? <span className="tenue">y {lista.bisagras} bisagras</span> : <span className="tenue">unidades</span>}
        </div>
        <div className="tarjeta dato">
          <span className="tenue">{lista.litros > 0 ? lista.terminacion : 'Terminación'}</span>
          <span className="numero">{lista.litros > 0 ? String(lista.litros).replace('.', ',') + ' l' : '—'}</span>
          <span className="tenue">{lista.litros > 0 ? 'dos manos' : 'no requiere'}</span>
        </div>
      </div>
      <div className="tarjeta">
        <table>
          <thead>
            <tr><th>Pieza</th><th className="num">Cant.</th><th className="num">Medidas (mm)</th></tr>
          </thead>
          <tbody>
            {lista.despiece.map((p, i) => (
              <tr key={i}>
                <td>{p.nombre}</td>
                <td className="num">{p.cantidad}</td>
                <td className="num">{p.largo} × {p.ancho} × {p.espesor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="tenue chico">Cantidades estimadas. No incluyen el desperdicio del corte.</p>
    </div>
  );
}
