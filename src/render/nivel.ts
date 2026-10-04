/**
 * Dibuja un NIVEL a partir de sus datos y del estado actual (port de nivel() en reference/escena.js).
 * A diferencia de escena.js, los minutos y carros salen del motor en vivo, no de t0/x0.
 */
import { C, colorLinea } from './colores';
import { hud } from './hud';
import { titulo } from './titulo';
import { Escena, enSegmento, medidaPastilla, medir, miles, segmentos, dos } from './primitivas';
import type { Nivel, Punto, Via } from '../engine/equilibrio';

/** Lo que el renderizador necesita saber del estado del nivel. */
export interface VistaNivel {
  abiertas: Set<string>;
  /** minutos por vía en la fase mostrada */
  t: Record<string, number>;
  /** carros por vía en la fase mostrada */
  x: Record<string, number>;
  total: number;
  resuelto: boolean;
  toques: number;
  /** índice de la fase mostrada (en niveles con hora pico) */
  fase: number;
}

const RADIO = 22;

/** Fondo de ciudad: agua en dos esquinas y algunos parques. */
export function territorio(s: Escena, seed: number, np = 2) {
  s.g('ter', [[1150, 0], [1440, 0], [1440, 190]], C.agua, { n: 'agua' });
  s.g('ter', [[0, 680], [0, 900], [290, 900]], C.agua, { n: 'agua' });
  const P = [
    [300, 410, 130, 80],
    [1000, 560, 120, 70],
    [560, 560, 100, 60],
    [860, 370, 110, 70],
    [1120, 780, 130, 70],
  ];
  for (let i = 0; i < np; i++) {
    const q = P[(seed + i * 2) % P.length];
    s.r('ter', q[0], q[1], q[2], q[3], { f: C.parque, rr: 8, n: 'parque' });
  }
}

/** Una vía en una de tres pasadas (0 anchas y cerradas, 1 angostas, 2 cables y obras), para que se superpongan bien. */
function dibujarVia(s: Escena, l: Via, abierta: boolean, pasada: number) {
  const col = colorLinea(l.line);
  const pts = l.pts;
  const nm = 'via:' + l.id;
  const via = l.id;
  if (!abierta) {
    if (pasada !== 0) return;
    s.p('red', pts, C.cerrada, 4, { d: [8, 8], n: nm + ' (cerrada)', rad: RADIO, via });
    const g = segmentos(pts);
    const m = enSegmento(pts, g.bi, 0.5);
    s.e('red', m[0], m[1], 11, { f: C.blanco, s: C.cerrada, sw: 2, n: 'x:' + l.id, via });
    s.p('red', [[m[0] - 4, m[1] - 4], [m[0] + 4, m[1] + 4]], C.sec, 2, { via });
    s.p('red', [[m[0] - 4, m[1] + 4], [m[0] + 4, m[1] - 4]], C.sec, 2, { via });
    return;
  }
  if (l.kind === 'ancha' && pasada === 0) {
    s.p('red', pts, col, 14, { n: nm, rad: RADIO, via });
    s.p('red', pts, C.blanco, 2.5, { d: [9, 9], cap: 'b', n: 'centro ancha', rad: RADIO, via });
  }
  if (l.kind === 'angosta' && pasada === 1) s.p('red', pts, col, 7, { n: nm, rad: RADIO, via });
  if (l.kind === 'cable' && pasada === 2) s.p('red', pts, C.cable, 5, { d: [0.1, 11], n: nm, via });
  if (l.locked && pasada === 2) s.p('red', pts, C.tinta, 13, { d: [2.5, 9], cap: 'b', n: 'obra (rayado)', via });
}

