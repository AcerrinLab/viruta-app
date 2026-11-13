import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { pesos } from '../lib/unidades.js';

/** Panel interno de traccion (RF-21). Los numeros salen de la base de datos. */
export default function Metricas() {
  const [m, setM] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/metricas').then(setM).catch((problema) => setError(problema.message));
  }, []);

  const datos = m && [
    ['Usuarios', m.usuarios],
    ['Lista de espera', m.inscriptos],
    ['Diseños guardados', m.proyectos],
    ['Pedidos', m.pedidos],
    ['Señas cobradas', m.senas],
    ['Monto de señas', pesos(m.montoSenas)],
  ];

  return (
    <main className="pila">
      <h2>Métricas</h2>
      {error && <p className="nota error">{error}</p>}
      <div className="tres">
        {(datos || []).map(([nombre, valor]) => (
          <div key={nombre} className="tarjeta dato">
            <span className="tenue">{nombre}</span>
            <span className="numero">{valor}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
