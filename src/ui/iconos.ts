/**
 * Íconos del juego — PUNTO DE EXTENSIÓN.
 *
 * Hoy son provisionales (los mismos de reference/escena.js). Cuando lleguen los SVG finales,
 * se reemplaza SOLO el contenido de ICONOS: cada ícono es el interior de un SVG centrado en (0,0),
 * en una cuadrícula de 24×24 (de -12 a 12), dibujado con `currentColor` para heredar el color del botón.
 */
import { C } from '../render/colores';
import { el } from '../render/svg';

export type Icono = 'reiniciar' | 'pausa' | 'reanudar';

export const ICONOS: Record<Icono, string> = {
  reiniciar:
    '<path d="M4.97 6.27 A8 8 0 1 1 7.89 -1.46" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
    '<polygon points="4,-12 10,-7 2,-4" fill="currentColor"/>',
  pausa: '<rect x="-6" y="-7" width="4" height="14" rx="1" fill="currentColor"/><rect x="2" y="-7" width="4" height="14" rx="1" fill="currentColor"/>',
  reanudar: '<polygon points="-4,-7 8,0 -4,7" fill="currentColor"/>',
};

/** Botón redondo tinta (r22) con un ícono blanco. */
export function botonRedondo(nombre: string, cx: number, cy: number, icono: Icono, etiqueta: string): SVGGElement {
  const g = el('g', {
    class: 'btn',
    'data-btn': nombre,
    role: 'button',
    tabindex: 0,
    'aria-label': etiqueta,
    transform: `translate(${cx} ${cy})`,
    color: C.blanco,
  });
  const t = el('title');
  t.textContent = etiqueta;
  const icon = el('g');
  icon.innerHTML = ICONOS[icono];
  g.append(t, el('circle', { r: 22, fill: C.tinta }), icon);
  return g;
}
