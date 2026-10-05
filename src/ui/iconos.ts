/**
 * Íconos del equipo (prompt 5). Los SVG están en src/assets/iconos/ (copiados de
 * actualizacion-iconos/iconos/svg_color/): viewBox 0 0 480 480 y colores propios del equipo,
 * que NO se cambian (van a color sobre fondo claro y sobre los botones tinta).
 * Para cambiar un ícono basta con reemplazar su archivo; el nombre del ícono es el nombre del archivo.
 */
import { C } from '../render/colores';
import { el } from '../render/dom';

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

/** Texto de cada SVG por nombre (Vite los incluye en el build). */
const ARCHIVOS = import.meta.glob<string>('../assets/iconos/*.svg', { query: '?raw', import: 'default', eager: true });
const SVG: Partial<Record<NombreIcono, string>> = {};
for (const [ruta, texto] of Object.entries(ARCHIVOS)) SVG[ruta.split('/').pop()!.replace('.svg', '') as NombreIcono] = texto;

/** Cada ícono se interpreta una sola vez; después se clona. */
const plantillas = new Map<NombreIcono, SVGSVGElement>();
function plantilla(nombre: NombreIcono): SVGSVGElement | null {
  let p = plantillas.get(nombre);
  if (!p) {
    const texto = SVG[nombre];
    if (!texto) return null;
    p = new DOMParser().parseFromString(texto, 'image/svg+xml').documentElement as unknown as SVGSVGElement;
    plantillas.set(nombre, p);
  }
  return p;
}

/**
 * Ícono de `tamano` px centrado en (cx, cy), como un <svg> anidado.
 * Es decorativo (aria-hidden): el texto de al lado o el aria-label del botón dicen qué es.
 */
export function icono(nombre: NombreIcono, tamano: number, cx = 0, cy = 0): SVGElement | null {
  const p = plantilla(nombre);
  if (!p) return null;
  const svg = document.importNode(p, true);
  svg.setAttribute('x', String(cx - tamano / 2));
  svg.setAttribute('y', String(cy - tamano / 2));
  svg.setAttribute('width', String(tamano));
  svg.setAttribute('height', String(tamano));
  svg.setAttribute('aria-hidden', 'true');
  svg.dataset.icono = nombre;
  return svg;
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
  });
  const t = el('title');
  t.textContent = etiqueta;
  // anillo de foco (solo se ve con el teclado, ver styles.css)
  g.append(t, el('circle', { r: 27.5, fill: 'none', stroke: C.tinta, 'stroke-width': 3, class: 'anillo' }), el('circle', { r: 22, fill: C.tinta }));
  const i = icono(nombreIcono, 26);
  if (i) g.append(i);
  return g;
}
