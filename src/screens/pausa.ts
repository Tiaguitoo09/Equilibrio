/**
 * Menú de pausa (port de pausa() en pantallas-que-faltan/reference/pantallas_nuevas.js):
 * velo, tarjeta con «Pausa», dónde vas, «Seguir» y tres salidas.
 */
import type { Nivel } from '../engine/equilibrio';
import { C } from '../render/colores';
import { velo } from '../render/piezas';
import { Escena, dos, medidaPastilla, medir, nf } from '../render/primitivas';
import { activarBotones, elemento, type Capas } from '../render/svg';
import type { NombreIcono } from '../ui/iconos';
import { AIRE, TAM } from '../ui/escala';

export function escenaPausa(nivel: Nivel, total: number): Escena {
  const s = new Escena('Pausa');
  velo(s, 'pausa:velo');
  const W = 520;
  const H = 272;
  const x = 720 - W / 2;
  const y = 314;
  s.r('top', x, y, W, H, { f: C.blanco, rr: 22, n: 'pausa:tarjeta' });
  // título con su ícono (m), centrados juntos
  const wt = TAM.m + 8 + medir('Pausa', 34, 'B');
  s.i('top', 720 - wt / 2 + TAM.m / 2, y + 36 + 22, 'pausa', TAM.m);
  s.t('top', 720 - wt / 2 + TAM.m + 8, y + 36, 'Pausa', 34, 'B', C.tinta, { n: 'titulo' });
  s.t('top', 720, y + 84, `${dos(nivel.num)} · ${nivel.name}  ·  vas en ${nf(total)} min, la meta es ${nf(nivel.optimo)}`, 13, 'M', C.sec, { a: 'c' });
  s.pill('top', 720, y + 150, [{ v: 'Seguir', z: 16, f: 'SB', c: C.blanco }], { bg: C.tinta, bd: C.tinta, px: 22, py: 11, gap: 8, ico: 'jugar', tamIco: TAM.s, n: 'btn:seguir' });

  // tres salidas centradas, con 10 px entre ellas
  const salidas: [NombreIcono, string, string][] = [
    ['reiniciar', 'Reiniciar', 'reiniciar'],
    ['red', 'Plano de la red', 'plano'],
    ['inicio', 'Inicio', 'inicio'],
  ];
  const pastillas = salidas.map(([ico, v, btn]) => ({ parts: [{ v, z: 15, f: 'SB' as const, c: C.tinta }], px: 14, py: 9, gap: AIRE, ico, tamIco: TAM.s, n: 'btn:' + btn }));
  const anchos = pastillas.map((p) => medidaPastilla(p)[0]);
  let cx = 720 - (anchos.reduce((a, b) => a + b, 0) + 10 * (anchos.length - 1)) / 2;
  pastillas.forEach((p, i) => {
    s.pill('top', cx + anchos[i] / 2, y + 222, p.parts, p);
    cx += anchos[i] + 10;
  });
  return s;
}

export function dibujarPausa(capas: Capas, nivel: Nivel, total: number) {
  for (const it of escenaPausa(nivel, total).it) capas.top.append(elemento(it));
  activarBotones(capas.top);
}
