// Las medidas se guardan en milimetros enteros (RNF-01). La interfaz muestra centimetros.

export function mmACm(mm) {
  if (mm === null || mm === undefined || mm === '') return '';
  const cm = mm / 10;
  return Number.isInteger(cm) ? String(cm) : String(cm).replace('.', ',');
}

export function cmAMm(texto) {
  if (texto === null || texto === undefined) return null;
  const limpio = String(texto).trim().replace(',', '.');
  if (limpio === '') return null;
  const cm = Number(limpio);
  if (!Number.isFinite(cm)) return null;
  return Math.round(cm * 10);
}

export function limitar(valor, min, max) {
  return Math.min(max, Math.max(min, valor));
}

export function pesos(monto) {
  return '$ ' + Math.round(monto || 0).toLocaleString('es-AR');
}

export function medidas(d) {
  return `${mmACm(d.ancho)} × ${mmACm(d.alto)} × ${mmACm(d.profundidad)} cm`;
}
