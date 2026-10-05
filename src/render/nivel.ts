/**
 * Dibuja un NIVEL a partir de sus datos y del estado actual (port de nivel() en reference/escena.js).
 * A diferencia de escena.js, los minutos y carros salen del motor en vivo, no de t0/x0.
 */
import type { NombreIcono } from '../ui/iconos';
import { AIRE, TAM } from '../ui/escala';
import { C, colorLinea, type Fuente } from './colores';
import { hud } from './hud';
import { filaBotones } from './piezas';
import { titulo } from './titulo';
import { Escena, enSegmento, medidaPastilla, medir, miles, segmentos, dos, type Alinear, type Capa } from './primitivas';
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
  /** al ganar, mostrar el botón «Ver bitácora» (no en el tutorial) */
  verBitacora?: boolean;
}

const RADIO = 22;

/** Minutos enteros de una pastilla; primero a un decimal, como el HUD (21,4999 → 21,5 → 22). */
const minutos = (t: number) => Math.round(Math.round(t * 10) / 10);

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
  const etiquetas: Record<string, { x: number; y: number; a: Alinear }> = {};
  // origen y destino de los grupos: llevan su ícono junto al nombre de la estación
  const origenes = new Set(lv.groups.map((g) => g.from));
  const destinos = new Set(lv.groups.map((g) => g.to).filter((id) => !origenes.has(id)));
  const nombre = (id: string, x: number, y: number, label: string, a: Alinear) => {
    s.t('est', x, y, label, 12, 'CB', C.tinta, { a, ls: 0.8 });
    const rol = origenes.has(id) ? 'origen' : destinos.has(id) ? 'destino' : null;
    // nombre a la izquierda del punto → ícono antes; a la derecha → después (así no tapa la estación)
    if (rol) iconoJunto(s, 'est', x, y, label, 12, 'CB', 0.8, a, rol, TAM.s, a === 'l' || (a === 'c' && rol === 'destino') ? 'despues' : 'antes');
  };
  for (const [id, n] of Object.entries(lv.nodes)) {
    const nm = 'nodo:' + id;
    const label = n.label.toUpperCase();
    if (n.kind === 'bar') {
      const y1 = n.y1 ?? n.y;
      const y2 = n.y2 ?? n.y;
      s.r('est', n.x - 12, y1, 24, y2 - y1, { f: C.tinta, rr: 12, n: nm });
      nombre(id, n.x, y1 - (origenes.has(id) ? 56 : 44), label, 'c');
    } else if (n.kind === 'capsule') {
      s.r('est', n.x - 15, n.y - 56, 30, 112, { f: C.blanco, s: C.tinta, sw: 4, rr: 15, n: nm });
      nombre(id, n.x, n.y - 84, label, 'c');
    } else if (n.kind === 'terminal') {
      s.e('est', n.x, n.y, 15, { f: C.tinta, n: nm });
      s.e('est', n.x, n.y, 6, { f: C.blanco });
      const a = n.x < 400 ? 'r' : n.x > 1040 ? 'l' : 'c';
      const lx = a === 'r' ? n.x - 26 : a === 'l' ? n.x + 26 : n.x;
      const ly = a === 'c' ? n.y - (origenes.has(id) ? 56 : 44) : n.y - 16;
      nombre(id, lx, ly, label, a);
      etiquetas[id] = { x: lx, y: ly, a };
    } else {
      s.e('est', n.x, n.y, 11, { f: C.blanco, s: C.tinta, sw: 4, n: nm });
      const arriba = n.y < 500;
      nombre(id, n.x, arriba ? n.y - 36 : n.y + 22, label, 'c');
    }
  }
  // carros que salen de cada origen (con el ícono de carros antes del texto)
  const porOrigen: Record<string, number> = {};
  for (const g of lv.groups) porOrigen[g.from] = (porOrigen[g.from] ?? 0) + g.cars;
  for (const [id, cs] of Object.entries(porOrigen)) {
    const n = lv.nodes[id];
    const txt = miles(cs) + ' carros';
    const e = etiquetas[id];
    const grupo = (x: number, y: number, a: Alinear) => {
      // alineado a la izquierda, el texto se corre para dejarle sitio al ícono
      const xt = a === 'l' ? x + TAM.s + AIRE : a === 'c' ? x + (TAM.s + AIRE) / 2 : x;
      s.t('inf', xt, y, txt, 11, 'M', C.sec, { a, n: 'grupo' });
      iconoJunto(s, 'inf', xt, y, txt, 11, 'M', 0, a, 'carros', TAM.s, 'antes');
    };
    if (n.kind === 'bar') grupo(n.x, (n.y1 ?? n.y) - 28, 'c');
    else if (e) grupo(e.x, e.y + 24, e.a);
    else s.pill('inf', n.x, n.y + (n.y < 500 ? -64 : 64), [{ v: '+' + txt, z: 11, f: 'SB', c: C.blanco }], { bg: C.tinta, bd: C.tinta, ico: 'carros', tamIco: TAM.s, gap: AIRE, n: 'grupo' });
  }
}

