import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { createPortal } from 'react-dom';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { cajas, envolvente, tono } from '../lib/modelo.js';
import { COLORES } from '../lib/diseno.js';
import { cajaMadera, texturaMadera } from '../lib/madera.js';
import { Icono } from './Iconos.jsx';

/** Controles para girar y acercar. La camara no cambia ninguna medida del mueble. */
function Camara({ tam }) {
  const { camera, gl, size } = useThree();
  const mayor = Math.max(tam[0], tam[1], tam[2], 0.3);
  // En un visor angosto (celular parado, pantalla completa vertical) la camara se aleja lo necesario
  // para que entre el ancho del mueble. Con visores anchos queda igual que siempre.
  const aspecto = size.width / Math.max(size.height, 1);
  const horizontal = 2 * Math.atan(Math.tan(((camera.fov || 35) * Math.PI) / 360) * aspecto);
  const lejos = Math.max(1, (mayor * 0.8) / Math.tan(horizontal / 2) / (mayor * 2.26));

  useEffect(() => {
    const controles = new OrbitControls(camera, gl.domElement);
    controles.enablePan = false;
    controles.target.set(0, tam[1] / 2, 0);
    controles.minDistance = mayor * 0.8;
    controles.maxDistance = mayor * 5 * lejos;
    controles.maxPolarAngle = Math.PI / 2;
    camera.position.set(mayor * 1.1 * lejos, tam[1] / 2 + mayor * 0.55 * lejos, mayor * 1.9 * lejos);
    controles.update();
    return () => controles.dispose();
  }, [camera, gl, mayor, tam[1], lejos]);
  return null;
}

/**
 * Piso del taller: cuadricula de 10 cm (linea marcada cada 50 cm), como una plancha de corte,
 * que se desvanece hacia los bordes. Ayuda a leer la escala sin ensuciar la vista.
 */
