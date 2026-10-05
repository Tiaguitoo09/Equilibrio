/**
 * Convierte una Escena (lista de primitivas) en elementos SVG, una <g> por capa.
 * Orden de abajo hacia arriba: ter · red · carros · est · sta · toque · inf · top
 *   - carros: la llena src/game/carros.ts (animados)
 *   - toque: zonas invisibles para tocar las vías
 */
import { C, FUENTES } from './colores';
import { el } from './dom';
import { medidaPastilla, medir, type Escena, type Primitiva } from './primitivas';
import type { Punto } from '../engine/equilibrio';
import { icono, TAM } from '../ui/iconos';

export { el, NS } from './dom';
export const CAPAS = ['ter', 'red', 'carros', 'est', 'sta', 'toque', 'inf', 'top'] as const;
export type CapaSvg = (typeof CAPAS)[number];
export type Capas = Record<CapaSvg, SVGGElement>;

const r2 = (v: number) => Math.round(v * 100) / 100;

/** Polilínea con esquinas redondeadas (arcos de radio rad, como el cornerRadius de Figma). */
export function trazoRedondeado(pts: Punto[], rad = 0): string {
  const P = (p: Punto) => `${r2(p[0])} ${r2(p[1])}`;
  let d = `M${P(pts[0])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [p0, p1, p2] = [pts[i - 1], pts[i], pts[i + 1]];
    const v1: Punto = [p0[0] - p1[0], p0[1] - p1[1]];
    const v2: Punto = [p2[0] - p1[0], p2[1] - p1[1]];
    const l1 = Math.hypot(v1[0], v1[1]);
    const l2 = Math.hypot(v2[0], v2[1]);
    const cruz = v1[0] * v2[1] - v1[1] * v2[0];
    if (rad <= 0 || l1 === 0 || l2 === 0 || Math.abs(cruz) < 1e-9) {
      d += ` L${P(p1)}`;
      continue;
    }
    const ang = Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2))));
    let tan = rad / Math.tan(ang / 2);
    let r = rad;
    const maxT = Math.min(l1, l2) / 2;
    if (tan > maxT) {
      tan = maxT;
      r = tan * Math.tan(ang / 2);
    }
    const a: Punto = [p1[0] + (v1[0] / l1) * tan, p1[1] + (v1[1] / l1) * tan];
    const b: Punto = [p1[0] + (v2[0] / l2) * tan, p1[1] + (v2[1] / l2) * tan];
    d += ` L${P(a)} A${r2(r)} ${r2(r)} 0 0 ${cruz < 0 ? 1 : 0} ${P(b)}`;
  }
  return d + ` L${P(pts[pts.length - 1])}`;
}

function arco(x: number, y: number, r: number, [a0, a1]: [number, number]): string {
  const p = (a: number) => `${r2(x + r * Math.cos(a))} ${r2(y + r * Math.sin(a))}`;
  return `M${p(a0)} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)}`;
}

function texto(x: number, yBase: number, v: string, z: number, f: keyof typeof FUENTES, c: string, ancla: string, ls?: number) {
  const t = el('text', {
    x: r2(x),
    y: r2(yBase),
    fill: c,
    'font-family': FUENTES[f].familia,
    'font-weight': FUENTES[f].peso,
    'font-size': z,
    'text-anchor': ancla,
    'letter-spacing': ls,
  });
  t.textContent = v;
  return t;
}

const ANCLA = { l: 'start', c: 'middle', r: 'end' } as const;

/** Una primitiva → un elemento SVG. */
export function elemento(it: Primitiva): SVGElement {
  let e: SVGElement;
  switch (it.k) {
    case 'p':
      e = el('path', {
        d: trazoRedondeado(it.pts, it.rad),
        fill: 'none',
        stroke: it.c,
        'stroke-width': it.w,
        'stroke-linejoin': 'round',
        'stroke-linecap': it.cap === 'b' ? 'butt' : 'round',
        'stroke-dasharray': it.d ? it.d.join(' ') : undefined,
      });
      break;
    case 'e':
      e = it.arc
        ? el('path', { d: arco(it.x, it.y, it.r, it.arc), fill: 'none', stroke: it.s, 'stroke-width': it.sw, 'stroke-linecap': 'round' })
        : el('circle', { cx: r2(it.x), cy: r2(it.y), r: it.r, fill: it.f ?? 'none', stroke: it.s, 'stroke-width': it.s ? it.sw : undefined });
      break;
    case 'r':
      e = el('rect', {
        x: r2(it.x),
        y: r2(it.y),
        width: r2(it.w),
        height: r2(it.h),
        rx: it.rr,
        fill: it.f ?? 'none',
        stroke: it.s,
        'stroke-width': it.s ? it.sw : undefined,
      });
      break;
    case 'g':
      e = el('polygon', { points: it.pts.map((p) => p.join(',')).join(' '), fill: it.f });
      break;
    case 't':
      // y es el borde superior de la caja (Figma); Barlow tiene ascendente = 1 em
      e = texto(it.x, it.y + it.z, it.v, it.z, it.f, it.c, ANCLA[it.a], it.ls);
      break;
    case 'pill': {
      const [w, h] = medidaPastilla(it);
      const g = el('g');
      g.append(el('rect', { x: r2(it.x - w / 2), y: r2(it.y - h / 2), width: r2(w), height: r2(h), rx: r2(h / 2), fill: it.bg, stroke: it.bd, 'stroke-width': 1.5 }));
      let x = it.x - w / 2 + it.px;
      const tam = it.tamIco ?? TAM.s;
      const ponerIcono = (nombre: NonNullable<typeof it.ico>) => {
        const i = icono(nombre, tam, x + tam / 2, it.y);
        if (i) g.append(i);
        x += tam + it.gap;
      };
      if (it.ico) ponerIcono(it.ico);
      for (const q of it.parts) {
        // cada texto centrado verticalmente en la pastilla (auto-layout de Figma)
        g.append(texto(x, it.y + q.z * 0.4, q.v, q.z, q.f, q.c, 'start'));
        x += medir(q.v, q.z, q.f) + it.gap;
      }
      if (it.icoFin) ponerIcono(it.icoFin);
      e = g;
      break;
    }
    case 'i':
      e = icono(it.nombre, it.tam, it.x, it.y) ?? el('g');
      break;
  }
  if (it.o !== undefined) e.setAttribute('opacity', String(it.o));
  if (it.n) e.dataset.n = it.n;
  if (it.via) e.dataset.via = it.via;
  return e;
}

/**
 * Convierte en botón todo lo que en la escena se llama «btn:algo» (como en Figma):
 * queda con data-btn="algo", foco con teclado y su texto como aria-label.
 */
export function activarBotones(raiz: Element) {
  raiz.querySelectorAll<SVGElement>('[data-n^="btn:"]').forEach((e) => {
    e.dataset.btn = e.dataset.n!.slice(4);
    e.classList.add('btn');
    e.setAttribute('role', 'button');
    e.setAttribute('tabindex', '0');
    e.setAttribute('aria-label', e.textContent || e.dataset.btn);
    // pastillas: anillo de foco con su misma forma (el outline de SVG sale cuadrado; ver styles.css)
    const fondo = e.tagName === 'g' ? e.querySelector(':scope > rect') : null;
    if (fondo && !e.querySelector('.anillo')) {
      const [x, y, w, h] = ['x', 'y', 'width', 'height'].map((a) => Number(fondo.getAttribute(a)));
      e.prepend(el('rect', { x: x - 5, y: y - 5, width: w + 10, height: h + 10, rx: (h + 10) / 2, fill: 'none', stroke: C.tinta, 'stroke-width': 3, class: 'anillo' }));
      e.classList.add('redondo');
    }
  });
}

/** Borra el SVG y pinta la escena. Devuelve las capas para que otros módulos agreguen cosas. */
export function pintar(svg: SVGSVGElement, s: Escena): Capas {
  svg.replaceChildren();
  svg.append(el('rect', { x: 0, y: 0, width: s.w, height: s.h, fill: s.bg }));
  const capas = {} as Capas;
  for (const c of CAPAS) {
    const g = el('g', { 'data-capa': c });
    capas[c] = g;
    svg.append(g);
  }
  for (const it of s.it) capas[it.L].append(elemento(it));
  return capas;
}