function estaciones(s: Escena, lv: Nivel) {
  const etiquetas: Record<string, { x: number; y: number; a: 'l' | 'c' | 'r' }> = {};
  for (const [id, n] of Object.entries(lv.nodes)) {
    const nm = 'nodo:' + id;
    const label = n.label.toUpperCase();
    if (n.kind === 'bar') {
      const y1 = n.y1 ?? n.y;
      const y2 = n.y2 ?? n.y;
      s.r('est', n.x - 12, y1, 24, y2 - y1, { f: C.tinta, rr: 12, n: nm });
      s.t('est', n.x, y1 - 44, label, 12, 'CB', C.tinta, { a: 'c', ls: 0.8 });
    } else if (n.kind === 'capsule') {
      s.r('est', n.x - 15, n.y - 56, 30, 112, { f: C.blanco, s: C.tinta, sw: 4, rr: 15, n: nm });
      s.t('est', n.x, n.y - 84, label, 12, 'CB', C.tinta, { a: 'c', ls: 0.8 });
    } else if (n.kind === 'terminal') {
      s.e('est', n.x, n.y, 15, { f: C.tinta, n: nm });
      s.e('est', n.x, n.y, 6, { f: C.blanco });
      const a = n.x < 400 ? 'r' : n.x > 1040 ? 'l' : 'c';
      const lx = a === 'r' ? n.x - 26 : a === 'l' ? n.x + 26 : n.x;
      const ly = a === 'c' ? n.y - 44 : n.y - 16;
      s.t('est', lx, ly, label, 12, 'CB', C.tinta, { a, ls: 0.8 });
      etiquetas[id] = { x: lx, y: ly, a };
    } else {
      s.e('est', n.x, n.y, 11, { f: C.blanco, s: C.tinta, sw: 4, n: nm });
      const arriba = n.y < 500;
      s.t('est', n.x, arriba ? n.y - 36 : n.y + 22, label, 12, 'CB', C.tinta, { a: 'c', ls: 0.8 });
    }
  }
  // carros que salen de cada origen
  const porOrigen: Record<string, number> = {};
  for (const g of lv.groups) porOrigen[g.from] = (porOrigen[g.from] ?? 0) + g.cars;
  for (const [id, cs] of Object.entries(porOrigen)) {
    const n = lv.nodes[id];
    const txt = miles(cs) + ' carros';
    const e = etiquetas[id];
    if (n.kind === 'bar') s.t('inf', n.x, (n.y1 ?? n.y) - 28, txt, 11, 'M', C.sec, { a: 'c', n: 'grupo' });
    else if (e) s.t('inf', e.x, e.y + 16, txt, 11, 'M', C.sec, { a: e.a, n: 'grupo' });
    else s.pill('inf', n.x, n.y + (n.y < 500 ? -64 : 64), [{ v: '+' + txt, z: 11, f: 'SB', c: C.blanco }], { bg: C.tinta, bd: C.tinta, n: 'grupo' });
  }
}

/** Datos de cada vía para tocarla y animar sus carros. */
export interface InfoVia {
  id: string;
  pts: Punto[];
  rad: number;
  abierta: boolean;
  locked: boolean;
  /** minutos y carros en la fase mostrada */
  t: number;
  x: number;
  /** centro de la pastilla de costo (los carros no pasan por debajo) */
  pastilla: Punto;
}

