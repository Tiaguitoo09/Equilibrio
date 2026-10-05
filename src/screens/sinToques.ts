/**
 * Sin toques (port de sinToques() en pantallas-que-faltan/reference/pantallas_nuevas.js).
 * En los niveles con tope de toques, cuando se gastan todos sin llegar al óptimo:
 * velo suave y una tarjeta con dónde quedaste, la meta, «Reintentar» y «Ver plano».
 */
import type { Nivel } from '../engine/equilibrio';
import { C } from '../render/colores';
import { velo } from '../render/piezas';
import { Escena, nf } from '../render/primitivas';
import { activarBotones, elemento, type Capas } from '../render/svg';

/** Texto de la píldora negra mientras se ve la tarjeta. */
export const MENSAJE_SIN_TOQUES = 'Se acabaron los toques.';

export function escenaSinToques(nivel: Nivel, total: number): Escena {
  const s = new Escena('Sin toques');
  velo(s, 'sin-toques:velo', 0.35);
  const x = 470;
  const y = 330;
  const W = 500;
  const H = 240;
  s.r('top', x, y, W, H, { f: C.blanco, rr: 22, n: 'sin-toques:tarjeta' });
  s.t('top', 720, y + 32, 'SE ACABARON LOS TOQUES', 12, 'CB', C.sec, { a: 'c', ls: 1.6 });
  s.t('top', 720, y + 56, `Quedaste en ${nf(total)} min`, 30, 'B', C.tinta, { a: 'c', n: 'titulo' });
  s.t('top', 720, y + 100, `La meta es ${nf(nivel.optimo)}. Prueba otros cables.`, 15, 'M', C.sec, { a: 'c' });
  s.pill('top', 720 - 86, y + 178, [{ v: 'Reintentar', z: 15, f: 'SB', c: C.blanco }], { bg: C.tinta, bd: C.tinta, px: 18, py: 11, gap: 6, ico: 'reiniciar', tamIco: 16, n: 'btn:reintentar' });
  s.pill('top', 720 + 96, y + 178, [{ v: 'Ver plano', z: 15, f: 'SB', c: C.tinta }], { px: 18, py: 11, gap: 6, ico: 'red', tamIco: 16, n: 'btn:plano' });
  return s;
}

export function dibujarSinToques(capas: Capas, nivel: Nivel, total: number) {
  for (const it of escenaSinToques(nivel, total).it) capas.top.append(elemento(it));
  activarBotones(capas.top);
}
