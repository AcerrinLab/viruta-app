import { describe, expect, it, vi } from 'vitest';
import { pantallasProbables, precargarSegunRol } from './carga.js';

// RNF-04 y RNF-05: se precarga lo que la persona probablemente abra, sin gastar datos de mas.

describe('precarga de pantallas', () => {
  it('elige las pantallas segun quien entra', () => {
    expect(pantallasProbables(undefined)).toEqual(['disenar']);
    expect(pantallasProbables('CLIENTE')).toContain('misPedidos');
    expect(pantallasProbables('CARPINTERIA')).toContain('panel');
    expect(pantallasProbables('ADMIN')).toContain('admin');
  });

  it('no precarga nada si el celular tiene el ahorro de datos prendido', () => {
    const ocioso = vi.fn();
    const lista = precargarSegunRol('CLIENTE', { navigator: { connection: { saveData: true } }, requestIdleCallback: ocioso });
    expect(lista).toEqual([]);
    expect(ocioso).not.toHaveBeenCalled();
  });

  it('no precarga con conexiones 2G', () => {
    const ocioso = vi.fn();
    expect(precargarSegunRol(undefined, { navigator: { connection: { effectiveType: 'slow-2g' } }, requestIdleCallback: ocioso })).toEqual([]);
    expect(precargarSegunRol(undefined, { navigator: { connection: { effectiveType: '2g' } }, requestIdleCallback: ocioso })).toEqual([]);
    expect(ocioso).not.toHaveBeenCalled();
  });

  it('con buena conexion espera a que el navegador este ocioso', () => {
    const ocioso = vi.fn();
    expect(precargarSegunRol('ADMIN', { navigator: { connection: { effectiveType: '4g' } }, requestIdleCallback: ocioso })).toEqual(['admin', 'cuenta']);
    expect(ocioso).toHaveBeenCalledTimes(1);
  });
});
