/**
 * Bitácora del ingeniero.
 *   cita:    la frase de cada nivel, escrita por el equipo en data/bitacora.json
 *   detalle: plantilla según lo que hizo el jugador:
 *            «{Cerraste | Abriste} {una vía | N vías} y todos llegaron X minutos antes.»
 * Sin fórmulas ni jerga (Maeda: reducir).
 */
import frases from '../../data/bitacora.json';
import { abiertasIniciales, type Nivel } from '../engine/equilibrio';
import { nf } from '../render/primitivas';

const FRASES = new Map((frases as { num: number; frase: string }[]).map((f) => [f.num, f.frase]));

/** La frase del nivel (data/bitacora.json). */
export function fraseDe(num: number): string {
  return FRASES.get(num) ?? '«Hoy la ciudad respiró.»';
}

const NUMEROS = ['', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis'];
const cuantas = (n: number) => NUMEROS[n] ?? String(n);

export interface Bitacora {
  cita: string;
  detalle: string;
  /** TOTAL al empezar y al terminar, como se muestran en pantalla */
  antes: string;
  despues: string;
}

/**
 * @param nivel   nivel jugado
 * @param abiertas vías abiertas al ganar
 * @param total   TOTAL alcanzado
 */
export function bitacora(nivel: Nivel, abiertas: Set<string>, total: number): Bitacora {
  const ini = abiertasIniciales(nivel);
  // cambios netos respecto al inicio (abrir y volver a cerrar no cuenta)
  const cambios = nivel.links.filter((l) => ini.has(l.id) !== abiertas.has(l.id));
  const cerradas = cambios.filter((l) => ini.has(l.id)).length;
  const abiertasN = cambios.length - cerradas;
  const vias = (n: number) => `${cuantas(n)} vía${n === 1 ? '' : 's'}`;
  let hecho: string;
  if (cerradas && abiertasN) hecho = cerradas === 1 && abiertasN === 1 ? 'Cerraste una vía, abriste otra' : `Cerraste ${vias(cerradas)}, abriste ${vias(abiertasN)}`;
  else if (cerradas) hecho = `Cerraste ${vias(cerradas)}`;
  else hecho = `Abriste ${vias(abiertasN)}`;

  // los minutos ahorrados salen de los mismos números que se ven en pantalla
  const r1 = (v: number) => Math.round(v * 10) / 10;
  const ahorro = r1(r1(nivel.start) - r1(total));
  const detalle = `${hecho} y todos llegaron ${nf(ahorro)} minuto${ahorro === 1 ? '' : 's'} antes.`;

  return { cita: fraseDe(nivel.num), detalle, antes: nf(nivel.start), despues: nf(total) };
}
