/**
 * Primitivas de escena (port de S() en reference/escena.js).
 * Una escena es una lista de primitivas, cada una en una capa:
 *   ter (territorio) · red (vías) · est (estaciones) · sta (pastillas y carros) · inf (HUD, título, botones) · top (tutorial)
 * Luego src/render/svg.ts las convierte en elementos SVG.
 */
import { C, cssFuente, type Fuente } from './colores';
import type { Punto } from '../engine/equilibrio';

export type Capa = 'ter' | 'red' | 'est' | 'sta' | 'inf' | 'top';
export type Alinear = 'l' | 'c' | 'r';

interface Base {
  L: Capa;
  /** nombre (como en Figma), queda en data-n */
  n?: string;
  /** opacidad */
  o?: number;
  /** id de la vía a la que pertenece (para hacerla vibrar) */
  via?: string;
}

export interface Trazo extends Base {
  k: 'p';
  pts: Punto[];
  c: string;
  w: number;
  d?: number[] | null;
  cap?: 'b' | 'r';
  rad?: number;
}
export interface Elipse extends Base {
  k: 'e';
  x: number;
  y: number;
  r: number;
  f?: string;
  s?: string;
  sw?: number;
  /** arco [inicio, fin] en radianes (solo trazo) */
  arc?: [number, number];
}
export interface Rect extends Base {
  k: 'r';
  x: number;
  y: number;
  w: number;
  h: number;
  f?: string;
  s?: string;
  sw?: number;
  rr?: number;
}
export interface Poligono extends Base {
  k: 'g';
  pts: Punto[];
  f: string;
}
export interface Texto extends Base {
  k: 't';
  x: number;
  /** borde superior de la caja de texto (como en Figma) */
  y: number;
  v: string;
  z: number;
  f: Fuente;
  c: string;
  a: Alinear;
  ls?: number;
}
export interface Parte {
  v: string;
  z: number;
  f: Fuente;
  c: string;
}
export interface Pastilla extends Base {
  k: 'pill';
  /** centro */
  x: number;
  y: number;
  parts: Parte[];
  bg: string;
  bd: string;
  px: number;
  py: number;
  gap: number;
  /** flecha → al final (dibujada, porque la fuente latin de Barlow no trae el glifo) */
  flecha?: boolean;
}

/** Ancho de la flecha de los botones. */
export const ANCHO_FLECHA = 13;

export type Primitiva = Trazo | Elipse | Rect | Poligono | Texto | Pastilla;

type Opc<T> = Partial<Omit<T, 'k' | 'L'>>;

/** Ancho real de un texto (canvas). Sin DOM usa la aproximación de escena.js. */
const FW: Record<Fuente, number> = { EB: 0.56, B: 0.54, SB: 0.52, M: 0.5, C: 0.42, CB: 0.44 };
let ctx: CanvasRenderingContext2D | null | undefined;
export function medir(v: string, z: number, f: Fuente, ls = 0): number {
  if (ctx === undefined) ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
  const extra = ls * v.length;
  if (!ctx) return v.length * z * FW[f] + extra;
  ctx.font = cssFuente(f, z);
  return ctx.measureText(v).width + extra;
}

/** Corta un texto en líneas de ancho máximo maxW. */
export function partir(str: string, z: number, f: Fuente, maxW: number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const x of str.split(' ')) {
    const n = cur ? cur + ' ' + x : x;
    if (medir(n, z, f) > maxW && cur) {
      out.push(cur);
      cur = x;
    } else cur = n;
  }
  if (cur) out.push(cur);
  return out;
}

/** Tamaño de una pastilla (ancho, alto). */
export function medidaPastilla(p: Pick<Pastilla, 'parts' | 'px' | 'py' | 'gap' | 'flecha'>): [number, number] {
  const anchos = p.parts.map((q) => medir(q.v, q.z, q.f));
  if (p.flecha) anchos.push(ANCHO_FLECHA);
  const w = anchos.reduce((s, a) => s + a, 0) + p.gap * (anchos.length - 1) + p.px * 2;
  const h = Math.max(...p.parts.map((q) => q.z)) * 1.2 + p.py * 2;
  return [w, h];
}

/** Número con coma decimal: 83.8 → «83,8», 60 → «60». */
export function nf(v: number): string {
  const r = Math.round(v * 10) / 10;
  return (Number.isInteger(r) ? String(r) : r.toFixed(1)).replace('.', ',');
}

/** Miles con punto: 6000 → «6.000». */
export function miles(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export const dos = (n: number) => String(n).padStart(2, '0');

/** Largo de cada segmento de la polilínea y el índice del más largo. */
export function segmentos(pts: Punto[]) {
  let L = 0;
  let best = 0;
  let bi = 0;
  const s: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    s.push(l);
    if (l > best) {
      best = l;
      bi = i;
    }
    L += l;
  }
  return { s, bi, L };
}

/** Punto a la fracción t del segmento i. */
export function enSegmento(pts: Punto[], i: number, t: number): Punto {
  const a = pts[i];
  const b = pts[i + 1];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Constructor de escenas (mismos métodos que S() de escena.js). */
export class Escena {
  readonly w = 1440;
  readonly h = 900;
  readonly bg = C.tierra;
  readonly it: Primitiva[] = [];
  constructor(readonly name: string) {}

  private add<T extends Primitiva>(o: T): T {
    this.it.push(o);
    return o;
  }
  p(L: Capa, pts: Punto[], c: string, w: number, o: Opc<Trazo> = {}) {
    return this.add<Trazo>({ k: 'p', L, pts, c, w, ...o });
  }
  e(L: Capa, x: number, y: number, r: number, o: Opc<Elipse> = {}) {
    return this.add<Elipse>({ k: 'e', L, x, y, r, ...o });
  }
  r(L: Capa, x: number, y: number, w: number, h: number, o: Opc<Rect> = {}) {
    return this.add<Rect>({ k: 'r', L, x, y, w, h, ...o });
  }
  g(L: Capa, pts: Punto[], f: string, o: Opc<Poligono> = {}) {
    return this.add<Poligono>({ k: 'g', L, pts, f, ...o });
  }
  t(L: Capa, x: number, y: number, v: string, z: number, f: Fuente, c: string, o: Opc<Texto> = {}) {
    return this.add<Texto>({ k: 't', L, x, y, v, z, f, c, a: 'l', ...o });
  }
  pill(L: Capa, x: number, y: number, parts: Parte[], o: Opc<Pastilla> = {}) {
    return this.add<Pastilla>({ k: 'pill', L, x, y, parts, bg: C.blanco, bd: C.borde, px: 9, py: 4, gap: 3, ...o });
  }
  /** texto en varias líneas */
  tw(L: Capa, x: number, y: number, v: string, z: number, f: Fuente, c: string, maxW: number, lh: number, o: Opc<Texto> = {}) {
    partir(v, z, f, maxW).forEach((l, i) => this.t(L, x, y + i * lh, l, z, f, c, o));
  }
}
