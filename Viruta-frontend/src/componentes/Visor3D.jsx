import { useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { cajas, envolvente, tono } from '../lib/modelo.js';
import { COLORES } from '../lib/diseno.js';

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

  return (
    <div className="visor" style={{ height: alto }} aria-label="Vista 3D del mueble. Arrastrá para girarlo.">
      <Canvas camera={{ fov: 35, near: 0.05, far: 50 }} dpr={[1, 2]}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[3, 5, 4]} intensity={1.6} />
        <directionalLight position={[-4, 2, -2]} intensity={0.5} />
        {lista.map((c, i) => (
          <mesh key={i} position={c.centro}>
            <boxGeometry args={c.tam} />
            <meshStandardMaterial color={tono(hex, c.rol)} roughness={0.75} />
          </mesh>
        ))}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
          <circleGeometry args={[Math.max(tam[0], tam[2], 0.4) * 1.1, 48]} />
          <meshBasicMaterial color="#e2dbcd" />
        </mesh>
        <Camara tam={tam} />
      </Canvas>
    </div>
  );
}
