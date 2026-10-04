/**
 * Motor de Equilibrio — equilibrio de Wardrop (paradoja de Braess).
 *
 * Modelo (el mismo con el que se calcularon y verificaron los 15 niveles):
 *   costo de un tramo (min) = a + b * x        x = carros que lo usan
 *   ancha   -> b = 0   (tiempo fijo, no se llena)
 *   angosta -> b = 1/k (el tiempo crece con los carros)
 *   cable   -> atajo, normalmente a = 0, b = 0
 *
 * Cada grupo de carros va de `from` a `to`. En el equilibrio de Wardrop todos los
 * carros de un grupo usan solo rutas de costo mínimo (nadie gana cambiándose de ruta).
 * TOTAL = promedio de minutos por carro (ponderado por carros y, si hay, por fase).
 *
 * Es una función pura: sin DOM, sin estado. Se puede probar con `npm test`.
 */

export type Tipo = 'ancha' | 'angosta' | 'cable';
export type Punto = [number, number];

export interface Via {
  id: string;
  from: string;
  to: string;
  kind: Tipo;
  a: number;
  b: number;
  k: number | null;
  open: boolean; // abierta al empezar el nivel
  locked: boolean; // obra: no se puede tocar
  both: boolean; // transitable en los dos sentidos (algunos cables)
  line: string | null; // identidad de color: amarilla, naranja, azul, lila, cafe, cian
  pts: Punto[]; // geometría en el lienzo 1440x900
  t0: number | null; // minutos mostrados al empezar (fase pico si hay fases)
  x0: number; // carros al empezar
  t1: number | null; // minutos en la solución
  x1: number;
  open_solved: boolean; // estado de la vía en la solución óptima
}

export interface Grupo {
  from: string;
  to: string;
  cars: number;
}

export interface Fase {
  name: string; // 'Hora valle' | 'Hora pico'
  factor: number; // multiplica los carros de todos los grupos
}

export interface Nodo {
  x: number;
  y: number;
  label: string;
  kind: 'terminal' | 'station' | 'bar' | 'capsule';
  y1?: number; // solo 'bar'
  y2?: number;
}

export interface Nivel {
  num: number;
  name: string;
  block: 1 | 2 | 3; // 1 Fácil, 2 Intermedio, 3 Difícil
  nodes: Record<string, Nodo>;
  groups: Grupo[];
  links: Via[];
  msg: string | null; // mensaje negro: solo cuando aparece algo nuevo
  legend: string[] | null; // leyenda: solo en los niveles 01, 03 y 10
  start: number; // TOTAL inicial
  optimo: number; // ÓPTIMO
  cambios: number; // toques mínimos para llegar al óptimo
  solucion: string[]; // ids de vías que hay que alternar (abrir/cerrar)
  lineas: number;
  cables: number;
  grupos: number;
  phases?: Fase[];
  toques?: number; // tope de toques (si no existe, ilimitado)
}

export interface Resultado {
  /** minutos promedio por carro en esta fase */
  promedio: number;
  /** carros por vía */
  x: Record<string, number>;
  /** minutos por vía */
  t: Record<string, number>;
  /** minutos de cada grupo (mismo orden que nivel.groups) */
  tiempoGrupo: number[];
}

export interface Puntaje {
  /** TOTAL: promedio ponderado por carros de todas las fases */
  promedio: number;
  fases: Resultado[];
}

/** Tolerancia para decir "TOTAL = ÓPTIMO" (los niveles se verificaron con 0.3). */
export const TOLERANCIA = 0.3;

/** Estado inicial: ids de vías abiertas al empezar. */
export function abiertasIniciales(nivel: Nivel): Set<string> {
  return new Set(nivel.links.filter((l) => l.open).map((l) => l.id));
}

/** Alterna una vía. Devuelve un Set nuevo (no muta). Las obras no se pueden tocar. */
export function alternar(nivel: Nivel, abiertas: Set<string>, id: string): Set<string> {
  const via = nivel.links.find((l) => l.id === id);
  if (!via || via.locked) return abiertas;
  const s = new Set(abiertas);
  if (s.has(id)) s.delete(id);
  else s.add(id);
  return s;
}

