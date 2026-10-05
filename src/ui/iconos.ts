/**
 * Íconos del juego — PUNTO DE EXTENSIÓN.
 *
 * Los íconos finales ya llegaron (sin integrar): actualizacion-iconos/iconos/svg_color/*.svg
 * (los 22 de NOMBRES_ICONOS; viewBox 0 0 480 480 y colores propios del equipo). Instrucciones en
 * actualizacion-iconos/PROMPT_5.md. Para integrarlos (prompt 5):
 *   1. copiar svg_color/*.svg a src/assets/iconos/
 *   2. llenar FINALES con:
 *        import.meta.glob('../assets/iconos/*.svg', { query: '?raw', import: 'default', eager: true })
 *      (la clave es la ruta; el nombre del ícono es el archivo sin .svg)
 * Mientras tanto, icono() usa los PROVISIONALES (los de reference/escena.js) y, si no hay, devuelve null.
 */
import { C } from '../render/colores';
import { el } from '../render/svg';

export const NOMBRES_ICONOS = [
  'ajustes',
  'atajo',
  'candado',
  'carros',
  'cerrar',
  'destino',
  'ingeniero',
  'inicio',
  'jugar',
  'logo',
  'logro',
  'obra',
  'optimo',
  'origen',
  'pausa',
  'red',
  'reiniciar',
  'siguiente',
  'sonido',
  'tiempo',
  'via_abierta',
  'via_cerrada',
] as const;
export type NombreIcono = (typeof NOMBRES_ICONOS)[number];

/** SVG finales como texto, por nombre. Vacío hasta el prompt 5. */
const FINALES: Partial<Record<NombreIcono, string>> = {};

/** Provisionales: interior de un SVG en cuadrícula 24×24 centrada en (0,0), con currentColor. */
const PROVISIONALES: Partial<Record<NombreIcono, string>> = {
  reiniciar:
    '<path d="M4.97 6.27 A8 8 0 1 1 7.89 -1.46" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
    '<polygon points="4,-12 10,-7 2,-4" fill="currentColor"/>',
  pausa: '<rect x="-6" y="-7" width="4" height="14" rx="1" fill="currentColor"/><rect x="2" y="-7" width="4" height="14" rx="1" fill="currentColor"/>',
};

/**
 * Ícono de `tamano` px centrado en (cx, cy), decorativo (aria-hidden): el texto o el aria-label
 * del botón dicen qué es. Devuelve null si ese ícono todavía no existe.
 */
export function icono(nombre: NombreIcono, tamano: number, cx = 0, cy = 0): SVGElement | null {
  const final = FINALES[nombre];
  if (final) {
    const svg = document.importNode(new DOMParser().parseFromString(final, 'image/svg+xml').documentElement, true) as unknown as SVGSVGElement;
    svg.setAttribute('x', String(cx - tamano / 2));
    svg.setAttribute('y', String(cy - tamano / 2));
    svg.setAttribute('width', String(tamano));
    svg.setAttribute('height', String(tamano));
    svg.setAttribute('aria-hidden', 'true');
    return svg;
  }
  const provisional = PROVISIONALES[nombre];
  if (!provisional) return null;
  const g = el('g', { transform: `translate(${cx} ${cy}) scale(${tamano / 24})`, 'aria-hidden': 'true' });
  g.innerHTML = provisional;
  return g;
}

/** Botón redondo tinta (r22) solo con ícono: lleva aria-label («Reiniciar», «Pausa»…). */
export function botonRedondo(nombre: string, cx: number, cy: number, nombreIcono: NombreIcono, etiqueta: string): SVGGElement {
  const g = el('g', {
    class: 'btn redondo',
    'data-btn': nombre,
    role: 'button',
    tabindex: 0,
    'aria-label': etiqueta,
    transform: `translate(${cx} ${cy})`,
    color: C.blanco,
  });
  const t = el('title');
  t.textContent = etiqueta;
  // anillo de foco (solo se ve con el teclado, ver styles.css)
  g.append(t, el('circle', { r: 27.5, fill: 'none', stroke: C.tinta, 'stroke-width': 3, class: 'anillo' }), el('circle', { r: 22, fill: C.tinta }));
  const i = icono(nombreIcono, 24);
  if (i) g.append(i);
  return g;
}