/** Pone un ícono antes o después de un texto ya dibujado (x, y = posición del texto, como en s.t). */
function iconoJunto(s: Escena, L: Capa, x: number, y: number, v: string, z: number, f: Fuente, ls: number, a: Alinear, icono: NombreIcono, tam: number, lado: 'antes' | 'despues') {
  const w = medir(v, z, f, ls);
  const izq = a === 'l' ? x : a === 'r' ? x - w : x - w / 2;
  const cx = lado === 'antes' ? izq - AIRE - tam / 2 : izq + w + AIRE + tam / 2;
  s.i(L, cx, y + z * 0.62, icono, tam);
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
  /** lo que oye un lector de pantalla al llegar a la vía con el teclado */
  etiqueta: string;
}

const NOMBRE_LINEA: Record<string, string> = { amarilla: 'amarilla', naranja: 'naranja', azul: 'azul', lila: 'lila', cafe: 'café', cian: 'cian' };

/** «Vía angosta amarilla de Portal Usme a Av. Jiménez, abierta, 60 min» */
export function etiquetaVia(lv: Nivel, l: Via, abierta: boolean, t: number): string {
  const tramo = `de ${lv.nodes[l.from]?.label ?? l.from} a ${lv.nodes[l.to]?.label ?? l.to}`;
  const que = l.kind === 'cable' ? `Cable ${tramo}` : `Vía ${l.kind} ${l.line ? NOMBRE_LINEA[l.line] + ' ' : ''}${tramo}`;
  if (l.locked) return `${que}, en obra: no se toca`;
  const genero = l.kind === 'cable' ? 'o' : 'a';
  return abierta ? `${que}, abiert${genero}, ${minutos(t)} min` : `${que}, cerrad${genero}`;
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
    vias.push({ id: l.id, pts: l.pts, rad: l.kind === 'cable' ? 0 : RADIO, abierta: abierta(l), locked: l.locked, t, x: v.x[l.id] ?? 0, pastilla: m, etiqueta: etiquetaVia(lv, l, abierta(l), t) });
    if (!abierta(l)) continue;
    const caliente = l.kind === 'angosta' && t - l.a >= 20;
    const cable = l.kind === 'cable';
    const cc = cable ? C.cableTexto : caliente ? C.rojo : C.tinta;
    s.pill(
      'sta',
      m[0],
      m[1],
      [
        { v: String(minutos(t)), z: 14, f: 'B', c: cc },
        { v: 'min', z: 9, f: 'M', c: cable ? C.cableTexto : caliente ? C.rojo : C.sec },
      ],
      { bd: cable ? C.cable : caliente ? C.rojo : C.borde, n: 'costo:' + l.id },
    );
    if (l.locked) s.pill('inf', m[0] - 120, m[1] + 20, [{ v: 'Obra · no se toca', z: 11, f: 'SB', c: C.blanco }], { bg: C.tinta, bd: C.tinta, ico: 'obra', tamIco: TAM.s, gap: AIRE, n: 'obra' });
  }

  titulo(s, lv);
  hud(s, { total: v.total, optimo: lv.optimo, inicio: lv.start, resuelto: v.resuelto, toques: v.toques });

  // píldora negra: solo cuando aparece algo nuevo
  if (lv.msg && !v.resuelto) {
    const partes = [{ v: lv.msg, z: 13, f: 'SB' as const, c: C.blanco }];
    const [w] = medidaPastilla({ parts: partes, px: 12, py: 7, gap: 3 });
    s.pill('inf', 40 + w / 2, 114, partes, { bg: C.tinta, bd: C.tinta, px: 12, py: 7, n: 'mensaje' });
  }

  // selector «Hora valle | Hora pico»: las pastillas muestran la fase elegida
  const x0 = 560;
  if (lv.phases && !v.resuelto) {
    const pico = v.fase === lv.phases.length - 1;
    s.r('inf', x0, 38, 200, 34, { f: C.blanco, s: C.borde, sw: 1, rr: 17, n: 'fases' });
    s.r('inf', pico ? x0 + 100 : x0 + 3, 41, 97, 28, { f: C.tinta, rr: 14 });
    s.t('inf', x0 + 50, 47, 'Hora valle', 12, 'SB', pico ? C.sec : C.blanco, { a: 'c', n: 'fase:valle' });
    s.t('inf', x0 + 148, 47, 'Hora pico', 12, 'SB', pico ? C.blanco : C.sec, { a: 'c', n: 'fase:pico' });
    // zonas para tocar cada mitad (la fase 0 es valle, la última es pico)
    s.r('inf', x0, 38, 100, 34, { rr: 17, n: 'btn:fase-0' });
    s.r('inf', x0 + 100, 38, 100, 34, { rr: 17, n: `btn:fase-${lv.phases.length - 1}` });
  }
  // tope de toques: los círculos se llenan con cada toque
  if (lv.toques && !v.resuelto) {
    const xt = lv.phases ? x0 + 212 : x0;
    s.r('inf', xt, 38, 58 + lv.toques * 16, 34, { f: C.blanco, s: C.borde, sw: 1, rr: 17, n: 'toques' });
    s.t('inf', xt + 14, 49, 'TOQUES', 10, 'CB', C.sec, { ls: 1 });
    for (let k = 0; k < lv.toques; k++) s.e('inf', xt + 56 + k * 16, 55, 5, { s: C.tinta, sw: 2, f: k < v.toques ? C.tinta : C.blanco, n: 'toque:' + (k < v.toques ? 'usado' : 'libre') });
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
    // un ícono antes de cada muestra de línea (Figma actualizado)
    const ICONO_LEYENDA: Record<string, NombreIcono> = { ancha: 'via_abierta', angosta: 'carros', cerrada: 'via_cerrada', cable: 'atajo', obra: 'obra' };
    const PASO = 196;
    const W = lv.legend.length * PASO + 24;
    const x0 = 720 - W / 2;
    s.r('inf', x0, 822, W, 36, { f: C.blanco, s: C.borde, sw: 1, rr: 18, n: 'leyenda' });
    lv.legend.forEach((k, i) => {
      const xi = x0 + 16 + i * PASO;
      const y = 840;
      if (ICONO_LEYENDA[k]) s.i('inf', xi + TAM.s / 2, y, ICONO_LEYENDA[k], TAM.s);
      const x = xi + TAM.s + AIRE;
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
  if (v.resuelto && v.verBitacora) filaBotones(s, 'inf', [{ v: 'Ver bitácora', btn: 'bitacora', estilo: 'negro', icono: 'optimo' }], 720, 836, 'c');
  return { escena: s, vias };
}