/** Todas las rutas simples (sin repetir nodos) de s a t usando solo vías abiertas. */
export function caminos(links: Via[], abiertas: Set<string>, s: string, t: string): number[][] {
  const ady = new Map<string, { to: string; i: number }[]>();
  const poner = (from: string, to: string, i: number) => {
    const arr = ady.get(from);
    if (arr) arr.push({ to, i });
    else ady.set(from, [{ to, i }]);
  };
  links.forEach((l, i) => {
    if (!abiertas.has(l.id)) return;
    poner(l.from, l.to, i);
    if (l.both) poner(l.to, l.from, i);
  });
  const salida: number[][] = [];
  const vistos = new Set<string>([s]);
  const ruta: number[] = [];
  const dfs = (n: string) => {
    if (n === t) {
      salida.push([...ruta]);
      return;
    }
    for (const e of ady.get(n) ?? []) {
      if (vistos.has(e.to)) continue;
      vistos.add(e.to);
      ruta.push(e.i);
      dfs(e.to);
      ruta.pop();
      vistos.delete(e.to);
    }
  };
  dfs(s);
  return salida;
}

/** Proyección de v sobre el simplex {x >= 0, sum x = z}. */
function proyectarSimplex(v: number[], z: number): number[] {
  if (z <= 0) return v.map(() => 0);
  const u = [...v].sort((p, q) => q - p);
  let css = 0;
  let th = 0;
  for (let i = 0; i < u.length; i++) {
    css += u[i];
    const t = (css - z) / (i + 1);
    if (u[i] - t > 0) th = t;
  }
  return v.map((x) => Math.max(x - th, 0));
}

/**
 * Equilibrio de Wardrop para UNA fase.
 * Devuelve null si algún grupo se queda sin ninguna ruta abierta
 * (en el juego: ese toque no se permite).
 */
export function equilibrio(
  nivel: Pick<Nivel, 'links' | 'groups'>,
  abiertas: Set<string>,
  factor = 1,
  maxIter = 20000,
  tol = 1e-6,
): Resultado | null {
  const { links, groups } = nivel;
  const nL = links.length;
  const a = links.map((l) => l.a);
  const b = links.map((l) => l.b);

  // rutas de todos los grupos
  const rutas: number[][] = [];
  const grupoDe: number[] = [];
  for (let g = 0; g < groups.length; g++) {
    const ps = caminos(links, abiertas, groups[g].from, groups[g].to);
    if (ps.length === 0) return null;
    for (const p of ps) {
      rutas.push(p);
      grupoDe.push(g);
    }
  }
  const nP = rutas.length;
  const porGrupo: number[][] = groups.map(() => []);
  grupoDe.forEach((g, j) => porGrupo[g].push(j));
  const dem = groups.map((g) => g.cars * factor);
  const demTotal = dem.reduce((p, q) => p + q, 0);

  const flujoVia = (f: number[]) => {
    const x = new Array<number>(nL).fill(0);
    for (let j = 0; j < nP; j++) if (f[j] !== 0) for (const l of rutas[j]) x[l] += f[j];
    return x;
  };
  const gradiente = (f: number[]) => {
    const x = flujoVia(f);
    const c = x.map((xi, i) => a[i] + b[i] * xi);
    return rutas.map((p) => p.reduce((s, l) => s + c[l], 0));
  };

  // constante de Lipschitz: mayor autovalor de D' diag(b) D, por iteración de potencias
  let Lc = 1e-9;
  {
    let v = new Array<number>(nP).fill(1);
    for (let it = 0; it < 60; it++) {
      const x = flujoVia(v).map((xi, i) => b[i] * xi);
      const w = rutas.map((p) => p.reduce((s, l) => s + x[l], 0));
      const nrm = Math.sqrt(w.reduce((s, q) => s + q * q, 0));
      if (nrm < 1e-12) break;
      Lc = Math.max(Lc, nrm / Math.sqrt(v.reduce((s, q) => s + q * q, 0)));
      v = w.map((q) => q / nrm);
    }
    Lc *= 1.02;
  }

  // gradiente proyectado acelerado (FISTA)
  let f = new Array<number>(nP).fill(0);
  porGrupo.forEach((J, g) => J.forEach((j) => (f[j] = dem[g] / J.length)));
  let y = [...f];
  let tk = 1;
  for (let it = 0; it < maxIter; it++) {
    const g = gradiente(y);
    const fn = y.map((yi, j) => yi - g[j] / Lc);
    porGrupo.forEach((J, gi) => {
      const proy = proyectarSimplex(
        J.map((j) => fn[j]),
        dem[gi],
      );
      J.forEach((j, q) => (fn[j] = proy[q]));
    });
    const tn = (1 + Math.sqrt(1 + 4 * tk * tk)) / 2;
    y = fn.map((v, j) => v + ((tk - 1) / tn) * (v - f[j]));
    f = fn;
    tk = tn;
    if (it % 200 === 0) {
      const pc = gradiente(f);
      let gap = 0;
      porGrupo.forEach((J, gi) => {
        let min = Infinity;
        let s = 0;
        for (const j of J) {
          s += f[j] * pc[j];
          if (pc[j] < min) min = pc[j];
        }
        gap += s - dem[gi] * min;
      });
      if (gap < tol * Math.max(1, demTotal)) break;
    }
  }

  const x = flujoVia(f);
  const c = x.map((xi, i) => a[i] + b[i] * xi);
  const pc = rutas.map((p) => p.reduce((s, l) => s + c[l], 0));
  const tiempoGrupo = porGrupo.map((J, gi) => (dem[gi] > 0 ? J.reduce((s, j) => s + f[j] * pc[j], 0) / dem[gi] : 0));
  const promedio = demTotal > 0 ? porGrupo.reduce((s, J, gi) => s + tiempoGrupo[gi] * dem[gi], 0) / demTotal : 0;
  const rx: Record<string, number> = {};
  const rt: Record<string, number> = {};
  links.forEach((l, i) => {
    rx[l.id] = x[i];
    rt[l.id] = c[i];
  });
  return { promedio, x: rx, t: rt, tiempoGrupo };
}

