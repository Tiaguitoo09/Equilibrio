/**
 * Monta una pantalla fija: pinta la escena, convierte en botones los «btn:…»
 * y llama alBoton(nombre) con clic, toque, Enter o Espacio.
 */
import type { Escena } from '../render/primitivas';
import { activarBotones, pintar, type Capas } from '../render/svg';

export interface Pantalla {
  cerrar(): void;
}

/** Escucha los botones [data-btn] del SVG. Devuelve la función para dejar de escuchar. */
export function escucharBotones(svg: SVGSVGElement, alBoton: (nombre: string) => void): () => void {
  const nombre = (ev: Event) => (ev.target as Element).closest<SVGElement>('[data-btn]')?.dataset.btn;
  const clic = (ev: Event) => {
    const n = nombre(ev);
    if (n) alBoton(n);
  };
  const tecla = (ev: KeyboardEvent) => {
    const n = nombre(ev);
    if (n && (ev.key === 'Enter' || ev.key === ' ')) {
      ev.preventDefault();
      alBoton(n);
    }
  };
  svg.addEventListener('click', clic);
  svg.addEventListener('keydown', tecla);
  return () => {
    svg.removeEventListener('click', clic);
    svg.removeEventListener('keydown', tecla);
  };
}

export function montarEscena(svg: SVGSVGElement, escena: Escena, alBoton: (nombre: string) => void, alPintar?: (capas: Capas) => void): Pantalla {
  const capas = pintar(svg, escena);
  activarBotones(svg);
  alPintar?.(capas);
  const dejar = escucharBotones(svg, alBoton);
  return { cerrar: dejar };
}
