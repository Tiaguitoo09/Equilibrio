/**
 * Tutorial de 4 pasos del nivel 01 (port de tutorial() en reference/tutorial_y_cargas.js).
 * Se dibuja encima del nivel de verdad: un velo oscuro, copias "levantadas" de lo que se explica y una tarjeta.
 * Diferencia con la referencia: en el paso 4 el HUD conserva sus colores (allá quedaba blanco sobre blanco).
 */
import type { Nivel } from '../engine/equilibrio';
import { C } from '../render/colores';
import type { InfoVia } from '../render/nivel';
import { velo } from '../render/piezas';
import { Escena, medidaPastilla, partir, type Primitiva } from '../render/primitivas';
import type { NombreIcono } from '../ui/iconos';
import { activarBotones, el, elemento, trazoRedondeado, type Capas } from '../render/svg';

export const PASOS_TUTORIAL = 4;

interface Paso {
  titulo: string;
  texto: string;
  boton: string;
  /** ícono al lado del título (24 px) */
  icono: NombreIcono;
  /** ícono del botón: antes («Jugar») o después («Siguiente») del texto */
  icoBoton?: { ico?: NombreIcono; icoFin?: NombreIcono };
  /** centro x y borde superior de la tarjeta */
  cx: number;
  y: number;
}

const PASOS: Paso[] = [
  { titulo: 'Estos son los carros', texto: 'Salen de Portal Usme y todos quieren llegar a Av. Jiménez lo más rápido posible.', boton: 'Siguiente', icono: 'carros', icoBoton: { icoFin: 'siguiente' }, cx: 720, y: 560 },
  { titulo: 'Cada vía dice cuánto se demora', texto: 'Esta vía es angosta: entre más carros, más lenta. Hoy van todos por aquí y se demoran 60 min.', boton: 'Siguiente', icono: 'tiempo', icoBoton: { icoFin: 'siguiente' }, cx: 720, y: 420 },
  { titulo: 'Toca una vía para abrirla', texto: 'La vía de abajo está cerrada. Es ancha: siempre se demora 45 min y no se llena. Tócala.', boton: 'Ya la toqué', icono: 'via_abierta', cx: 720, y: 420 },
  { titulo: '¡Bajó de 60 a 45!', texto: 'Los carros se repartieron solos. Cuando TOTAL llega a ÓPTIMO, la ciudad está en equilibrio.', boton: 'Jugar', icono: 'optimo', icoBoton: { ico: 'jugar' }, cx: 1060, y: 190 },
];

/** Tarjeta del tutorial (coach() de la referencia). */
function tarjeta(s: Escena, paso: number, p: Paso) {
  const W = 400;
  const lineas = partir(p.texto, 14, 'M', W - 48);
  const H = 140 + lineas.length * 20;
  const x = Math.max(40, Math.min(1440 - W - 40, p.cx - W / 2));
  const y = p.y;
  s.r('top', x, y, W, H, { f: C.blanco, rr: 18, n: 'tutorial:tarjeta' });
  for (let i = 0; i < PASOS_TUTORIAL; i++) s.e('top', x + 28 + i * 16, y + 28, 4, { f: i < paso ? C.tinta : C.borde });
  s.t('top', x + W - 24, y + 20, `PASO ${paso} DE ${PASOS_TUTORIAL}`, 10, 'CB', C.sec, { a: 'r', ls: 1.2 });
  s.i('top', x + 24 + 12, y + 46 + 14, p.icono, 24);
  s.t('top', x + 24 + 32, y + 46, p.titulo, 22, 'B', C.tinta, { n: 'tutorial:titulo' });
  lineas.forEach((l, i) => s.t('top', x + 24, y + 80 + i * 20, l, 14, 'M', C.sec));
  const boton = { parts: [{ v: p.boton, z: 14, f: 'SB' as const, c: C.blanco }], px: 18, py: 9, gap: 6, tamIco: 16, ...p.icoBoton };
  const [w] = medidaPastilla(boton);
  s.pill('top', x + W - 24 - w / 2, y + H - 28, boton.parts, { ...boton, bg: C.tinta, bd: C.tinta, n: 'btn:siguiente' });
  s.t('top', x + 24, y + H - 36, 'Saltar', 13, 'SB', C.sec);
  s.r('top', x + 12, y + H - 46, 70, 36, { n: 'btn:saltar' });
}

