/**
 * Ajustes — SECCIÓN PROVISIONAL.
 * El diseño está pendiente en Figma; por ahora solo existe la sección (título y volver),
 * con el mismo marco que «Plano de la red». El contenido va en la capa inf, debajo del título.
 */
import { C } from '../render/colores';
import { filaBotones } from '../render/piezas';
import { Escena } from '../render/primitivas';
import { montarEscena, type Pantalla } from './montar';

export function escenaAjustes(): Escena {
  const s = new Escena('Ajustes');
  s.g('ter', [[1180, 0], [1440, 0], [1440, 170]], C.agua);
  s.g('ter', [[0, 720], [0, 900], [260, 900]], C.agua);
  s.i('inf', 74, 68, 'ajustes', 28);
  s.t('inf', 96, 48, 'Ajustes', 32, 'B', C.tinta, { n: 'titulo' });
  filaBotones(s, 'inf', [{ v: 'Volver', btn: 'volver', estilo: 'negro', icono: 'inicio' }], 60, 838);
  return s;
}

export function pantallaAjustes(svg: SVGSVGElement, alVolver: () => void): Pantalla {
  return montarEscena(svg, escenaAjustes(), (b) => b === 'volver' && alVolver());
}
