import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Icono } from './Iconos.jsx';
import { ESTADOS } from '../lib/estados.js';

// Buscador de la barra: secciones, proyectos y pedidos de la persona. Se abre con el boton
// o con Ctrl+K y se maneja con el teclado.

const SECCIONES = {
  INVITADO: [['Diseñar un mueble', '/disenar', 'cubo'], ['Ingresar', '/ingresar', 'persona'], ['Soy carpintería', '/ingresar?rol=CARPINTERIA', 'martillo']],
  CLIENTE: [
    ['Diseñar un mueble', '/disenar', 'cubo'], ['Mis proyectos', '/cuenta/proyectos', 'cubo'], ['Mis pedidos', '/mis-pedidos', 'bandeja'],
    ['Mi perfil', '/cuenta/perfil', 'persona'], ['Preferencias', '/cuenta/preferencias', 'ajustes'], ['Seguridad', '/cuenta/seguridad', 'escudo'],
  ],
  CARPINTERIA: [
    ['Bandeja de pedidos', '/panel', 'bandeja'], ['Resumen', '/cuenta/resumen', 'grafico'], ['Mi taller', '/cuenta/perfil', 'martillo'],
    ['Cobros', '/cuenta/cobros', 'billete'], ['Preferencias', '/cuenta/preferencias', 'ajustes'], ['Seguridad', '/cuenta/seguridad', 'escudo'],
  ],
  ADMIN: [['Métricas', '/metricas', 'grafico']],
};

const normal = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Buscador({ sesion }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [datos, setDatos] = useState([]);
  const [indice, setIndice] = useState(0);
  const campo = useRef(null);
  const navegar = useNavigate();

  useEffect(() => {
    const tecla = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setAbierto(true); }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, []);

  // Al abrir, trae proyectos y pedidos para poder buscarlos por nombre.
  useEffect(() => {
    if (!abierto) return;
    setTexto('');
    setIndice(0);
    setTimeout(() => campo.current?.focus(), 30);
    if (!sesion) return setDatos([]);
    const lista = [];
    const pedidos = sesion.rol === 'CARPINTERIA' ? '/api/carpinteria/pedidos' : sesion.rol === 'CLIENTE' ? '/api/pedidos' : null;
    Promise.all([
      sesion.rol === 'CLIENTE' ? api('/api/proyectos').catch(() => []) : [],
      pedidos ? api(pedidos).catch(() => []) : [],
    ]).then(([proyectos, ped]) => {
      (proyectos || []).forEach((p) => lista.push({ grupo: 'Proyectos', titulo: p.diseno.nombre, detalle: 'Proyecto guardado', a: '/disenar?proyecto=' + p.id, icono: 'cubo' }));
      (ped || []).forEach((p) => lista.push({
        grupo: 'Pedidos', titulo: p.diseno.nombre, icono: 'bandeja',
        detalle: [sesion.rol === 'CARPINTERIA' ? p.cliente?.nombre : p.carpinteria?.nombre, ESTADOS[p.estado]?.etiqueta].filter(Boolean).join(' · '),
        a: sesion.rol === 'CARPINTERIA' ? '/panel?pedido=' + p.id : '/mis-pedidos',
      }));
      setDatos(lista);
    });
  }, [abierto, sesion]);

  const resultados = useMemo(() => {
    const q = normal(texto.trim());
    const secciones = (SECCIONES[sesion?.rol] || SECCIONES.INVITADO)
      .map(([titulo, a, icono]) => ({ grupo: 'Secciones', titulo, a, icono }));
    const todos = [...secciones, ...datos];
    return q ? todos.filter((r) => normal(r.titulo + ' ' + (r.detalle || '')).includes(q)).slice(0, 12) : todos.slice(0, 9);
  }, [texto, datos, sesion]);

  const ir = (r) => { setAbierto(false); navegar(r.a); };
  const teclas = (e) => {
    if (e.key === 'Escape') setAbierto(false);
    else if (e.key === 'ArrowDown') { e.preventDefault(); setIndice((i) => Math.min(i + 1, resultados.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIndice((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && resultados[indice]) ir(resultados[indice]);
  };

  let grupo = null;
  return (
    <>
      <button className="buscar-boton" onClick={() => setAbierto(true)} aria-label="Buscar">
        <Icono nombre="lupa" tam={18} /><span className="buscar-texto">Buscar</span><kbd>Ctrl K</kbd>
      </button>
      {abierto && (
        <div className="velo buscador-velo" onPointerDown={(e) => e.target === e.currentTarget && setAbierto(false)}>
          <div className="buscador" role="dialog" aria-modal="true" aria-label="Buscar">
            <div className="buscador-campo">
              <Icono nombre="lupa" tam={18} />
              <input ref={campo} type="text" placeholder="Buscar secciones, proyectos o pedidos" value={texto}
                onChange={(e) => { setTexto(e.target.value); setIndice(0); }} onKeyDown={teclas} aria-label="Buscar" />
              <button className="boton plano" onClick={() => setAbierto(false)}>Cerrar</button>
            </div>
            <div className="buscador-lista" role="listbox">
              {resultados.length === 0 && <p className="tenue vacio">No encontramos nada con “{texto}”.</p>}
              {resultados.map((r, i) => {
                const titulo = r.grupo !== grupo ? (grupo = r.grupo) : null;
                return (
                  <div key={r.grupo + r.a + i}>
                    {titulo && <p className="buscador-grupo">{titulo}</p>}
                    <button role="option" aria-selected={i === indice} className={'buscador-item' + (i === indice ? ' activo' : '')}
                      onMouseEnter={() => setIndice(i)} onClick={() => ir(r)}>
                      <Icono nombre={r.icono} tam={16} />
                      <span><strong>{r.titulo}</strong>{r.detalle && <span className="tenue">{r.detalle}</span>}</span>
                      <Icono nombre="adelante" tam={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
