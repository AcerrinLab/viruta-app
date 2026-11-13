// Iconos de linea redondeada, dibujados a mano con el estilo de los simbolos de iOS
// (trazo 1.8, puntas y uniones redondas). Heredan el color del texto.

const RUTAS = {
  sol: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2.8v1.8M12 19.4v1.8M21.2 12h-1.8M4.6 12H2.8M18.5 5.5l-1.3 1.3M6.8 17.2l-1.3 1.3M18.5 18.5l-1.3-1.3M6.8 6.8 5.5 5.5',
  luna: 'M19.5 14.6A7.8 7.8 0 0 1 9.4 4.5a7.8 7.8 0 1 0 10.1 10.1Z',
  casa: 'M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19v-8.5Z',
  caja: 'M4 8.2 12 4l8 4.2v7.6L12 20l-8-4.2V8.2ZM4 8.2l8 4.2 8-4.2M12 12.4V20M8 6.1l8 4.2',
  bandeja: 'M4 13.5 6.4 6a1.5 1.5 0 0 1 1.4-1h8.4a1.5 1.5 0 0 1 1.4 1L20 13.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18v-4.5Zm0 0h4.5l1 2h5l1-2H20',
  grafico: 'M5 20V11M10 20V5M15 20v-6M20 20V9',

  cubo: 'M12 2.8 20 7.2v9.6L12 21.2 4 16.8V7.2L12 2.8ZM4.4 7.4 12 11.8l7.6-4.4M12 11.8v9',
  martillo: 'M14.5 4.5 19.5 9.5l-2 2-1.6-1.6-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l8.6-8.6-1.4-1.4c1.2-1.2 1.4-1.4 2.6-1.4Z',
  visor: 'M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M12 7.5l4 2.25v4.5L12 16.5l-4-2.25v-4.5L12 7.5ZM8.2 9.9 12 12l3.8-2.1M12 12v4.3',
  lista: 'M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01',
  enviar: 'M20.5 3.5 10.8 13.2M20.5 3.5 14.4 20.2a.6.6 0 0 1-1.1 0l-2.5-7-7-2.5a.6.6 0 0 1 0-1.1L20.5 3.5Z',
  guardar: 'M12 3.5v11M7.5 10.5 12 15l4.5-4.5M4.5 15.5v2a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5v-2',
  flecha: 'M5 12h14M13 6l6 6-6 6',
  volver: 'M14.5 5.5 8 12l6.5 6.5',
  regla: 'M3.7 15.6 15.6 3.7a1 1 0 0 1 1.4 0l3.3 3.3a1 1 0 0 1 0 1.4L8.4 20.3a1 1 0 0 1-1.4 0L3.7 17a1 1 0 0 1 0-1.4ZM7 12.3l1.8 1.8M9.8 9.5l1.4 1.4M12.6 6.7l1.8 1.8',
  campana: 'M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15L6 16.5ZM10 20.5a2.2 2.2 0 0 0 4 0',
  persona: 'M12 12.2a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6ZM4.8 20.2c.9-3.4 3.8-5.4 7.2-5.4s6.3 2 7.2 5.4',
  salir: 'M14 4.5H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h7M10.5 12H20M16.5 8.5 20 12l-3.5 3.5',
  cerrar: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  girar: 'M4.5 12a7.5 7.5 0 0 1 13-5.1M19.5 12a7.5 7.5 0 0 1-13 5.1M17.8 3.6v3.6h-3.6M6.2 20.4v-3.6h3.6',
  carrito: 'M3.5 4.5h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h7.6a1.5 1.5 0 0 0 1.5-1.1l1.6-6.3H6.3M9.5 20h.01M17 20h.01',
};

export function Icono({ nombre, tam = 18 }) {
  return (
    <svg className="icono" width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={RUTAS[nombre]} />
    </svg>
  );
}
