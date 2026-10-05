/**
 * Bitácora del ingeniero (port de bitacora() en reference/escena.js).
 * Una frase humana, el antes → después y dos botones. La tarjeta crece si la frase ocupa más de dos líneas.
 */
import type { Bitacora } from '../game/bitacora';
import { C } from '../render/colores';
import { territorio } from '../render/nivel';
import { filaBotones, type Boton } from '../render/piezas';
import { Escena, dos, medir, partir } from '../render/primitivas';
import { montarEscena, type Pantalla } from './montar';

export function escenaBitacora(num: number, b: Bitacora, haySiguiente: boolean): Escena {
  const s = new Escena(`Bitácora · Nivel ${dos(num)}`);
  territorio(s, num);
  s.r('inf', 0, 0, 1440, 900, { f: C.tinta, o: 0.06 });

  const lineas = partir(b.cita, 36, 'EB', 540);
  const extra = (lineas.length - 2) * 44;
  const W = 640;
  const H = 470 + extra;
  const x = 400;
  const y = Math.round(200 - extra / 2);
  s.r('inf', x, y, W, H, { f: C.blanco, s: C.borde, sw: 1, rr: 22, n: 'bitacora' });
  [C.amarilla, C.naranja, C.azul, C.lila].forEach((c, i) => s.r('inf', x + 40 + i * 44, y + 34, 36, 6, { f: c, rr: 3 }));
  // la firma del ingeniero, arriba a la derecha
  s.i('inf', x + W - 40 - 24, y + 34 + 24, 'ingeniero', 48);
  s.t('inf', x + 40, y + 58, `BITÁCORA DEL INGENIERO · NIVEL ${dos(num)}`, 11, 'CB', C.sec, { ls: 1.4 });
  lineas.forEach((l, i) => s.t('inf', x + 40, y + 92 + i * 44, l, 36, 'EB', C.tinta, { n: 'bitacora:cita' }));

  // antes → después (las posiciones siguen el ancho real de los números)
  const yb = y + 210 + extra;
  const xa = x + 40;
  s.t('inf', xa, yb, b.antes, 64, 'EB', C.rojo, { n: 'bitacora:antes' });
  const f0 = xa + medir(b.antes, 64, 'EB') + 24;
  s.p('inf', [[f0, yb + 40], [f0 + 80, yb + 40]], C.tinta, 3);
  s.g('inf', [[f0 + 82, yb + 32], [f0 + 94, yb + 40], [f0 + 82, yb + 48]], C.tinta);
  const xd = f0 + 110;
  s.t('inf', xd, yb, b.despues, 64, 'EB', C.verde, { n: 'bitacora:despues' });
  s.t('inf', xd + medir(b.despues, 64, 'EB') + 24, yb + 30, 'min por carro', 14, 'M', C.sec);
  s.tw('inf', x + 40, yb + 100, b.detalle, 16, 'M', C.sec, 540, 22);

  const botones: Boton[] = [];
  if (haySiguiente) botones.push({ v: 'Siguiente nivel', btn: 'siguiente', estilo: 'negro', iconoFin: 'siguiente' });
  botones.push({ v: 'Ver plano', btn: 'plano', estilo: haySiguiente ? 'contorno' : 'negro', icono: 'red' });
  filaBotones(s, 'inf', botones, x + 40, yb + 190, 'l', 28);
  return s;
}

export function pantallaBitacora(
  svg: SVGSVGElement,
  num: number,
  b: Bitacora,
  al: { siguiente?: () => void; plano: () => void },
): Pantalla {
  return montarEscena(svg, escenaBitacora(num, b, !!al.siguiente), (btn) => {
    if (btn === 'siguiente') al.siguiente?.();
    if (btn === 'plano') al.plano();
  });
}
