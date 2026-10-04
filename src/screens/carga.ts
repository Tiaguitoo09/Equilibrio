/**
 * Pantallas de carga (port de cargaApp() y cargaNivel() en reference/tutorial_y_cargas.js).
 *  - carga de la app: una línea de metro que se llena y pasa sola al inicio
 *  - carga del nivel: tarjeta con el nivel; tocar en cualquier parte empieza
 */
import type { Nivel } from '../engine/equilibrio';
import { BLOQUE, C, colorLinea } from '../render/colores';
import { territorio } from '../render/nivel';
import { filaBotones } from '../render/piezas';
import { Escena, dos, nf } from '../render/primitivas';
import { pintar } from '../render/svg';
import { montarEscena, type Pantalla } from './montar';

const PIE = 'SIMPLICIDAD = EQUILIBRIO · JOHN MAEDA';

/** p = avance de 0 a 1 */
export function escenaCargaApp(p: number): Escena {
  const s = new Escena('Carga · Inicio de la app');
  s.g('ter', [[1150, 0], [1440, 0], [1440, 190]], C.agua);
  s.g('ter', [[0, 680], [0, 900], [290, 900]], C.agua);
  [C.amarilla, C.naranja, C.azul].forEach((c, i) => s.e('inf', 680 + i * 16, 330, 7, { f: c }));
  s.t('inf', 720, 356, 'Equilibrio', 72, 'EB', C.tinta, { a: 'c', n: 'titulo' });

  const y = 520;
  const x0 = 420;
  const x1 = 1020;
  const cabeza = x0 + p * (x1 - x0);
  s.p('red', [[x0, y], [x1, y]], C.cerrada, 6, { d: [8, 8], n: 'progreso:pendiente' });
  if (cabeza > x0 + 1) s.p('red', [[x0, y], [cabeza, y]], C.amarilla, 12, { n: 'progreso:hecho' });
  for (let i = 0; i < 5; i++) {
    const x = x0 + i * 150;
    if (x <= cabeza + 0.5) {
      s.e('est', x, y, 13, { f: C.tinta });
      s.e('est', x, y, 5, { f: C.blanco });
    } else s.e('est', x, y, 10, { f: C.blanco, s: C.cerrada, sw: 4 });
  }
  for (const d of [110, 70, 30]) if (cabeza - d > x0 + 14) s.e('sta', cabeza - d, y, 5.5, { f: C.tinta, s: C.blanco, sw: 2.5, n: 'carro' });
  s.t('inf', 720, 556, `CARGANDO LA RED DE BOGOTÁ · ${Math.round(p * 100)}%`, 12, 'CB', C.sec, { a: 'c', ls: 1.4, n: 'progreso:texto' });

  s.r('inf', 470, 690, 500, 64, { f: C.blanco, s: C.borde, sw: 1, rr: 14, n: 'dato' });
  s.t('inf', 494, 704, '¿SABÍAS QUE?', 10, 'CB', C.cable, { ls: 1.2 });
  s.t('inf', 494, 722, 'A veces abrir un atajo hace que todos lleguen más tarde.', 14, 'M', C.tinta);
  s.t('inf', 720, 836, PIE, 12, 'CB', C.sec, { a: 'c', ls: 1.4 });
  return s;
}

/** La línea se llena en ~1,2 s y pasa sola al inicio. */
export function pantallaCargaApp(svg: SVGSVGElement, alTerminar: () => void): Pantalla {
  const DURACION = 1200;
  const t0 = performance.now();
  let raf = 0;
  let espera = 0;
  const cuadro = (ahora: number) => {
    const t = Math.min(1, (ahora - t0) / DURACION);
    pintar(svg, escenaCargaApp(1 - (1 - t) ** 2));
    if (t < 1) raf = requestAnimationFrame(cuadro);
    else espera = window.setTimeout(alTerminar, 250);
  };
  pintar(svg, escenaCargaApp(0));
  raf = requestAnimationFrame(cuadro);
  return {
    cerrar() {
      cancelAnimationFrame(raf);
      clearTimeout(espera);
    },
  };
}

export function escenaCargaNivel(lv: Nivel): Escena {
  const s = new Escena(`Carga · Entrando al nivel ${dos(lv.num)}`);
  territorio(s, lv.num, 0);
  // el nivel se adivina detrás, muy suave
  for (const l of lv.links) {
    const cable = l.kind === 'cable';
    s.p('red', l.pts, cable ? C.cable : colorLinea(l.line), cable ? 3 : 4, { o: 0.25, rad: cable ? 0 : 22, d: cable ? [0.1, 8] : null });
  }
  // tocar en cualquier parte empieza
  s.r('inf', 0, 0, 1440, 900, { n: 'btn:empezar' });
  const [bn, bc] = BLOQUE[lv.block];
  s.r('inf', 470, 290, 500, 320, { f: C.blanco, s: C.borde, sw: 1, rr: 22, n: 'tarjeta' });
  s.e('inf', 720, 360, 34, { f: bc });
  s.t('inf', 720, 343, dos(lv.num), 26, 'B', lv.block === 1 ? C.tinta : C.blanco, { a: 'c' });
  s.t('inf', 720, 410, lv.name, 34, 'B', C.tinta, { a: 'c', n: 'titulo' });
  let sub = `${bn.toUpperCase()} · ${lv.lineas} LÍNEAS`;
  if (lv.cables) sub += ` · ${lv.cables} CABLE${lv.cables === 1 ? '' : 'S'}`;
  s.t('inf', 720, 458, sub, 12, 'CB', C.sec, { a: 'c', ls: 1.2 });
  s.t('inf', 720, 490, `Empiezas en ${nf(lv.start)} min por carro. La meta: ${nf(lv.optimo)}.`, 15, 'M', C.tinta, { a: 'c' });
  filaBotones(s, 'inf', [{ v: 'Toca para empezar', btn: 'empezar', estilo: 'negro' }], 720, 560, 'c');
  return s;
}

export function pantallaCargaNivel(svg: SVGSVGElement, lv: Nivel, alEmpezar: () => void): Pantalla {
  return montarEscena(svg, escenaCargaNivel(lv), (b) => b === 'empezar' && alEmpezar(), (capas) => {
    // la zona de toda la pantalla no necesita foco propio: ya lo tiene el botón
    capas.inf.querySelector('rect[data-btn="empezar"]')?.removeAttribute('tabindex');
  });
}
