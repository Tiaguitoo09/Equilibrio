/**
 * Fin del juego (port de finJuego() en pantallas-que-faltan/reference/pantallas_nuevas.js).
 * Sale con «Terminar» en la bitácora del nivel 15. Las tres cifras salen del progreso guardado.
 */
import type { Nivel } from '../engine/equilibrio';
import type { Progreso } from '../game/progreso';
import { C } from '../render/colores';
import { Escena, medir, nf } from '../render/primitivas';
import type { NombreIcono } from '../ui/iconos';
import { ahorroTotal } from './bitacoraCompleta';
import { montarEscena, type Pantalla } from './montar';

export function escenaFinJuego(niveles: Nivel[], progreso: Progreso): Escena {
  const s = new Escena('Fin del juego');
  s.g('ter', [[1000, 0], [1440, 0], [1440, 300]], C.agua);
  s.g('ter', [[0, 700], [0, 900], [230, 900]], C.agua);
  // las tres líneas de la red, completas
  for (const [c, y] of [
    [C.amarilla, 620],
    [C.naranja, 690],
    [C.azul, 760],
  ] as const) {
    s.p('red', [[300, y], [1140, y]], c, 12);
    for (let i = 0; i < 5; i++) {
      s.e('est', 300 + i * 210, y, 13, { f: C.tinta });
      s.e('est', 300 + i * 210, y, 5, { f: C.blanco });
    }
  }
  s.i('inf', 720, 86, 'logro', 64, { n: 'logro' });
  s.t('inf', 720, 130, 'NIVEL 15 DE 15 · LA RED COMPLETA', 12, 'CB', C.sec, { a: 'c', ls: 1.6 });
  s.t('inf', 720, 150, 'La ciudad está en equilibrio.', 64, 'EB', C.tinta, { a: 'c', n: 'titulo' });
  s.t('inf', 720, 252, 'Cerraste atajos, abriste vías y todos llegaron antes.', 20, 'M', C.sec, { a: 'c' });

  const toques = progreso.resueltos.reduce((a, n) => a + (progreso.mejores[n] ?? niveles.find((l) => l.num === n)?.cambios ?? 0), 0);
  const cifras: [string, string, NombreIcono][] = [
    [`${progreso.resueltos.length}/${niveles.length}`, 'niveles', 'red'],
    [String(toques), 'toques', 'via_abierta'],
    [nf(ahorroTotal({ niveles, progreso })), 'min ahorrados en total', 'tiempo'],
  ];
  cifras.forEach(([v, rotulo, ico], i) => {
    const x = 480 + i * 240;
    s.t('inf', x, 316, v, 44, 'EB', i === 2 ? C.verde : C.tinta, { a: 'c', n: 'fin:' + ico });
    // ícono de 16 antes del rótulo, 6 px de aire; el conjunto queda centrado
    const w = medir(rotulo, 13, 'M');
    const izq = x - (16 + 6 + w) / 2;
    s.i('inf', izq + 8, 372 + 8, ico, 16);
    s.t('inf', izq + 22, 372, rotulo, 13, 'M', C.sec);
  });

  s.pill('inf', 720 - 110, 470, [{ v: 'Ver bitácora', z: 16, f: 'SB', c: C.blanco }], { bg: C.tinta, bd: C.tinta, px: 20, py: 12, gap: 7, ico: 'optimo', tamIco: 18, n: 'btn:bitacora' });
  s.pill('inf', 720 + 120, 470, [{ v: 'Volver al inicio', z: 16, f: 'SB', c: C.tinta }], { px: 20, py: 12, gap: 7, ico: 'inicio', tamIco: 18, n: 'btn:inicio' });
  s.t('inf', 720, 836, 'SIMPLICIDAD = EQUILIBRIO · JOHN MAEDA', 12, 'CB', C.sec, { a: 'c', ls: 1.4 });
  return s;
}

export function pantallaFinJuego(svg: SVGSVGElement, niveles: Nivel[], progreso: Progreso, al: { bitacora(): void; inicio(): void }): Pantalla {
  return montarEscena(svg, escenaFinJuego(niveles, progreso), (b) => {
    if (b === 'bitacora') al.bitacora();
    if (b === 'inicio') al.inicio();
  });
}
