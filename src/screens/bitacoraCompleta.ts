/**
 * Bitácora completa (port de bitacoraCompleta() en pantallas-que-faltan/reference/pantallas_nuevas.js).
 * Una fila por nivel resuelto: número, nombre, frase (data/bitacora.json), TOTAL inicial → óptimo y toques.
 * El encabezado queda fijo; la lista se desplaza con rueda, arrastre, dedo y teclado,
 * con un degradado abajo mientras haya más filas.
 */
import type { Nivel } from '../engine/equilibrio';
import { fraseDe } from '../game/bitacora';
import type { Progreso } from '../game/progreso';
import { BLOQUE, C } from '../render/colores';
import { Escena, dos, medir, nf } from '../render/primitivas';
import { el, type Capas } from '../render/svg';
import { botonRedondo } from '../ui/iconos';
import { montarEscena, type Pantalla } from './montar';

const PRIMERA = 134; // y de la primera fila
const PASO = 96; // alto de fila + separación
const TOPE = 112; // por encima de esto no se ven filas (es el encabezado)
const DEGRADADO = 90; // alto del degradado de abajo

export interface DatosBitacora {
  niveles: Nivel[];
  progreso: Progreso;
}

function resueltos({ niveles, progreso }: DatosBitacora) {
  return niveles.filter((l) => progreso.resueltos.includes(l.num));
}

/** Minutos por carro ahorrados en total: TOTAL inicial − óptimo de cada nivel resuelto. */
export function ahorroTotal(d: DatosBitacora): number {
  return resueltos(d).reduce((a, l) => a + l.start - l.optimo, 0);
}

export function escenaBitacoraCompleta(d: DatosBitacora): Escena {
  const s = new Escena('Bitácora completa');
  s.g('ter', [[1150, 0], [1440, 0], [1440, 190]], C.agua);
  s.t('inf', 104, 40, 'Bitácora del ingeniero', 32, 'B', C.tinta, { n: 'titulo' });
  s.i('inf', 104 + medir('Bitácora del ingeniero', 32, 'B') + 8 + 12, 40 + 21, 'ingeniero', 24);
  const filas = resueltos(d);
  s.t('inf', 105, 84, `${filas.length} DE 15 NIVELES · AHORRASTE ${nf(ahorroTotal(d))} MIN POR CARRO`, 11, 'CB', C.sec, { ls: 1.2, n: 'bitacora:resumen' });

  // las filas van en la capa est, que es la que se desplaza (ver pantallaBitacoraCompleta)
  filas.forEach((l, i) => {
    const y = PRIMERA + i * PASO;
    const x = 160;
    const W = 1120;
    const k = d.progreso.mejores[l.num] ?? l.cambios;
    s.r('est', x, y, W, 80, { f: C.blanco, s: C.borde, sw: 1, rr: 14, n: 'entrada:' + dos(l.num) });
    s.e('est', x + 44, y + 40, 20, { f: BLOQUE[l.block][1] });
    s.t('est', x + 44, y + 31, dos(l.num), 15, 'B', l.block === 1 ? C.tinta : C.blanco, { a: 'c' });
    s.t('est', x + 84, y + 16, l.name, 18, 'B', C.tinta);
    s.t('est', x + 84, y + 44, fraseDe(l.num), 15, 'M', C.sec);
    s.t('est', x + W - 220, y + 20, nf(l.start), 26, 'EB', C.rojo, { a: 'r' });
    s.p('est', [[x + W - 206, y + 36], [x + W - 170, y + 36]], C.tinta, 2);
    s.g('est', [[x + W - 170, y + 31], [x + W - 162, y + 36], [x + W - 170, y + 41]], C.tinta);
    s.t('est', x + W - 150, y + 20, nf(l.optimo), 26, 'EB', C.verde);
    s.t('est', x + W - 28, y + 30, `${k} toque${k === 1 ? '' : 's'}`, 12, 'SB', C.sec, { a: 'r' });
  });
  if (!filas.length) s.t('est', 160, PRIMERA, 'Todavía no has resuelto ningún nivel.', 15, 'M', C.sec);
  // degradado al color del fondo: avisa que hay más filas
  s.r('inf', 0, 900 - DEGRADADO, 1440, DEGRADADO, { f: 'url(#bitacora-degradado)', n: 'bitacora:degradado' });
  return s;
}

