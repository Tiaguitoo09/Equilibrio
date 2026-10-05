/** HUD arriba a la derecha (330×118): TOTAL y ÓPTIMO. Port de hud() en escena.js. */
import { C } from './colores';
import { medir, nf, type Escena } from './primitivas';

export interface DatosHud {
  total: number;
  optimo: number;
  inicio: number;
  resuelto: boolean;
  toques: number;
}

export function hud(s: Escena, { total, optimo, inicio, resuelto, toques }: DatosHud) {
  const x = 1074;
  const y = 34;
  s.r('inf', x, y, 330, resuelto ? 134 : 118, { f: C.blanco, s: resuelto ? C.verde : C.borde, sw: resuelto ? 2 : 1, rr: 14, n: 'HUD' });
  // íconos de tiempo y óptimo antes de cada rótulo (Figma actualizado)
  s.i('inf', x + 27.5, y + 22, 'tiempo', 15);
  s.t('inf', x + 40, y + 16, 'TOTAL · MIN POR CARRO', 10, 'CB', C.sec, { ls: 1 });
  s.i('inf', x + 310 - medir('ÓPTIMO', 10, 'CB', 1) - 12.5, y + 22, 'optimo', 15);
  s.t('inf', x + 310, y + 16, 'ÓPTIMO', 10, 'CB', C.sec, { ls: 1, a: 'r' });
  s.t('inf', x + 18, y + 32, nf(total), 44, 'EB', resuelto ? C.verde : C.rojo, { n: 'hud:total' });
  s.t('inf', x + 312, y + 32, nf(optimo), 44, 'EB', C.tinta, { a: 'r', n: 'hud:optimo' });
  // barra de progreso: el punto avanza de TOTAL inicial a ÓPTIMO
  const p = Math.max(0, Math.min(1, (inicio - total) / (inicio - optimo)));
  s.r('inf', x + 24, y + 96, 282, 4, { f: resuelto ? C.verde : C.borde, rr: 2, n: 'progreso' });
  s.e('inf', x + 306, y + 98, 7, { f: resuelto ? C.verde : C.blanco, s: resuelto ? C.verde : C.tinta, sw: 3 });
  if (!resuelto) s.e('inf', x + 24 + p * 282, y + 98, 6, { f: C.rojo, s: C.blanco, sw: 2, n: 'progreso:punto' });
  if (resuelto) s.t('inf', x + 20, y + 110, `Equilibrio alcanzado en ${toques} toque${toques === 1 ? '' : 's'}`, 12, 'SB', C.verdeTexto, { n: 'hud:mensaje' });
}
