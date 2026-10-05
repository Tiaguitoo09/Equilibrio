/**
 * Ajustes (port de ajustes() en pantallas-que-faltan/reference/pantallas_nuevas.js):
 * sonido y vibración con interruptor, borrar progreso (pide confirmación) y créditos.
 * Las preferencias se guardan en localStorage (src/game/preferencias.ts).
 */
import { cambiarPreferencias, preferencias } from '../game/preferencias';
import { C } from '../render/colores';
import { Escena, medir, partir } from '../render/primitivas';
import type { Capas } from '../render/svg';
import { anunciar } from '../ui/anuncio';
import { botonRedondo } from '../ui/iconos';
import { sonar } from '../ui/sonido';
import { montarEscena, type Pantalla } from './montar';

const EQUIPO = 'Equipo: Santiago Martinez Beltran · Juanita Carolina Torres · Estefany Sofia Maldonado · Julian Santiago Hernandez Gonzalez · Liz Jerez';

/** Estado de la fila «Borrar progreso». */
type Borrado = 'nada' | 'confirmar' | 'hecho';

const X = 400;
const Y = 130;
const W = 640;

/** Interruptor 56×32: el rectángulo es el botón (role="switch"); la perilla no recibe toques. */
function interruptor(s: Escena, x: number, y: number, encendido: boolean, btn: string) {
  s.r('inf', x, y, 56, 32, { f: encendido ? C.tinta : C.borde, rr: 16, n: 'btn:' + btn });
  s.e('inf', encendido ? x + 40 : x + 16, y + 16, 12, { f: C.blanco });
}

export function escenaAjustes(borrado: Borrado = 'nada'): Escena {
  const p = preferencias();
  const s = new Escena('Ajustes');
  s.g('ter', [[1150, 0], [1440, 0], [1440, 190]], C.agua);
  s.g('ter', [[0, 680], [0, 900], [290, 900]], C.agua);
  s.r('inf', X, Y, W, 640, { f: C.blanco, s: C.borde, sw: 1, rr: 24, n: 'ajustes:tarjeta' });
  s.t('inf', X + 40, Y + 36, 'Ajustes', 32, 'B', C.tinta, { n: 'titulo' });
  s.i('inf', X + 40 + medir('Ajustes', 32, 'B') + 8 + 12, Y + 36 + 21, 'ajustes', 24);

  const fila = (i: number, titulo: string, detalle: string) => {
    const yy = Y + 120 + i * 92;
    s.r('inf', X + 40, yy - 14, W - 80, 1, { f: C.borde });
    s.t('inf', X + 40, yy + 8, titulo, 18, 'SB', C.tinta);
    s.t('inf', X + 40, yy + 34, detalle, 13, 'M', C.sec);
    return yy;
  };
  let yy = fila(0, 'Sonido', 'Efectos al tocar una vía.');
  s.i('inf', X + 40 + medir('Sonido', 18, 'SB') + 8 + 12, yy + 8 + 12, 'sonido', 24);
  interruptor(s, X + W - 96, yy + 14, p.sonido, 'sonido');
  yy = fila(1, 'Vibración', 'Solo en el celular.');
  interruptor(s, X + W - 96, yy + 14, p.vibracion, 'vibracion');

  const detalleBorrar = {
    nada: 'Vuelves al nivel 01. No se puede deshacer.',
    confirmar: '¿Seguro? Se borra todo tu avance y la bitácora.',
    hecho: 'Listo: empiezas otra vez en el nivel 01.',
  }[borrado];
  yy = fila(2, 'Borrar progreso', detalleBorrar);
  if (borrado === 'confirmar') {
    s.pill('inf', X + W - 214, yy + 30, [{ v: 'Cancelar', z: 14, f: 'SB', c: C.tinta }], { px: 18, py: 8, n: 'btn:cancelar' });
    s.pill('inf', X + W - 100, yy + 30, [{ v: 'Sí, borrar', z: 14, f: 'SB', c: C.blanco }], { bg: C.tinta, bd: C.tinta, px: 18, py: 8, n: 'btn:confirmar' });
  } else if (borrado === 'nada') s.pill('inf', X + W - 110, yy + 30, [{ v: 'Borrar', z: 14, f: 'SB', c: C.tinta }], { px: 18, py: 8, n: 'btn:borrar' });

  yy = Y + 120 + 3 * 92;
  s.r('inf', X + 40, yy - 14, W - 80, 1, { f: C.borde });
  s.t('inf', X + 40, yy + 8, 'CRÉDITOS', 11, 'CB', C.sec, { ls: 1.4 });
  s.t('inf', X + 40, yy + 30, 'Equilibrio · un juego sobre la paradoja de Braess', 15, 'SB', C.tinta);
  s.t('inf', X + 40, yy + 54, 'Composición Digital de Apps y UI Kits · Universidad Jorge Tadeo Lozano', 13, 'M', C.sec);
  s.t('inf', X + 40, yy + 74, 'Profesor John Melo · Bogotá, 2026', 13, 'M', C.sec);
  partir(EQUIPO, 13, 'M', W - 80).forEach((l, i) => s.t('inf', X + 40, yy + 98 + i * 20, l, 13, 'M', C.tinta, { n: 'creditos:equipo' }));
  s.t('inf', X + W - 40, Y + 640 - 36, 'v0.1', 11, 'CB', C.sec, { a: 'r', ls: 1 });
  return s;
}

