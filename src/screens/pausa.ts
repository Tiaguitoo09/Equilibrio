/**
 * Menú de pausa: velo, una tarjeta con «Pausa», el botón para seguir y tres salidas.
 * No hay diseño en Figma todavía; usa las mismas piezas de la carga del nivel y del inicio.
 */
import { C } from '../render/colores';
import { filaBotones, velo } from '../render/piezas';
import { Escena } from '../render/primitivas';
import { activarBotones, elemento, type Capas } from '../render/svg';

export function escenaPausa(): Escena {
  const s = new Escena('Pausa');
  velo(s, 'pausa:velo');
  const W = 460;
  const H = 250;
  const x = 720 - W / 2;
  const y = 450 - H / 2;
  s.r('top', x, y, W, H, { f: C.blanco, s: C.borde, sw: 1, rr: 22, n: 'pausa:tarjeta' });
  s.t('top', 720, y + 40, 'Pausa', 34, 'B', C.tinta, { a: 'c', n: 'titulo' });
  filaBotones(s, 'top', [{ v: 'Seguir', btn: 'seguir', estilo: 'negro' }], 720, y + 132, 'c');
  filaBotones(
    s,
    'top',
    [
      { v: 'Reiniciar', btn: 'reiniciar', estilo: 'chip' },
      { v: 'Plano de la red', btn: 'plano', estilo: 'chip' },
      { v: 'Inicio', btn: 'inicio', estilo: 'chip' },
    ],
    720,
    y + 196,
    'c',
    10,
  );
  return s;
}

export function dibujarPausa(capas: Capas) {
  for (const it of escenaPausa().it) capas.top.append(elemento(it));
  activarBotones(capas.top);
}
