import { COLORES } from '../lib/diseno.js';

// Miniatura del mueble vista de frente: dibuja las mismas piezas que el visor 3D (x y z del
// backend), de atras hacia adelante, para reconocer de un vistazo que diseno es cada pedido.

function oscurecer(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return '#' + ((c(n >> 16) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).padStart(6, '0');
}

export default function Miniatura({ piezas, color = 'NATURAL', tam = 72 }) {
  if (!piezas || piezas.length === 0) {
    return <span className="miniatura vacia" style={{ width: tam, height: tam }} aria-hidden="true" />;
  }
  const ancho = Math.max(...piezas.map((p) => p.x + p.dx));
  const alto = Math.max(...piezas.map((p) => p.z + p.dz));
  const lado = Math.max(ancho, alto);
  const margen = lado * 0.08;
  const madera = (COLORES[color] || COLORES.NATURAL).hex;
  const borde = oscurecer(madera, 0.7);
  // Primero lo del fondo, al final lo del frente (y chico = adelante).
  const orden = [...piezas].sort((a, b) => (b.y + b.dy) - (a.y + a.dy));

  return (
    <svg className="miniatura" width={tam} height={tam} role="img" aria-label="Vista de frente del mueble"
      viewBox={`${-margen - (lado - ancho) / 2} ${-margen - (lado - alto) / 2} ${lado + margen * 2} ${lado + margen * 2}`}>
      {orden.map((p, i) => {
        const vidrio = p.rol === 'VIDRIO';
        return (
          <rect key={i} x={p.x} y={alto - p.z - p.dz} width={Math.max(p.dx, lado * 0.004)} height={Math.max(p.dz, lado * 0.004)}
            fill={vidrio ? '#CFE3E6' : p.nombre === 'Fondo' ? oscurecer(madera, 0.86) : madera}
            fillOpacity={vidrio ? 0.55 : 1}
            stroke={vidrio ? '#9DBEC4' : borde} strokeWidth={lado * 0.006} />
        );
      })}
    </svg>
  );
}
