/**
 * Plano de la red (port de plano() en reference/escena.js).
 * Tres líneas de metro (Fácil, Intermedio, Difícil); cada estación es un nivel.
 *  - resuelto: terminal tinta · actual: anillo con «Estás aquí» · pendiente: gris
 * Se puede tocar un nivel resuelto o el actual para jugarlo.
 */
import type { Nivel } from '../engine/equilibrio';
import { BLOQUE, C } from '../render/colores';
import { filaBotones } from '../render/piezas';
import { Escena, dos } from '../render/primitivas';
import { disponible, type Progreso } from '../game/progreso';
import { montarEscena, type Pantalla } from './montar';

export function escenaPlano(niveles: Nivel[], p: Progreso): Escena {
  const s = new Escena('Plano de la red');
  s.g('ter', [[1180, 0], [1440, 0], [1440, 170]], C.agua);
  s.g('ter', [[0, 720], [0, 900], [260, 900]], C.agua);
  s.t('inf', 60, 48, 'Plano de la red', 32, 'B', C.tinta, { n: 'titulo' });
  s.t('inf', 61, 92, 'TRES LÍNEAS · QUINCE ESTACIONES · CADA ESTACIÓN ES UN NIVEL', 11, 'CB', C.sec, { ls: 1.2 });

  const resuelto = (num: number) => p.resueltos.includes(num);
  const filas: [1 | 2 | 3, number][] = [
    [1, 300],
    [2, 500],
    [3, 700],
  ];
  for (const [b, y] of filas) {
    const col = BLOQUE[b][1];
    const fila = niveles.filter((l) => l.block === b);
    const x0 = 330;
    const dx = 230;
    s.e('inf', 90, y, 8, { f: col });
    s.t('inf', 108, y - 9, BLOQUE[b][0].toUpperCase(), 13, 'CB', C.tinta, { ls: 1.2 });
    s.t('inf', 108, y + 8, `Niveles ${dos(b * 5 - 4)}–${dos(b * 5)}`, 11, 'M', C.sec);
    // tramos: del color de la línea cuando el nivel de la izquierda ya está resuelto
    fila.forEach((l, i) => {
      if (i === fila.length - 1) return;
      const x = x0 + i * dx;
      const hecho = resuelto(l.num);
      s.p('red', [[x, y], [x + dx, y]], hecho ? col : C.cerrada, hecho ? 12 : 6, hecho ? {} : { d: [8, 8] });
    });
    fila.forEach((l, i) => {
      const x = x0 + i * dx;
      const ahora = l.num === p.actual;
      const hecho = resuelto(l.num) && !ahora;
      if (ahora) {
        s.e('est', x, y, 20, { f: C.blanco, s: C.tinta, sw: 5 });
        s.e('est', x, y, 7, { f: col });
        s.pill('inf', x, y - 48, [{ v: 'Estás aquí', z: 12, f: 'SB', c: C.blanco }], { bg: C.tinta, bd: C.tinta, px: 10, py: 5 });
      } else if (hecho) {
        s.e('est', x, y, 15, { f: C.tinta });
        s.e('est', x, y, 6, { f: C.blanco });
      } else s.e('est', x, y, 11, { f: C.blanco, s: C.cerrada, sw: 4 });
      const tinta = ahora || resuelto(l.num);
      s.t('est', x, y + 28, dos(l.num), 13, 'CB', tinta ? C.tinta : C.sec, { a: 'c' });
      s.t('est', x, y + 46, l.name, 12, 'M', tinta ? C.tinta : C.sec, { a: 'c' });
      // zona para tocar el nivel (solo los que se pueden jugar)
      if (disponible(p, l.num)) s.r('inf', x - 60, y - 26, 120, 92, { rr: 16, n: `btn:nivel-${l.num}` });
    });
  }
  // empalmes entre líneas (punteados a la derecha)
  s.p('red', [[1250, 300], [1290, 300], [1290, 500], [1250, 500]], resuelto(5) ? C.tinta : C.cerrada, 3, { d: [0.1, 8], rad: 16 });
  s.p('red', [[1250, 500], [1290, 500], [1290, 700], [1250, 700]], resuelto(10) ? C.tinta : C.cerrada, 3, { d: [0.1, 8], rad: 16 });

  filaBotones(s, 'inf', [{ v: 'Volver', btn: 'volver', estilo: 'negro' }], 60, 838);
  return s;
}

export function pantallaPlano(svg: SVGSVGElement, niveles: Nivel[], p: Progreso, al: { elegir(num: number): void; volver(): void }): Pantalla {
  return montarEscena(
    svg,
    escenaPlano(niveles, p),
    (b) => {
      if (b === 'volver') al.volver();
      else if (b.startsWith('nivel-')) al.elegir(Number(b.slice(6)));
    },
    (capas) =>
      capas.inf.querySelectorAll<SVGElement>('[data-btn^="nivel-"]').forEach((e) => {
        const n = niveles.find((l) => l.num === Number(e.dataset.btn!.slice(6)));
        if (n) e.setAttribute('aria-label', `Nivel ${dos(n.num)} · ${n.name}`);
      }),
  );
}
