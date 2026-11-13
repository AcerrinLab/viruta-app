import { Icono } from './Iconos.jsx';
import { ESTADOS } from '../lib/estados.js';
import { pesos } from '../lib/unidades.js';

// Estadisticas del taller presentadas en tarjetas: indicadores con mini curva, tendencia
// mensual en barras, estados con barras de progreso y una tabla por mes.

const COBRADOS = ['ACEPTADO', 'MEDIDAS_VERIFICADAS', 'EN_FABRICACION', 'ENTREGADO'];
const PRESUPUESTADOS = ['PRESUPUESTADO', ...COBRADOS, 'RECHAZADO', 'VENCIDO'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Ultimos 6 meses con sus pedidos. */
function porMes(pedidos) {
  const hoy = new Date();
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    meses.push({ clave: d.getFullYear() * 12 + d.getMonth(), nombre: MESES[d.getMonth()], pedidos: [] });
  }
  pedidos.forEach((p) => {
    const d = new Date(p.creado || Date.now());
    const m = meses.find((x) => x.clave === d.getFullYear() * 12 + d.getMonth());
    if (m) m.pedidos.push(p);
  });
  return meses.map((m) => {
    const cobrados = m.pedidos.filter((p) => COBRADOS.includes(p.estado));
    return {
      ...m,
      cantidad: m.pedidos.length,
      presupuestado: cobrados.reduce((s, p) => s + (p.presupuesto?.total || 0), 0),
      senas: cobrados.reduce((s, p) => s + (p.presupuesto?.sena || 0), 0),
      aceptados: cobrados.length,
      enviados: m.pedidos.filter((p) => PRESUPUESTADOS.includes(p.estado)).length,
    };
  });
}

function Mini({ valores, tono }) {
  const max = Math.max(1, ...valores);
  const pts = valores.map((v, i) => `${(i / Math.max(1, valores.length - 1)) * 100},${34 - (v / max) * 28}`).join(' ');
  return (
    <svg className={'mini ' + (tono || '')} viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={`0,36 ${pts} 100,36`} className="mini-area" />
      <polyline points={pts} className="mini-linea" />
    </svg>
  );
}

function Variacion({ actual, anterior }) {
  if (!anterior) return <span className="tenue chico">este mes</span>;
  const cambio = Math.round(((actual - anterior) / anterior) * 100);
  return (
    <span className="variacion">
      <span className={'chip ' + (cambio >= 0 ? 'bien' : 'aviso')}>
        <Icono nombre="flecha" tam={11} />{Math.abs(cambio)}%
      </span>
      <span className="tenue chico">vs mes anterior</span>
    </span>
  );
}

export default function TarjetasTaller({ pedidos, resumen }) {
  const meses = porMes(pedidos);
  const ahora = meses[5];
  const antes = meses[4];
  const maxBarra = Math.max(1, ...meses.map((m) => m.cantidad));
  const cobrados = pedidos.filter((p) => COBRADOS.includes(p.estado));
  const enviados = pedidos.filter((p) => PRESUPUESTADOS.includes(p.estado));
  const tasa = (m) => (m.enviados ? Math.round((m.aceptados / m.enviados) * 100) : 0);
  const estados = Object.keys(ESTADOS).map((e) => [e, pedidos.filter((p) => p.estado === e).length]).filter(([, n]) => n > 0);
  const maxEstado = Math.max(1, ...estados.map(([, n]) => n));

  const indicadores = [
    ['Señas cobradas', pesos(resumen?.senasCobradas), meses.map((m) => m.senas), ahora.senas, antes.senas, ''],
    ['Total presupuestado', pesos(cobrados.reduce((s, p) => s + (p.presupuesto?.total || 0), 0)), meses.map((m) => m.presupuestado), ahora.presupuestado, antes.presupuestado, 'b'],
    ['Pedidos recibidos', pedidos.length, meses.map((m) => m.cantidad), ahora.cantidad, antes.cantidad, 'c'],
    ['Aceptación', enviados.length ? Math.round((cobrados.length / enviados.length) * 100) + '%' : '—', meses.map(tasa), tasa(ahora), tasa(antes), 'd'],
  ];

  return (
    <div className="tarjetas-taller">
      <div className="kpis">
        {indicadores.map(([titulo, valor, serie, a, b, tono]) => (
          <section key={titulo} className="tarjeta kpi">
            <span className="kpi-titulo">{titulo}</span>
            <div className="kpi-cuerpo">
              <div>
                <span className="numero">{valor}</span>
                <Variacion actual={a} anterior={b} />
              </div>
              <Mini valores={serie} tono={tono} />
            </div>
          </section>
        ))}
      </div>

      <div className="kpis-dos">
        <section className="tarjeta">
          <div className="t-cabeza">
            <span>Pedidos por mes</span>
            <span className="tenue chico"><i className="punto-color" />Últimos 6 meses</span>
          </div>
          <div className="barras-mes" role="img" aria-label="Pedidos por mes">
            {meses.map((m, i) => (
              <div key={m.clave} className={'barra-mes' + (i === 5 ? ' actual' : '')}>
                <span className="barra-mes-valor">{m.cantidad}</span>
                <span className="barra-mes-columna" style={{ height: `${Math.max(4, (m.cantidad / maxBarra) * 100)}%` }} />
                <span className="tenue">{m.nombre}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="tarjeta">
          <div className="t-cabeza"><span>Pedidos por estado</span><span className="tenue chico">{pedidos.length} en total</span></div>
          <div className="estados-tabla">
            <div className="estados-fila cabeza tenue"><span>Estado</span><span /><span>Cantidad</span><span>%</span></div>
            {estados.length === 0 && <p className="tenue">Sin pedidos todavía.</p>}
            {estados.map(([e, n]) => (
              <div key={e} className="estados-fila">
                <span>{ESTADOS[e].etiqueta}</span>
                <span className="barra-pista"><span style={{ width: `${(n / maxEstado) * 100}%` }} /></span>
                <strong>{n}</strong>
                <span className="tenue">{Math.round((n / pedidos.length) * 100)}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="tarjeta">
        <div className="t-cabeza"><span>Resumen mensual</span><span className="chip">{new Date().getFullYear()}</span></div>
        <div className="tabla-mes">
          <table>
            <thead>
              <tr><th>Mes</th><th className="num">Pedidos</th><th className="num">Presupuestado</th><th className="num">Señas</th><th className="num">Aceptación</th></tr>
            </thead>
            <tbody>
              {[...meses].reverse().map((m) => (
                <tr key={m.clave}>
                  <td><strong>{m.nombre}</strong></td>
                  <td className="num">{m.cantidad}</td>
                  <td className="num">{pesos(m.presupuestado)}</td>
                  <td className="num">{pesos(m.senas)}</td>
                  <td className="num">{m.enviados ? tasa(m) + '%' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