/** Puntaje de un estado (todas las fases). null = algún grupo sin ruta. */
export function puntaje(nivel: Nivel, abiertas: Set<string>): Puntaje | null {
  const fases = nivel.phases ?? [{ name: 'Normal', factor: 1 }];
  let tot = 0;
  let w = 0;
  const out: Resultado[] = [];
  for (const ph of fases) {
    const r = equilibrio(nivel, abiertas, ph.factor);
    if (!r) return null;
    const cars = nivel.groups.reduce((s, g) => s + g.cars, 0) * ph.factor;
    tot += r.promedio * cars;
    w += cars;
    out.push(r);
  }
  return { promedio: tot / w, fases: out };
}

/** ¿TOTAL = ÓPTIMO? */
export function enEquilibrio(nivel: Nivel, total: number): boolean {
  return total <= nivel.optimo + TOLERANCIA;
}

/**
 * Busca por fuerza bruta la mejor combinación de toques (para verificar niveles).
 * Si el nivel tiene tope de toques lo respeta.
 */
export function resolver(nivel: Nivel, maxCambios = 4, soloCables = false) {
  const ini = abiertasIniciales(nivel);
  const candidatas = nivel.links.filter((l) => !l.locked && (!soloCables || l.kind === 'cable')).map((l) => l.id);
  const lim = Math.min(maxCambios, nivel.toques ?? maxCambios);
  const inicio = puntaje(nivel, ini)!;
  let mejor = { promedio: inicio.promedio, cambios: 0, toques: [] as string[] };
  const combina = (desde: number, elegidas: string[]) => {
    if (elegidas.length > 0) {
      const s = new Set(ini);
      for (const id of elegidas) s.has(id) ? s.delete(id) : s.add(id);
      const r = puntaje(nivel, s);
      if (r && r.promedio < mejor.promedio - TOLERANCIA) mejor = { promedio: r.promedio, cambios: elegidas.length, toques: [...elegidas] };
    }
    if (elegidas.length === lim) return;
    for (let i = desde; i < candidatas.length; i++) combina(i + 1, [...elegidas, candidatas[i]]);
  };
  combina(0, []);
  return { inicio: inicio.promedio, mejor };
}
