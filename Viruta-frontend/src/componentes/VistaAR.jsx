import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { cajas, tono } from '../lib/modelo.js';
import { COLORES } from '../lib/diseno.js';
import { cajaMadera, texturaMadera } from '../lib/madera.js';
import { Icono } from './Iconos.jsx';

/** Arma el modelo GLB del mueble a escala real (metros) a partir de las mismas piezas del visor. */
function exportarGlb(piezas, hex) {
  const grupo = new THREE.Group();
  const textura = texturaMadera(hex);
  cajas(piezas).forEach((c, i) => {
    const malla = new THREE.Mesh(
      cajaMadera(c.tam, i),
      c.rol === 'VIDRIO'
        ? new THREE.MeshStandardMaterial({ color: '#DCEBEA', transparent: true, opacity: 0.3, roughness: 0.08, metalness: 0.1 })
        : new THREE.MeshStandardMaterial({ map: textura, color: tono('#ffffff', c.rol), roughness: 0.62, metalness: 0 })
    );
    malla.position.set(...c.centro);
    grupo.add(malla);
  });
  return new Promise((resolver, rechazar) => {
    new GLTFExporter().parse(
      grupo,
      (glb) => resolver(URL.createObjectURL(new Blob([glb], { type: 'model/gltf-binary' }))),
      rechazar,
      { binary: true }
    );
  });
}

/**
 * Vista en el espacio con realidad aumentada (RF-04). En celulares abre la AR a escala 1:1;
 * en computadora queda el visor 3D. La AR muestra el mueble: no mide el espacio.
 */
export default function VistaAR({ piezas, color = 'NATURAL', alCerrar }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    let creada = null;
    const hex = (COLORES[color] || COLORES.NATURAL).hex;
    Promise.all([import('@google/model-viewer'), exportarGlb(piezas, hex)])
      .then(([, nueva]) => {
        creada = nueva;
        if (vigente) setUrl(nueva);
      })
      .catch(() => vigente && setError('No pudimos preparar la vista. Probá de nuevo.'));
    return () => {
      vigente = false;
      if (creada) URL.revokeObjectURL(creada);
    };
  }, [piezas, color]);

  return (
    <div className="velo" role="dialog" aria-modal="true" aria-label="Ver en mi espacio">
      <div className="dialogo grande">
        {error && <p className="nota error" style={{ margin: 20 }}>{error}</p>}
        {!error && !url && <p className="tenue" style={{ padding: 40, textAlign: 'center' }}>Preparando el mueble…</p>}
        {url && (
          <model-viewer
            src={url}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="fixed"
            ar-placement="floor"
            camera-controls
            shadow-intensity="0.6"
            touch-action="pan-y"
            alt="Tu mueble en 3D"
          >
            <button slot="ar-button" className="boton" style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)' }}>
              <Icono nombre="visor" />Abrir cámara
            </button>
          </model-viewer>
        )}
        <div className="fila entre" style={{ padding: '14px 20px' }}>
          <p className="tenue chico">En el celular, tocá “Abrir cámara” y apuntá al piso.</p>
          <button className="boton claro" onClick={alCerrar}><Icono nombre="cerrar" />Cerrar</button>
        </div>
      </div>
    </div>
  );
}