/** Botón cerrar (redondo, 24) y semántica de interruptor para lectores de pantalla. */
function completar(capas: Capas) {
  capas.inf.append(botonRedondo('cerrar', X + W - 56, Y + 56, 'cerrar', 'Cerrar', { r: 20, tam: 24 }));
  const p = preferencias();
  for (const [btn, nombre, on] of [
    ['sonido', 'Sonido', p.sonido],
    ['vibracion', 'Vibración', p.vibracion],
  ] as const) {
    const e = capas.inf.querySelector(`[data-btn="${btn}"]`);
    e?.setAttribute('role', 'switch');
    e?.setAttribute('aria-checked', String(on));
    e?.setAttribute('aria-label', nombre);
  }
  capas.inf.querySelector('[data-btn="borrar"]')?.setAttribute('aria-label', 'Borrar progreso');
}

export function pantallaAjustes(svg: SVGSVGElement, al: { cerrar(): void; borrarProgreso(): void }): Pantalla {
  let actual: Pantalla | null = null;
  let borrado: Borrado = 'nada';
  const montar = (foco: string) => {
    actual?.cerrar();
    actual = montarEscena(svg, escenaAjustes(borrado), boton, completar, foco);
  };
  function boton(b: string) {
    if (b === 'cerrar') return al.cerrar();
    if (b === 'sonido') {
      cambiarPreferencias({ sonido: !preferencias().sonido });
      sonar('tic'); // si quedó encendido, se oye de una vez (este toque habilita el audio)
      anunciar(preferencias().sonido ? 'Sonido encendido.' : 'Sonido apagado.');
    } else if (b === 'vibracion') {
      cambiarPreferencias({ vibracion: !preferencias().vibracion });
      if (preferencias().vibracion) navigator.vibrate?.(40);
      anunciar(preferencias().vibracion ? 'Vibración encendida.' : 'Vibración apagada.');
    } else if (b === 'borrar') borrado = 'confirmar';
    else if (b === 'cancelar') borrado = 'nada';
    else if (b === 'confirmar') {
      al.borrarProgreso();
      borrado = 'hecho';
      anunciar('Progreso borrado. Empiezas otra vez en el nivel 01.');
    } else return;
    // el foco se queda donde tiene sentido después de cada acción
    const foco = { borrar: '[data-btn="cancelar"]', cancelar: '[data-btn="borrar"]', confirmar: '[data-btn="cerrar"]' }[b as 'borrar'] ?? `[data-btn="${b}"]`;
    montar(foco);
  }
  montar('[data-btn="cerrar"]');
  return {
    cerrar() {
      actual?.cerrar();
    },
  };
}
