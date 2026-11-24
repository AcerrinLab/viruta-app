import { describe, expect, it, vi } from 'vitest';
import { pedir } from './red.js';

// RNF-04, RNF-11 y RNF-14: con servidores gratis el backend puede estar dormido. La app reintenta
// lo que es seguro reintentar y avisa que el servidor esta despertando, en vez de quedar en blanco.

const ok = (cuerpo = {}) => ({ ok: true, status: 200, json: async () => cuerpo });
const estado = (status) => ({ ok: false, status, json: async () => ({ error: 'x' }) });
const sinRed = () => Promise.reject(new TypeError('Failed to fetch'));
const sinEspera = () => Promise.resolve();

describe('pedir: reintentos', () => {
  it('reintenta un GET si se corta la red y devuelve la respuesta cuando el servidor contesta', async () => {
    const fetch = vi.fn().mockImplementationOnce(sinRed).mockImplementationOnce(sinRed).mockResolvedValueOnce(ok());
    const r = await pedir('/api/x', { method: 'GET' }, { fetch, dormir: sinEspera });
    expect(r.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('reintenta un GET si el servidor responde que esta arrancando (502, 503 o 504)', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(estado(503)).mockResolvedValueOnce(estado(502)).mockResolvedValueOnce(ok());
    const r = await pedir('/api/x', { method: 'GET' }, { fetch, dormir: sinEspera });
    expect(r.status).toBe(200);
  });

  it('no reintenta errores que no son de arranque (400, 401, 404, 500)', async () => {
    for (const s of [400, 401, 404, 500]) {
      const fetch = vi.fn().mockResolvedValue(estado(s));
      const r = await pedir('/api/x', { method: 'GET' }, { fetch, dormir: sinEspera });
      expect(r.status).toBe(s);
      expect(fetch).toHaveBeenCalledTimes(1);
    }
  });

  it('nunca reintenta un POST: podria duplicar un pedido o un pago', async () => {
    const fetch = vi.fn().mockImplementation(sinRed);
    await expect(pedir('/api/pedidos', { method: 'POST' }, { fetch, dormir: sinEspera })).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('se rinde despues de los intentos permitidos', async () => {
    const fetch = vi.fn().mockImplementation(sinRed);
    await expect(pedir('/api/x', { method: 'GET' }, { fetch, dormir: sinEspera, intentos: 4 })).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it('espera cada vez mas entre intentos', async () => {
    const esperas = [];
    const fetch = vi.fn().mockImplementation(sinRed);
    await expect(pedir('/api/x', { method: 'GET' }, {
      fetch, intentos: 4, dormir: (ms) => { esperas.push(ms); return Promise.resolve(); },
    })).rejects.toThrow();
    expect(esperas).toHaveLength(3);
    expect(esperas[1]).toBeGreaterThan(esperas[0]);
    expect(esperas[2]).toBeGreaterThan(esperas[1]);
  });
});

describe('pedir: aviso de servidor despertando', () => {
  it('avisa una sola vez si la respuesta tarda mas que el umbral, y avisa cuando termina', async () => {
    vi.useFakeTimers();
    const avisos = [];
    let responder;
    const fetch = vi.fn(() => new Promise((r) => { responder = r; }));
    const promesa = pedir('/api/x', { method: 'GET' }, { fetch, umbralLento: 2500, alCambiarEstado: (e) => avisos.push(e) });
    await vi.advanceTimersByTimeAsync(2600);
    expect(avisos).toEqual(['despertando']);
    responder(ok());
    await promesa;
    expect(avisos).toEqual(['despertando', 'listo']);
    vi.useRealTimers();
  });

  it('si responde rapido no muestra ningun aviso', async () => {
    const avisos = [];
    const fetch = vi.fn().mockResolvedValue(ok());
    await pedir('/api/x', { method: 'GET' }, { fetch, umbralLento: 2500, alCambiarEstado: (e) => avisos.push(e) });
    expect(avisos).toEqual([]);
  });
});
