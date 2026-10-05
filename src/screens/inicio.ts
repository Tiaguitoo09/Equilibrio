/**
 * Inicio (port de inicio() en reference/escena.js).
 * Logo, un botón principal («Empezar» o «Seguir en el nivel 08») y chips: Plano de la red · Bitácora · Ajustes.
 * Como en el Figma actualizado: sin «UN JUEGO DE VÍAS · BOGOTÁ» ni el pie de Maeda; el ingeniero sobre el mapa.
 * El chip «Bitácora» (abre la Bitácora completa) solo aparece cuando ya hay algún nivel resuelto.
 */
import { C } from '../render/colores';
import { filaBotones, type Boton } from '../render/piezas';
import { Escena, dos } from '../render/primitivas';
import type { Progreso } from '../game/progreso';
import { montarEscena, type Pantalla } from './montar';
import { TAM } from '../ui/escala';

export function escenaInicio(p: Progreso): Escena {
  const s = new Escena('Inicio');
  s.g('ter', [[1000, 0], [1440, 0], [1440, 330]], C.agua);
  s.g('ter', [[0, 760], [0, 900], [150, 900]], C.agua);
  s.r('ter', 1180, 600, 140, 90, { f: C.parque, rr: 8 });
  // un pedazo de plano de metro a la derecha
  s.p('red', [[860, -20], [860, 250], [1060, 450], [1460, 450]], C.azul, 12, { rad: 40 });
  s.p('red', [[760, 920], [760, 640], [1000, 400], [1000, -20]], C.amarilla, 12, { rad: 40 });
  s.p('red', [[1460, 700], [1180, 700], [940, 460], [700, 460]], C.naranja, 7, { rad: 40 });
  s.p('red', [[1300, 920], [1300, 560], [1160, 420], [1160, -20]], C.lila, 7, { rad: 40 });
  s.p('red', [[1000, 450], [1160, 450]], C.cable, 5, { d: [0.1, 11] });
  for (const [x, y] of [[860, 250], [1000, 400], [940, 460], [1160, 450], [1300, 560], [760, 640]]) s.e('est', x, y, 11, { f: C.blanco, s: C.tinta, sw: 4 });
  s.e('est', 1000, 450, 15, { f: C.tinta });
  s.e('est', 1000, 450, 6, { f: C.blanco });

  // el ingeniero, en un círculo blanco sobre el mapa (Figma actualizado)
  s.e('inf', 1310, 362, 48.5, { f: C.blanco, s: C.tinta, sw: 3 }); // 100 px con el borde
  s.i('inf', 1310, 362, 'ingeniero', TAM.l);

  [C.amarilla, C.naranja, C.azul].forEach((c, i) => s.e('inf', 62 + i * 16, 96, 6, { f: c }));
  s.i('inf', 112, 226, 'logo', 104, { n: 'logo' });
  s.t('inf', 56, 300, 'Equilibrio', 112, 'EB', C.tinta, { n: 'titulo' });
  s.tw('inf', 60, 440, 'A veces, cerrar una vía es la forma más rápida de que todos lleguen.', 22, 'M', C.sec, 520, 30);

  const empezo = p.resueltos.length > 0;
  filaBotones(s, 'inf', [{ v: empezo ? `Seguir en el nivel ${dos(p.actual)}` : 'Empezar', btn: 'jugar', estilo: 'grande', icono: 'jugar' }], 60, 550);
  const chips: Boton[] = [{ v: 'Plano de la red', btn: 'plano', estilo: 'chip', icono: 'red' }];
  if (p.resueltos.length) chips.push({ v: 'Bitácora', btn: 'bitacora', estilo: 'chip', icono: 'optimo' });
  chips.push({ v: 'Ajustes', btn: 'ajustes', estilo: 'chip', icono: 'ajustes' });
  filaBotones(s, 'inf', chips, 60, 628, 'l', 12);
  return s;
}

export function pantallaInicio(svg: SVGSVGElement, p: Progreso, alBoton: (b: 'jugar' | 'plano' | 'bitacora' | 'ajustes') => void): Pantalla {
  return montarEscena(svg, escenaInicio(p), (b) => {
    if (b === 'jugar' || b === 'plano' || b === 'bitacora' || b === 'ajustes') alBoton(b);
  });
}