export function pantallaBitacoraCompleta(svg: SVGSVGElement, d: DatosBitacora, alVolver: () => void): Pantalla {
  const n = resueltos(d).length;
  const fondo = PRIMERA + n * PASO - 16 + 40; // última fila + aire
  const max = Math.max(0, fondo - 900);
  let desplaz = 0;
  let lista: SVGGElement | null = null;
  let degradado: SVGElement | null = null;

  const aplicar = () => {
    desplaz = Math.max(0, Math.min(max, desplaz));
    lista?.setAttribute('transform', `translate(0 ${-desplaz.toFixed(1)})`);
    degradado?.setAttribute('opacity', desplaz < max - 1 ? '1' : '0');
  };

  function preparar(capas: Capas) {
    capas.inf.append(botonRedondo('volver', 62, 62, 'inicio', 'Volver al inicio', { r: 22, tam: 24 }));
    // recorte (las filas no se meten bajo el encabezado) y degradado
    const defs = el('defs');
    const recorte = el('clipPath', { id: 'bitacora-recorte' });
    recorte.append(el('rect', { x: 0, y: TOPE, width: 1440, height: 900 - TOPE }));
    const grad = el('linearGradient', { id: 'bitacora-degradado', x1: 0, y1: 0, x2: 0, y2: 1 });
    grad.append(el('stop', { offset: 0, 'stop-color': C.tierra, 'stop-opacity': 0 }), el('stop', { offset: 1, 'stop-color': C.tierra, 'stop-opacity': 1 }));
    defs.append(recorte, grad);
    svg.prepend(defs);
    capas.est.setAttribute('clip-path', 'url(#bitacora-recorte)');
    lista = el('g', { 'data-n': 'bitacora:lista' });
    lista.append(...capas.est.childNodes);
    capas.est.append(lista);
    degradado = capas.inf.querySelector('[data-n="bitacora:degradado"]');
    aplicar();
  }

  const pantalla = montarEscena(svg, escenaBitacoraCompleta(d), (b) => b === 'volver' && alVolver(), preparar, '[data-btn="volver"]');

  // escala de la pantalla: cuántos px de la ventana mide una unidad del lienzo
  const escala = () => svg.getScreenCTM()?.d || 1;
  const rueda = (ev: WheelEvent) => {
    ev.preventDefault();
    desplaz += (ev.deltaMode === 1 ? ev.deltaY * 40 : ev.deltaY) / escala();
    aplicar();
  };
  let arrastre: { y: number; desde: number; id: number } | null = null;
  const bajar = (ev: PointerEvent) => {
    if ((ev.target as Element).closest('[data-btn]')) return;
    arrastre = { y: ev.clientY, desde: desplaz, id: ev.pointerId };
    svg.setPointerCapture(ev.pointerId);
  };
  const mover = (ev: PointerEvent) => {
    if (!arrastre || ev.pointerId !== arrastre.id) return;
    desplaz = arrastre.desde - (ev.clientY - arrastre.y) / escala();
    aplicar();
  };
  const soltar = (ev: PointerEvent) => {
    if (arrastre && ev.pointerId === arrastre.id) arrastre = null;
  };
  const teclas = (ev: KeyboardEvent) => {
    const pasos: Record<string, number> = { ArrowDown: 48, ArrowUp: -48, PageDown: 600, PageUp: -600, End: Infinity, Home: -Infinity };
    const paso = pasos[ev.key];
    if (paso === undefined) return;
    ev.preventDefault();
    desplaz += paso;
    aplicar();
  };
  svg.addEventListener('wheel', rueda, { passive: false });
  svg.addEventListener('pointerdown', bajar);
  svg.addEventListener('pointermove', mover);
  svg.addEventListener('pointerup', soltar);
  svg.addEventListener('pointercancel', soltar);
  document.addEventListener('keydown', teclas);
  // con el dedo, el desplazamiento lo maneja esta pantalla, no el navegador
  svg.style.touchAction = 'none';

  return {
    cerrar() {
      pantalla.cerrar();
      svg.removeEventListener('wheel', rueda);
      svg.removeEventListener('pointerdown', bajar);
      svg.removeEventListener('pointermove', mover);
      svg.removeEventListener('pointerup', soltar);
      svg.removeEventListener('pointercancel', soltar);
      document.removeEventListener('keydown', teclas);
      svg.style.touchAction = '';
    },
  };
}