/** Dedo que indica dónde tocar. */
function dedo(s: Escena, x: number, y: number) {
  s.e('top', x, y, 30, { s: C.blanco, sw: 3, o: 0.6, n: 'tap:onda' });
  s.e('top', x, y, 18, { f: C.blanco, o: 0.95, n: 'tap' });
  s.e('top', x, y, 7, { f: C.tinta });
}

const empieza = (i: Primitiva, p: string) => !!i.n && i.n.startsWith(p);
const pos = (i: Primitiva): [number, number] | null => (i.k === 'p' || i.k === 'g' ? null : [i.x, i.y]);

/**
 * Dibuja el paso (1 a 4) en la capa top.
 * @param escena la escena del nivel ya pintada (de ahí se "levantan" las piezas)
 */
export function dibujarTutorial(paso: number, nivel: Nivel, escena: Escena, capas: Capas, vias: InfoVia[]) {
  const p = PASOS[paso - 1];
  const sola = nivel.solucion[0]; // la vía que se abre en el paso 3
  const costo = escena.it.find((i) => i.n === 'costo:' + nivel.links.find((l) => l.open)!.id);
  const xi = escena.it.findIndex((i) => i.n === 'x:' + sola);

  let levantar: (i: Primitiva, k: number) => boolean;
  let blanquear = true;
  let conCarros = false;
  if (paso === 1) {
    levantar = (i) => (empieza(i, 'via:') && !i.n!.includes('(cerrada)')) || empieza(i, 'costo:') || empieza(i, 'nodo:') || (i.L === 'est' && i.k !== 'r') || i.n === 'grupo';
    conCarros = true;
  } else if (paso === 2) levantar = (i) => i === costo;
  // la vía cerrada, su círculo y las dos rayas de la X
  else if (paso === 3) levantar = (i, k) => i.n === `via:${sola} (cerrada)` || (k >= xi && k <= xi + 2);
  else {
    // el HUD (arriba a la derecha) con sus colores
    levantar = (i) => {
      const q = pos(i);
      return i.L === 'inf' && !!q && q[0] >= 1070 && q[1] < 170;
    };
    blanquear = false;
  }

  const s = new Escena('tutorial');
  velo(s, 'tutorial:velo');
  const top = capas.top;
  for (const it of s.it) top.append(elemento(it));
  s.it.length = 0;

  // copias levantadas, en el mismo orden de la escena; los carros van justo encima de las vías
  let carrosPuestos = !conCarros;
  escena.it.forEach((i, k) => {
    if (i.L === 'top' || i.L === 'ter' || !levantar(i, k)) return;
    if (!carrosPuestos && i.L !== 'red') {
      top.append(capas.carros);
      carrosPuestos = true;
    }
    top.append(elemento({ ...i, L: 'top', ...(blanquear && i.k === 't' ? { c: C.blanco } : {}) } as Primitiva));
  });
  if (!carrosPuestos) top.append(capas.carros);

  if (paso === 2 && costo && costo.k === 'pill') s.e('top', costo.x, costo.y, 42, { s: C.blanco, sw: 2, o: 0.8 });
  if (paso === 3) {
    const v = vias.find((q) => q.id === sola);
    if (v) {
      dedo(s, v.pastilla[0] + 18, v.pastilla[1] + 16);
      // la vía cerrada se puede tocar a través del velo
      top.append(
        el('path', {
          d: trazoRedondeado(v.pts, v.rad),
          class: 'toque',
          'data-tocar': v.id,
          fill: 'none',
          stroke: 'transparent',
          'stroke-width': 30,
          'stroke-linecap': 'round',
          role: 'button',
          tabindex: 0,
          'aria-label': v.etiqueta,
        }),
      );
    }
  }
  tarjeta(s, paso, p);
  for (const it of s.it) top.append(elemento(it));
  activarBotones(top);
  top.querySelector('[data-btn="saltar"]')?.setAttribute('aria-label', 'Saltar');
}
