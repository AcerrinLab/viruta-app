// Datos fijos del editor: plantillas con sus rangos (iguales a los del backend), materiales y colores.

export const PLANTILLAS = {
  ESTANTE: {
    etiqueta: 'Estante',
    ancho: [300, 2400], alto: [300, 2400], profundidad: [150, 600], estantes: [0, 6],
    inicial: { ancho: 800, alto: 900, profundidad: 300, estantes: 1 },
  },
  MESA: {
    etiqueta: 'Mesa',
    ancho: [600, 2400], alto: [400, 1100], profundidad: [400, 1000], estantes: [0, 0],
    inicial: { ancho: 1200, alto: 750, profundidad: 600, estantes: 0 },
  },
  BAJO_MESADA: {
    etiqueta: 'Bajo mesada',
    ancho: [400, 2400], alto: [600, 950], profundidad: [400, 650], estantes: [0, 3],
    inicial: { ancho: 800, alto: 850, profundidad: 550, estantes: 1 },
  },
  RELICARIO: {
    etiqueta: 'El relicario',
    coleccion: 'ANTIGUOS',
    descripcion: 'Vitrina con puertas y estantes de vidrio',
    ancho: [450, 1000], alto: [1200, 2000], profundidad: [300, 500], estantes: [1, 5],
    inicial: { ancho: 700, alto: 1700, profundidad: 400, estantes: 3 },
  },
};

/** Secciones del catalogo. Las piezas antiguas luego van a formar colecciones. */
export const COLECCIONES = [
  ['CLASICOS', 'Clásicos', 'Lo esencial para cualquier ambiente.'],
  ['ANTIGUOS', 'Antiguos', 'Piezas de estilo, la primera de una colección.'],
];

export const MATERIALES = { PINO: 'Pino', MELAMINA: 'Melamina', AGLOMERADO: 'Aglomerado' };

export const COLORES = {
  NATURAL: { etiqueta: 'Natural', hex: '#D4A373' },
  BLANCO: { etiqueta: 'Blanco', hex: '#F1EEE7' },
  NOGAL: { etiqueta: 'Nogal', hex: '#6E4E37' },
  GRAFITO: { etiqueta: 'Grafito', hex: '#3F3F3C' },
};

export function disenoInicial(plantilla) {
  return {
    nombre: PLANTILLAS[plantilla].etiqueta,
    plantilla,
    ...PLANTILLAS[plantilla].inicial,
    material: 'MELAMINA',
    color: 'NATURAL',
    espacioAncho: null,
    espacioAlto: null,
    espacioProfAdelante: null,
    espacioProfAtras: null,
  };
}

/** Deja cada medida dentro del rango de la plantilla. */
export function ajustarARango(diseno) {
  const p = PLANTILLAS[diseno.plantilla];
  const dentro = (v, [min, max]) => Math.min(max, Math.max(min, Math.round(v)));
  return {
    ...diseno,
    ancho: dentro(diseno.ancho, p.ancho),
    alto: dentro(diseno.alto, p.alto),
    profundidad: dentro(diseno.profundidad, p.profundidad),
    estantes: dentro(diseno.estantes, p.estantes),
  };
}

/** El espacio se manda solo si estan las cuatro medidas; si no, se manda vacio. */
export function aSolicitud(diseno) {
  const completo = [diseno.espacioAncho, diseno.espacioAlto, diseno.espacioProfAdelante, diseno.espacioProfAtras]
    .every((v) => Number.isFinite(v) && v > 0);
  return {
    ...diseno,
    espacioAncho: completo ? diseno.espacioAncho : null,
    espacioAlto: completo ? diseno.espacioAlto : null,
    espacioProfAdelante: completo ? diseno.espacioProfAdelante : null,
    espacioProfAtras: completo ? diseno.espacioProfAtras : null,
  };
}

export function tieneEspacio(diseno) {
  return aSolicitud(diseno).espacioAncho !== null;
}
