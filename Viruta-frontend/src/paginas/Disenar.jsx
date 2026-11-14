import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, guardarBorrador, leerBorrador } from '../api.js';
import { useSesion } from '../App.jsx';
import Visor3D from '../componentes/Visor3D.jsx';
import VistaAR from '../componentes/VistaAR.jsx';
import { CampoCm, GuiaMedir, Materiales, Medida, Pasos, Selector } from '../componentes/Comunes.jsx';
import { COLECCIONES, COLORES, MATERIALES, PLANTILLAS, aSolicitud, disenoInicial, tieneEspacio } from '../lib/diseno.js';
import { Icono } from '../componentes/Iconos.jsx';

const DIBUJOS = {
  ESTANTE: 'M14 6v36M34 6v36M14 8h20M14 24h20M14 40h20',
  MESA: 'M6 16h36M10 16v24M38 16v24',
  BAJO_MESADA: 'M8 12h32v28H8zM24 12v28M20 26h1M27 26h1',
  RELICARIO: 'M12 4h24l2 3v35H10V7l2-3ZM10 42h28M14 9h9v29h-9zM25 9h9v29h-9zM14 19h9M14 28h9M25 19h9M25 28h9M22 23h.5M26 23h.5',
};

/** F1 y F2: elegir plantilla, medir y ajustar con 3D y AR, y ver que comprar. */
export default function Disenar() {
  const [parametros] = useSearchParams();
  const editando = parametros.get('proyecto');
  const borrador = editando ? null : leerBorrador();
  const [diseno, setDiseno] = useState(borrador?.diseno || null);
  const [paso, setPaso] = useState(borrador?.diseno ? borrador.paso || 2 : 1);
  const [proyectoId, setProyectoId] = useState(editando ? Number(editando) : borrador?.proyectoId || null);
  const [calculo, setCalculo] = useState(null);
  const [error, setError] = useState('');
  const [guia, setGuia] = useState(false);
  const [ar, setAr] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const revision = useRef(0);
  const { sesion } = useSesion();
  const navegar = useNavigate();

  // Abrir un proyecto guardado (RF-05).
  useEffect(() => {
    if (!editando) return;
    api('/api/proyectos/' + editando)
      .then((p) => { setDiseno(p.diseno); setPaso(2); })
      .catch((problema) => setError(problema.message));
  }, [editando]);

  // Cada cambio recalcula piezas, avisos y materiales. Si llega un calculo viejo, se descarta.
  useEffect(() => {
    if (!diseno) return;
    guardarBorrador({ diseno, paso, proyectoId });
    const mia = ++revision.current;
    const espera = setTimeout(() => {
      api('/api/disenos/calcular', { metodo: 'POST', cuerpo: aSolicitud(diseno) })
        .then((r) => { if (mia === revision.current) { setCalculo(r); setError(''); } })
        .catch((problema) => { if (mia === revision.current) setError(problema.message); });
    }, 150);
    return () => clearTimeout(espera);
  }, [diseno, paso, proyectoId]);

  const cambiar = (campos) => { setDiseno((d) => ({ ...d, ...campos })); setGuardado(false); };

  const guardar = async () => {
    if (!sesion) {
      navegar('/ingresar?volver=/disenar');
      return null;
    }
    try {
      const cuerpo = aSolicitud(diseno);
      const p = proyectoId
        ? await api('/api/proyectos/' + proyectoId, { metodo: 'PUT', cuerpo })
        : await api('/api/proyectos', { metodo: 'POST', cuerpo });
      setProyectoId(p.id);
      setGuardado(true);
      return p.id;
    } catch (problema) {
      setError(problema.message);
      return null;
    }
  };

  const pedir = async () => {
    const id = await guardar();
    if (id) {
      guardarBorrador(null);
      navegar('/carpinterias?proyecto=' + id);
    }
  };

  if (paso === 1 || !diseno) {
    return (
      <main className="pila">
        <Pasos hechos={1} total={3} />
        <h2>¿Qué querés hacer?</h2>
        {error && <p className="nota error">{error}</p>}
        {COLECCIONES.map(([coleccion, titulo, bajada]) => {
          const lista = Object.entries(PLANTILLAS).filter(([, p]) => (p.coleccion || 'CLASICOS') === coleccion);
          if (lista.length === 0) return null;
          const antiguos = coleccion === 'ANTIGUOS';
          return (
            <section key={coleccion} className={'coleccion' + (antiguos ? ' antiguos' : '')}>
              <div className="coleccion-cabeza">
                <h3>{titulo}</h3>
                {antiguos && <span className="insignia-nueva">Nuevo</span>}
                <span className="tenue chico">{bajada}</span>
              </div>
              <div className="tres">
                {lista.map(([id, p]) => (
                  <button key={id} className={'tarjeta elegible pila' + (antiguos ? ' pieza-antigua' : '')}
                    onClick={() => { setDiseno(disenoInicial(id)); setProyectoId(null); setPaso(2); }}>
                    <svg viewBox="0 0 48 48" width="72" height="72" fill="none" stroke="currentColor" strokeWidth={antiguos ? 2 : 2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={DIBUJOS[id]} />
                    </svg>
                    <div>
                      <h3>{p.etiqueta}</h3>
                      {p.descripcion && <p className="tenue chico">{p.descripcion}</p>}
                    </div>
                    {antiguos && <span className="pieza-sello">Colección Antiguos</span>}
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    );
  }

  const plantilla = PLANTILLAS[diseno.plantilla];
  const avisos = calculo?.avisos || [];
  const noEntra = avisos.some((a) => a.eje !== 'espacio');

  return (
    <main className="pila">
      <Pasos hechos={paso} total={3} />
      <div className="fila entre">
        <h2>{paso === 2 ? 'Medí y ajustá' : 'Qué comprar'}</h2>
        <button className="boton plano" onClick={() => (paso === 3 ? setPaso(2) : setPaso(1))}><Icono nombre="volver" />Volver</button>
      </div>
      {error && <p className="nota error">{error}</p>}

      {paso === 2 && (
        <div className="dos">
          <div className="pila pegado">
            <div className="tarjeta sin-relleno">
              <Visor3D piezas={calculo?.piezas} color={diseno.color} />
            </div>
            {avisos.map((a, i) => <p key={i} className="nota aviso">{a.mensaje}</p>)}
            {tieneEspacio(diseno) && !noEntra && calculo && <p className="nota">Entra en tu espacio.</p>}
            <button className="boton claro" disabled={!calculo} onClick={() => setAr(true)}><Icono nombre="visor" />Verlo en mi espacio</button>
          </div>

          <div className="pila">
            <div className="tarjeta pila">
              <div className="fila entre">
                <h3>Tu espacio</h3>
                <button className="boton plano" onClick={() => setGuia(true)}><Icono nombre="regla" />Cómo medir</button>
              </div>
              <div className="tres" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <CampoCm etiqueta="Ancho" valor={diseno.espacioAncho} alCambiar={(v) => cambiar({ espacioAncho: v })} />
                <CampoCm etiqueta="Alto" valor={diseno.espacioAlto} alCambiar={(v) => cambiar({ espacioAlto: v })} />
                <CampoCm etiqueta="Fondo izquierda" valor={diseno.espacioProfAdelante} alCambiar={(v) => cambiar({ espacioProfAdelante: v })} />
                <CampoCm etiqueta="Fondo derecha" valor={diseno.espacioProfAtras} alCambiar={(v) => cambiar({ espacioProfAtras: v })} />
              </div>
            </div>

            <div className="tarjeta pila">
              <h3>Tu {plantilla.etiqueta.toLowerCase()}</h3>
              <Medida etiqueta="Ancho" valor={diseno.ancho} rango={plantilla.ancho} alCambiar={(v) => cambiar({ ancho: v })} />
              <Medida etiqueta="Alto" valor={diseno.alto} rango={plantilla.alto} alCambiar={(v) => cambiar({ alto: v })} />
              <Medida etiqueta="Profundidad" valor={diseno.profundidad} rango={plantilla.profundidad} alCambiar={(v) => cambiar({ profundidad: v })} />
              {plantilla.estantes[1] > 0 && (
                <div className="fila entre">
                  <span>Estantes</span>
                  <div className="fila">
                    <button className="opcion" aria-label="Quitar estante" disabled={diseno.estantes <= plantilla.estantes[0]} onClick={() => cambiar({ estantes: diseno.estantes - 1 })}>−</button>
                    <strong>{diseno.estantes}</strong>
                    <button className="opcion" aria-label="Agregar estante" disabled={diseno.estantes >= plantilla.estantes[1]} onClick={() => cambiar({ estantes: diseno.estantes + 1 })}>+</button>
                  </div>
                </div>
              )}
            </div>

            <div className="tarjeta pila">
              <Selector etiqueta="Material" ancho opciones={Object.entries(MATERIALES)} valor={diseno.material} alCambiar={(id) => cambiar({ material: id })} />
              <div className="opciones">
                {Object.entries(COLORES).map(([id, c]) => (
                  <button key={id} className={'color ' + (diseno.color === id ? 'elegida' : '')} style={{ background: c.hex }}
                    aria-label={c.etiqueta} title={c.etiqueta} onClick={() => cambiar({ color: id })} />
                ))}
              </div>
            </div>

            <button className="boton" disabled={!calculo || !!error} onClick={() => setPaso(3)}><Icono nombre="lista" />Ver qué comprar</button>
          </div>
        </div>
      )}

      {paso === 3 && (
        <div className="pila">
          <Materiales lista={calculo?.materiales} />
          {guardado && <p className="nota">Guardado en tus proyectos.</p>}
          <div className="fila">
            <button className="boton" disabled={!calculo} onClick={pedir}><Icono nombre="enviar" />Pedir presupuesto</button>
            <button className="boton claro" disabled={!calculo} onClick={guardar}><Icono nombre="guardar" />Guardar</button>
          </div>
        </div>
      )}

      {guia && <GuiaMedir alCerrar={() => setGuia(false)} />}
      {ar && calculo && <VistaAR piezas={calculo.piezas} color={diseno.color} alCerrar={() => setAr(false)} />}
    </main>
  );
}
