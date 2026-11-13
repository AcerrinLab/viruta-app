import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';

/** Pago de prueba. Solo funciona cuando el backend esta en PAGOS_MODO=simulado. */
export default function PagoSimulado() {
  const [parametros] = useSearchParams();
  const pedido = parametros.get('pedido');
  const [error, setError] = useState('');
  const navegar = useNavigate();

  const aprobar = async () => {
    try {
      await api(`/api/pagos/simulado/${pedido}/aprobar`, { metodo: 'POST' });
      navegar('/mis-pedidos');
    } catch (problema) {
      setError(problema.message);
    }
  };

  return (
    <main className="angosto">
      <div className="tarjeta pila">
        <span className="chip aviso">Modo de prueba</span>
        <h2>Pago de la seña</h2>
        <p className="tenue">No se cobra dinero real. En producción, acá se abre Mercado Pago.</p>
        {error && <p className="nota error">{error}</p>}
        <button className="boton" onClick={aprobar}>Aprobar pago</button>
        <button className="boton plano" onClick={() => navegar('/mis-pedidos')}>Cancelar</button>
      </div>
    </main>
  );
}
