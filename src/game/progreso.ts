/**
 * Progreso del jugador, guardado en localStorage:
 * nivel actual, niveles resueltos, mejores toques y la bitácora de cada nivel.
 * Si el navegador no deja guardar (modo privado, etc.) el juego sigue funcionando sin recordar.
 */
import type { Bitacora } from './bitacora';

export interface Progreso {
  /** nivel donde se sigue jugando */
  actual: number;
  resueltos: number[];
  /** menos toques con que se resolvió cada nivel */
  mejores: Record<number, number>;
  bitacora: Record<number, Bitacora>;
  /** último nivel resuelto (para el chip «Bitácora» del inicio) */
  ultima: number | null;
}

export const TOTAL_NIVELES = 15;
const CLAVE = 'equilibrio.progreso.v1';

export const progresoVacio = (): Progreso => ({ actual: 1, resueltos: [], mejores: {}, bitacora: {}, ultima: null });

/** ¿Se puede jugar este nivel? (los resueltos y el actual) */
export function disponible(p: Progreso, num: number): boolean {
  return num <= p.actual || p.resueltos.includes(num);
}

/** Devuelve el progreso después de ganar un nivel (no muta). */
export function registrarVictoria(p: Progreso, num: number, toques: number, entrada: Bitacora): Progreso {
  return {
    actual: Math.max(p.actual, Math.min(TOTAL_NIVELES, num + 1)),
    resueltos: [...new Set([...p.resueltos, num])].sort((a, b) => a - b),
    mejores: { ...p.mejores, [num]: Math.min(p.mejores[num] ?? Infinity, toques) },
    bitacora: { ...p.bitacora, [num]: entrada },
    ultima: num,
  };
}

const entero = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

export function cargarProgreso(almacen: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): Progreso {
  try {
    const d = JSON.parse(almacen?.getItem(CLAVE) ?? 'null');
    if (!d || typeof d !== 'object') return progresoVacio();
    const p = progresoVacio();
    if (entero(d.actual, 1, TOTAL_NIVELES)) p.actual = d.actual;
    if (Array.isArray(d.resueltos)) p.resueltos = d.resueltos.filter((n: unknown) => entero(n, 1, TOTAL_NIVELES));
    if (d.mejores && typeof d.mejores === 'object') p.mejores = d.mejores;
    if (d.bitacora && typeof d.bitacora === 'object') p.bitacora = d.bitacora;
    if (entero(d.ultima, 1, TOTAL_NIVELES) && p.bitacora[d.ultima]) p.ultima = d.ultima;
    return p;
  } catch {
    return progresoVacio();
  }
}

export function guardarProgreso(p: Progreso, almacen: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage) {
  try {
    almacen?.setItem(CLAVE, JSON.stringify(p));
  } catch {
    // sin almacenamiento: el progreso dura solo esta sesión
  }
}
