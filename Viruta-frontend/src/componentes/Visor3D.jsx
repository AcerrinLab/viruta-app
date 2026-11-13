import { useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { cajas, envolvente, tono } from '../lib/modelo.js';
import { COLORES } from '../lib/diseno.js';
import { cajaMadera, texturaMadera } from '../lib/madera.js';

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

/** Visor 3D del mueble (RF-01, RF-28). Dibuja exactamente las piezas que devuelve el backend. */
export default function Visor3D({ piezas, color = 'NATURAL', alto = 320 }) {
  const lista = useMemo(() => cajas(piezas), [piezas]);
  const tam = useMemo(() => envolvente(piezas), [piezas]);
  const hex = (COLORES[color] || COLORES.NATURAL).hex;
  const textura = useMemo(() => texturaMadera(hex), [hex]);
  const geometrias = useMemo(() => lista.map((c, i) => cajaMadera(c.tam, i)), [lista]);
  useEffect(() => () => geometrias.forEach((g) => g.dispose()), [geometrias]);

  return (
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
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
          <circleGeometry args={[Math.max(tam[0], tam[2], 0.4) * 0.8, 64]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.06} />
        </mesh>
        <Camara tam={tam} />
      </Canvas>
    </div>
  );
}
