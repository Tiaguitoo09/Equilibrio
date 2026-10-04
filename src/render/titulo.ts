/** Título arriba a la izquierda: círculo con el número, nombre y subtítulo. Port de titulo() en escena.js. */
import { BLOQUE, C } from './colores';
import { dos, type Escena } from './primitivas';
import type { Nivel } from '../engine/equilibrio';

export function subtitulo(lv: Nivel): string {
  let sub = `${BLOQUE[lv.block][0]} · NIVEL ${dos(lv.num)} DE 15 · ${lv.lineas} LÍNEAS`;
  if (lv.grupos > 1) sub += ` · ${lv.grupos} GRUPOS`;
  if (lv.cables) sub += ` · ${lv.cables} CABLE${lv.cables > 1 ? 'S' : ''}`;
  return sub.toUpperCase();
}

export function titulo(s: Escena, lv: Nivel) {
  const color = BLOQUE[lv.block][1];
  s.e('inf', 60, 56, 20, { f: color, n: 'badge' });
  s.t('inf', 60, 47, dos(lv.num), 15, 'B', lv.block === 1 ? C.tinta : C.blanco, { a: 'c' });
  s.t('inf', 92, 34, lv.name, 26, 'B', C.tinta, { n: 'titulo' });
  s.t('inf', 93, 68, subtitulo(lv), 11, 'CB', C.sec, { ls: 1.2 });
}
