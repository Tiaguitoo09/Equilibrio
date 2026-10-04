/**
 * Piezas que comparten las pantallas: botones en pastilla y filas de botones.
 * Los estilos salen de reference/escena.js y tutorial_y_cargas.js.
 */
import { C } from './colores';
import { medidaPastilla, type Capa, type Escena, type Pastilla } from './primitivas';

export type EstiloBoton = 'grande' | 'negro' | 'contorno' | 'chip';

export interface Boton {
  v: string;
  /** nombre del botón: queda como data-btn */
  btn: string;
  estilo: EstiloBoton;
  flecha?: boolean;
}

/** Medidas de cada estilo. */
function pastillaDe(b: Boton): Omit<Pastilla, 'k' | 'L' | 'x' | 'y'> {
  const n = 'btn:' + b.btn;
  switch (b.estilo) {
    case 'grande': // «Seguir en el nivel 08 →» del inicio
      return { parts: [{ v: b.v, z: 18, f: 'SB', c: C.blanco }], bg: C.tinta, bd: C.tinta, px: 24, py: 14, gap: 10, flecha: b.flecha, n };
    case 'negro': // «Siguiente nivel →», «Toca para empezar»
      return { parts: [{ v: b.v, z: 15, f: 'SB', c: C.blanco }], bg: C.tinta, bd: C.tinta, px: 18, py: 11, gap: 8, flecha: b.flecha, n };
    case 'contorno': // «Ver plano»
      return { parts: [{ v: b.v, z: 15, f: 'SB', c: C.tinta }], bg: C.blanco, bd: C.borde, px: 18, py: 11, gap: 8, flecha: b.flecha, n };
    case 'chip': // «Plano de la red · Bitácora · Ajustes»
      return { parts: [{ v: b.v, z: 14, f: 'SB', c: C.tinta }], bg: C.blanco, bd: C.borde, px: 15, py: 8, gap: 3, flecha: b.flecha, n };
  }
}

export function anchoBoton(b: Boton): number {
  return medidaPastilla(pastillaDe(b))[0];
}

/**
 * Una fila de botones con centro vertical en y.
 * a = 'l': x es el borde izquierdo · a = 'c': x es el centro de la fila.
 */
export function filaBotones(s: Escena, L: Capa, botones: Boton[], x: number, y: number, a: 'l' | 'c' = 'l', gap = 12) {
  const anchos = botones.map(anchoBoton);
  const total = anchos.reduce((p, q) => p + q, 0) + gap * (botones.length - 1);
  let xi = a === 'l' ? x : x - total / 2;
  botones.forEach((b, i) => {
    const { parts, ...o } = pastillaDe(b);
    s.pill(L, xi + anchos[i] / 2, y, parts, o);
    xi += anchos[i] + gap;
  });
}

/** Velo oscuro sobre la escena (tutorial y pausa). Bloquea los toques de lo que queda debajo. */
export function velo(s: Escena, n: string) {
  s.r('top', 0, 0, 1440, 900, { f: C.tinta, o: 0.55, n });
}