export function escenaNivel(lv: Nivel, v: VistaNivel): { escena: Escena; vias: InfoVia[] } {
  const s = new Escena(`Nivel ${dos(lv.num)} · ${lv.name}`);
  territorio(s, lv.num, lv.block === 3 ? 0 : 2);
  const abierta = (l: Via) => v.abiertas.has(l.id);
  for (const pasada of [0, 1, 2]) for (const l of lv.links) dibujarVia(s, l, abierta(l), pasada);
  estaciones(s, lv);

  // pastillas de costo
  const vias: InfoVia[] = [];
  for (const l of lv.links) {
    const g = segmentos(l.pts);
    const m = enSegmento(l.pts, g.bi, 0.5);
    const t = v.t[l.id] ?? 0;
    vias.push({ id: l.id, pts: l.pts, rad: l.kind === 'cable' ? 0 : RADIO, abierta: abierta(l), locked: l.locked, t, x: v.x[l.id] ?? 0, pastilla: m });
    if (!abierta(l)) continue;
    const caliente = l.kind === 'angosta' && t - l.a >= 20;
    const cable = l.kind === 'cable';
    const cc = cable ? C.cable : caliente ? C.rojo : C.tinta;
    s.pill(
      'sta',
      m[0],
      m[1],
      [
        { v: String(Math.round(t)), z: 14, f: 'B', c: cc },
        { v: 'min', z: 9, f: 'M', c: cable ? C.cable : caliente ? C.rojo : C.sec },
      ],
      { bd: cable ? C.cable : caliente ? C.rojo : C.borde, n: 'costo:' + l.id },
    );
    if (l.locked) s.pill('inf', m[0] - 120, m[1] + 20, [{ v: 'Obra · no se toca', z: 11, f: 'SB', c: C.blanco }], { bg: C.tinta, bd: C.tinta, n: 'obra' });
  }

  titulo(s, lv);
  hud(s, { total: v.total, optimo: lv.optimo, inicio: lv.start, resuelto: v.resuelto, toques: v.toques });

  // píldora negra: solo cuando aparece algo nuevo
  if (lv.msg && !v.resuelto) {
    const partes = [{ v: lv.msg, z: 13, f: 'SB' as const, c: C.blanco }];
    const [w] = medidaPastilla({ parts: partes, px: 12, py: 7, gap: 3 });
    s.pill('inf', 40 + w / 2, 114, partes, { bg: C.tinta, bd: C.tinta, px: 12, py: 7, n: 'mensaje' });
  }

  // selector de fase y tope de toques
  if (lv.phases && !v.resuelto) {
    const x0 = 560;
    const pico = v.fase === lv.phases.length - 1;
    s.r('inf', x0, 38, 200, 34, { f: C.blanco, s: C.borde, sw: 1, rr: 17, n: 'fases' });
    s.r('inf', pico ? x0 + 100 : x0 + 3, 41, 97, 28, { f: C.tinta, rr: 14 });
    s.t('inf', x0 + 50, 47, 'Hora valle', 12, 'SB', pico ? C.sec : C.blanco, { a: 'c' });
    s.t('inf', x0 + 148, 47, 'Hora pico', 12, 'SB', pico ? C.blanco : C.sec, { a: 'c' });
    if (lv.toques) {
      s.r('inf', x0 + 212, 38, 58 + lv.toques * 16, 34, { f: C.blanco, s: C.borde, sw: 1, rr: 17, n: 'toques' });
      s.t('inf', x0 + 226, 49, 'TOQUES', 10, 'CB', C.sec, { ls: 1 });
      for (let k = 0; k < lv.toques; k++) s.e('inf', x0 + 268 + k * 16, 55, 5, { s: C.tinta, sw: 2, f: k < v.toques ? C.tinta : C.blanco });
    }
  }

  // leyenda: solo donde se aprende algo (niveles 01, 03 y 10)
  if (lv.legend && !v.resuelto) {
    const items: Record<string, string> = {
      ancha: 'Ancha · fija',
      angosta: 'Angosta · se llena',
      cerrada: 'Cerrada',
      cable: 'Cable · atajo',
      obra: 'Obra · no se toca',
    };
    const W = lv.legend.length * 150 + 24;
    const x0 = 720 - W / 2;
    s.r('inf', x0, 822, W, 36, { f: C.blanco, s: C.borde, sw: 1, rr: 18, n: 'leyenda' });
    lv.legend.forEach((k, i) => {
      const x = x0 + 16 + i * 150;
      const y = 840;
      const seg: Punto[] = [[x, y], [x + 28, y]];
      if (k === 'ancha') {
        s.p('inf', seg, C.tinta, 8);
        s.p('inf', seg, C.blanco, 1.5, { d: [4, 4], cap: 'b' });
      }
      if (k === 'angosta') s.p('inf', seg, C.tinta, 4);
      if (k === 'cerrada') s.p('inf', seg, C.cerrada, 3, { d: [5, 4], cap: 'b' });
      if (k === 'cable') s.p('inf', seg, C.cable, 4, { d: [0.1, 7] });
      if (k === 'obra') {
        s.p('inf', seg, C.naranja, 6);
        s.p('inf', seg, C.tinta, 8, { d: [2, 5], cap: 'b' });
      }
      s.t('inf', x + 36, y - 8, items[k] ?? k, 12, 'M', C.tinta);
    });
  }
  return { escena: s, vias };
}

/** Ancho de la pastilla de costo de una vía (para que los carros la esquiven). */
export function anchoPastilla(t: number): number {
  return medir(String(Math.round(t)), 14, 'B') + medir('min', 9, 'M') + 3 + 18;
}
