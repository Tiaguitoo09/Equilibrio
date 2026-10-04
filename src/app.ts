/**
 * Flujo de pantallas:
 *   carga → inicio → (carga del nivel → tutorial en el 01) → nivel → bitácora → siguiente nivel
 * Desde el inicio: plano de la red, bitácora y ajustes. Desde la pausa: plano e inicio.
 * El progreso se guarda en localStorage cada vez que se gana un nivel.
 */
import { abiertasIniciales, alternar, puntaje, type Nivel } from './engine/equilibrio';
import { bitacora as armarBitacora, type Bitacora } from './game/bitacora';
import { cargarProgreso, disponible, guardarProgreso, registrarVictoria, type Progreso } from './game/progreso';
import type { Capas } from './render/svg';
import { pantallaAjustes } from './screens/ajustes';
import { pantallaBitacora } from './screens/bitacora';
import { pantallaCargaApp, pantallaCargaNivel } from './screens/carga';
import { pantallaInicio } from './screens/inicio';
import type { Pantalla } from './screens/montar';
import { pantallaNivel } from './screens/pantallaNivel';
import { pantallaPlano } from './screens/plano';

export type Destino =
  | { p: 'carga' }
  | { p: 'inicio' }
  | { p: 'plano' }
  | { p: 'ajustes' }
  | { p: 'bitacora'; num: number }
  | { p: 'cargaNivel'; num: number }
  | { p: 'nivel'; num: number; tutorial?: boolean };

export interface OpcionesApp {
  /** solo pruebas: se llama después de cada dibujo de un nivel */
  alDibujarNivel?: (capas: Capas, num: number) => void;
}

export function crearApp(svg: SVGSVGElement, niveles: Nivel[], opciones: OpcionesApp = {}) {
  let progreso: Progreso = cargarProgreso();
  let actual: Pantalla | null = null;
  const nivel = (num: number) => niveles.find((l) => l.num === num)!;

  /** Bitácora guardada del nivel; si no hay (pruebas), la de su solución. */
  function entrada(num: number): Bitacora {
    const guardada = progreso.bitacora[num];
    if (guardada) return guardada;
    const lv = nivel(num);
    let s = abiertasIniciales(lv);
    for (const id of lv.solucion) s = alternar(lv, s, id);
    return armarBitacora(lv, s, puntaje(lv, s)!.promedio);
  }

  function abrir(d: Destino): Pantalla {
    switch (d.p) {
      case 'carga':
        return pantallaCargaApp(svg, () => ir({ p: 'inicio' }));
      case 'inicio':
        return pantallaInicio(svg, progreso, (b) => {
          if (b === 'jugar') ir({ p: 'cargaNivel', num: progreso.actual });
          else if (b === 'bitacora' && progreso.ultima) ir({ p: 'bitacora', num: progreso.ultima });
          else if (b === 'plano' || b === 'ajustes') ir({ p: b });
        });
      case 'plano':
        return pantallaPlano(svg, niveles, progreso, {
          elegir: (num) => disponible(progreso, num) && ir({ p: 'cargaNivel', num }),
          volver: () => ir({ p: 'inicio' }),
        });
      case 'ajustes':
        return pantallaAjustes(svg, () => ir({ p: 'inicio' }));
      case 'cargaNivel':
        // el tutorial solo sale la primera vez que se entra al nivel 01
        return pantallaCargaNivel(svg, nivel(d.num), () => ir({ p: 'nivel', num: d.num, tutorial: d.num === 1 && !progreso.resueltos.includes(1) }));
      case 'nivel': {
        const lv = nivel(d.num);
        return pantallaNivel(svg, lv, {
          tutorial: d.tutorial,
          alGanar: (e) => {
            progreso = registrarVictoria(progreso, lv.num, e.toques, armarBitacora(lv, e.abiertas, e.total));
            guardarProgreso(progreso);
          },
          alSalir: (destino) => ir(destino === 'bitacora' ? { p: 'bitacora', num: lv.num } : { p: destino }),
          alDibujar: opciones.alDibujarNivel && ((capas) => opciones.alDibujarNivel!(capas, lv.num)),
        });
      }
      case 'bitacora': {
        const siguiente = niveles.find((l) => l.num === d.num + 1);
        return pantallaBitacora(svg, d.num, entrada(d.num), {
          siguiente: siguiente && (() => ir({ p: 'cargaNivel', num: siguiente.num })),
          plano: () => ir({ p: 'plano' }),
        });
      }
    }
  }

  function ir(d: Destino): Pantalla {
    actual?.cerrar();
    actual = abrir(d);
    return actual;
  }

  return {
    ir,
    get progreso() {
      return progreso;
    },
  };
}

export type App = ReturnType<typeof crearApp>;
