import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { cajas, envolvente, tono } from '../lib/modelo.js';
import { COLORES } from '../lib/diseno.js';
import { cajaMadera, texturaMadera } from '../lib/madera.js';
import { Icono } from './Iconos.jsx';

/** Controles para girar y acercar. La camara no cambia ninguna medida del mueble. */
function Camara({ tam }) {
  const { camera, gl } = useThree();
  const mayor = Math.max(tam[0], tam[1], tam[2], 0.3);

  useEffect(() => {
    const controles = new OrbitControls(camera, gl.domElement);
    controles.enablePan = false;
    controles.target.set(0, tam[1] / 2, 0);
    controles.minDistance = mayor * 0.8;
    controles.maxDistance = mayor * 5;
    controles.maxPolarAngle = Math.PI / 2;
    camera.position.set(mayor * 1.1, tam[1] / 2 + mayor * 0.55, mayor * 1.9);
    controles.update();
    return () => controles.dispose();
  }, [camera, gl, mayor, tam[1]]);
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
    ctx.strokeStyle = fuerte ? 'rgba(110, 78, 55, 0.30)' : 'rgba(110, 78, 55, 0.13)';
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

/** Visor 3D del mueble (RF-01, RF-28). Dibuja exactamente las piezas que devuelve el backend. */
export default function Visor3D({ piezas, color = 'NATURAL', alto = 320 }) {
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

  return (
    <div className="escenario">
      {tam[0] > 0 && (
        <div className="cotas" aria-label="Medidas generales">
          <span className="cota">Ancho <b>{cm(tam[0])}</b></span>
          <span className="cota">Alto <b>{cm(tam[1])}</b></span>
          <span className="cota">Fondo <b>{cm(tam[2])}</b> cm</span>
        </div>
      )}
      <span className="pista" aria-hidden="true"><Icono nombre="girar" tam={14} />Arrastrá para girar</span>
    <div className="visor" style={{ height: alto }} aria-label="Vista 3D del mueble. Arrastrá para girarlo.">
      <Canvas camera={{ fov: 35, near: 0.05, far: 50 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
        <hemisphereLight args={['#fffaf0', '#cdbfa8', 1.1]} />
        <directionalLight position={[3, 5, 4]} intensity={1.9} color="#fff4e2" />
        <directionalLight position={[-4, 2, -2]} intensity={0.55} color="#e8eef0" />
        {lista.map((c, i) => (
          <mesh key={i} position={c.centro} geometry={geometrias[i]}>
            <meshStandardMaterial map={textura} color={tono('#ffffff', c.rol)} roughness={0.62} metalness={0} />
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
}