function texturaPiso(lado) {
  const px = 1024;
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = px;
  const ctx = lienzo.getContext('2d');
  const paso = (px * 0.1) / lado;
  const n = Math.ceil(px / 2 / paso);
  for (let k = -n; k <= n; k++) {
    const fuerte = k % 5 === 0;
    ctx.strokeStyle = fuerte ? 'rgba(150, 118, 88, 0.38)' : 'rgba(150, 118, 88, 0.17)';
    ctx.lineWidth = fuerte ? 2 : 1;
    const c = Math.round(px / 2 + k * paso) + 0.5;
    ctx.beginPath(); ctx.moveTo(c, 0); ctx.lineTo(c, px); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, c); ctx.lineTo(px, c); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'destination-in';
  const fade = ctx.createRadialGradient(px / 2, px / 2, px * 0.08, px / 2, px / 2, px * 0.5);
  fade.addColorStop(0, 'rgba(0,0,0,1)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, px, px);
  const t = new THREE.CanvasTexture(lienzo);
  t.anisotropy = 8;
  return t;
}

/** Sombra de contacto suave debajo del mueble. */
let sombraCache = null;
function texturaSombra() {
  if (sombraCache) return sombraCache;
  const px = 256;
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = px;
  const ctx = lienzo.getContext('2d');
  const g = ctx.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
  g.addColorStop(0, 'rgba(60, 42, 28, 0.34)');
  g.addColorStop(0.55, 'rgba(60, 42, 28, 0.14)');
  g.addColorStop(1, 'rgba(60, 42, 28, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, px, px);
  sombraCache = new THREE.CanvasTexture(lienzo);
  return sombraCache;
}

const cm = (m) => Math.round(m * 100);

/**
 * Visor 3D del mueble (RF-01, RF-28). Dibuja exactamente las piezas que devuelve el backend.
 * Con `ampliable`, muestra botones para agrandar el visor (avisa con `alAmpliar`) y para verlo en
 * pantalla completa. Si el navegador no deja usar la pantalla completa real (iPhone, vistas embebidas),
 * el visor cubre la ventana igual, montado sobre el body.
 */
export default function Visor3D({ piezas, color = 'NATURAL', alto = 320, ampliable = false, alAmpliar }) {
  const escenario = useRef(null);
  const [amplio, setAmplio] = useState(false);
  // null, 'nativo' (API de pantalla completa) o 'ventana' (cubre la ventana con CSS).
  const [modo, setModo] = useState(null);
  const completa = modo !== null;

  useEffect(() => {
    if (!ampliable) return undefined;
    const cambio = () => setModo((m) => (document.fullscreenElement ? 'nativo' : m === 'nativo' ? null : m));
    document.addEventListener('fullscreenchange', cambio);
    return () => document.removeEventListener('fullscreenchange', cambio);
  }, [ampliable]);

  useEffect(() => {
    if (modo !== 'ventana') return undefined;
    const tecla = (e) => { if (e.key === 'Escape') setModo(null); };
    const desborde = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('keydown', tecla); document.body.style.overflow = desborde; };
  }, [modo]);

  const alternarAmplio = () => {
    const nuevo = !amplio;
    setAmplio(nuevo);
    alAmpliar?.(nuevo);
  };
  const alternarCompleta = () => {
    if (modo === 'nativo') { document.exitFullscreen?.(); return; }
    if (modo === 'ventana') { setModo(null); return; }
    const nodo = escenario.current;
    if (document.fullscreenEnabled && nodo?.requestFullscreen) {
      nodo.requestFullscreen().catch(() => setModo('ventana'));
    } else {
      setModo('ventana');
    }
  };
  const altura = completa ? '100%' : amplio ? 'min(78vh, 860px)' : alto;

  const lista = useMemo(() => cajas(piezas), [piezas]);
  const tam = useMemo(() => envolvente(piezas), [piezas]);
  const hex = (COLORES[color] || COLORES.NATURAL).hex;
  const textura = useMemo(() => texturaMadera(hex), [hex]);
  const geometrias = useMemo(() => lista.map((c, i) => cajaMadera(c.tam, i)), [lista]);
  useEffect(() => () => geometrias.forEach((g) => g.dispose()), [geometrias]);
  const ladoPiso = Math.max(2.4, Math.max(tam[0], tam[2]) * 3.2);
  const piso = useMemo(() => texturaPiso(ladoPiso), [ladoPiso]);
  useEffect(() => () => piso.dispose(), [piso]);
  const sombra = texturaSombra();

  const contenido = (
    <div className={'escenario' + (completa ? ' completa' : '') + (modo === 'ventana' ? ' ventana' : '')} ref={escenario}
      role={modo === 'ventana' ? 'dialog' : undefined} aria-modal={modo === 'ventana' ? true : undefined}
      aria-label={modo === 'ventana' ? 'Vista 3D en pantalla completa' : undefined}>
      {ampliable && (
        <div className="visor-acciones">
          {!completa && (
            <button type="button" className="visor-boton" onClick={alternarAmplio} aria-pressed={amplio}
              title={amplio ? 'Achicar el visor' : 'Agrandar el visor'}>
              <Icono nombre={amplio ? 'achicar' : 'ampliar'} tam={16} /><span>{amplio ? 'Achicar' : 'Agrandar'}</span>
            </button>
          )}
          <button type="button" className="visor-boton" onClick={alternarCompleta} aria-pressed={completa}
            title={completa ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}>
            <Icono nombre={completa ? 'cerrar' : 'pantalla'} tam={16} /><span>{completa ? 'Salir' : 'Pantalla completa'}</span>
          </button>
        </div>
      )}
      {tam[0] > 0 && (
        <div className="cotas" aria-label="Medidas generales">
          <span className="cota">Ancho <b>{cm(tam[0])}</b></span>
          <span className="cota">Alto <b>{cm(tam[1])}</b></span>
          <span className="cota">Fondo <b>{cm(tam[2])}</b> cm</span>
        </div>
      )}
      <span className="pista" aria-hidden="true"><Icono nombre="girar" tam={14} />Arrastrá para girar</span>
    <div className="visor" style={{ height: altura }} aria-label="Vista 3D del mueble. Arrastrá para girarlo.">
      <Canvas camera={{ fov: 35, near: 0.05, far: 50 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
        <hemisphereLight args={['#fffaf0', '#cdbfa8', 1.1]} />
        <directionalLight position={[3, 5, 4]} intensity={1.9} color="#fff4e2" />
        <directionalLight position={[-4, 2, -2]} intensity={0.55} color="#e8eef0" />
        {lista.map((c, i) => (
          <mesh key={i + '-' + c.rol} position={c.centro} geometry={geometrias[i]} renderOrder={c.rol === 'VIDRIO' ? 2 : 0}>
            {/* La key fuerza un material nuevo al cambiar de vidrio a madera: si se reutiliza el mismo,
                three.js no recompila el shader y las piezas quedan con el material equivocado. */}
            {c.rol === 'VIDRIO'
              ? <meshStandardMaterial key="vidrio" color="#DCEBEA" transparent opacity={0.28} roughness={0.08} metalness={0.1} depthWrite={false} />
              : <meshStandardMaterial key="madera" map={textura} color={tono('#ffffff', c.rol)} roughness={0.62} metalness={0} />}
          </mesh>
        ))}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.003, 0]}>
          <planeGeometry args={[ladoPiso, ladoPiso]} />
          <meshBasicMaterial map={piso} transparent depthWrite={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
          <planeGeometry args={[Math.max(tam[0], 0.3) * 1.6, Math.max(tam[2], 0.3) * 1.9]} />
          <meshBasicMaterial map={sombra} transparent depthWrite={false} />
        </mesh>
        <Camara tam={tam} />
      </Canvas>
    </div>
    </div>
  );

  if (modo === 'ventana') {
    // Lugar reservado para que la pagina no salte mientras el visor cubre la ventana.
    return <><div className="visor-lugar" style={{ height: amplio ? 'min(78vh, 860px)' : alto }} />{createPortal(contenido, document.body)}</>;
  }
  return contenido;
}
