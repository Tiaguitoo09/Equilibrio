/**
 * Pantalla de un nivel: une estado (src/game), dibujo (src/render) y toques.
 * Un solo gesto: tocar una vía la abre o la cierra.
 * Encima pueden ir el tutorial (solo nivel 01) o el menú de pausa.
 */
import type { Nivel } from '../engine/equilibrio';
import { Carros } from '../game/carros';
import { EstadoNivel } from '../game/estadoNivel';
import { escenaNivel } from '../render/nivel';
import { activarBotones, el, pintar, trazoRedondeado, type Capas } from '../render/svg';
import { botonRedondo } from '../ui/iconos';
import { escucharBotones } from './montar';
import { dibujarPausa } from './pausa';
import { dibujarTutorial, PASOS_TUTORIAL } from './tutorial';

export interface PantallaNivel {
  estado: EstadoNivel;
  tocar(id: string): void;
  cerrar(): void;
}

export interface OpcionesNivel {
  /** empezar con el tutorial de 4 pasos */
  tutorial?: boolean;
  /** se llama una vez, cuando el nivel llega al equilibrio */
  alGanar?: (estado: EstadoNivel) => void;
  /** salir del nivel: botón «Ver bitácora» o el menú de pausa */
  alSalir?: (destino: 'bitacora' | 'plano' | 'inicio') => void;
  /** se llama después de cada dibujo (p. ej. para la navegación de pruebas) */
  alDibujar?: (capas: Capas) => void;
}

export function pantallaNivel(svg: SVGSVGElement, nivel: Nivel, opciones: OpcionesNivel = {}): PantallaNivel {
  const estado = new EstadoNivel(nivel);
  const carros = new Carros();
  let pausado = false;
  let paso = opciones.tutorial ? 1 : 0; // 0 = sin tutorial
  let ganado = false;

  function dibujar() {
    const r = estado.resultadoFase;
    // en el tutorial no se muestran píldora ni leyenda: lo explica la tarjeta
    const lv = paso ? { ...nivel, msg: null, legend: null } : nivel;
    const { escena, vias } = escenaNivel(lv, {
      abiertas: estado.abiertas,
      t: r.t,
      x: r.x,
      total: estado.total,
      resuelto: estado.resuelto,
      toques: estado.toques,
      fase: estado.fase,
      verBitacora: !paso,
    });
    const capas = pintar(svg, escena);
    // zonas invisibles (30 px) para tocar cada vía con el dedo
    for (const v of vias) {
      capas.toque.append(
        el('path', {
          d: trazoRedondeado(v.pts, v.rad),
          class: v.locked ? 'toque obra' : 'toque',
          'data-tocar': v.id,
          fill: 'none',
          stroke: 'transparent',
          'stroke-width': 30,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        }),
      );
    }
    capas.inf.append(botonRedondo('reiniciar', 62, 838, 'reiniciar', 'Reiniciar'), botonRedondo('pausa', 116, 838, 'pausa', 'Pausa'));
    activarBotones(capas.inf);
    capas.inf.querySelectorAll<SVGElement>('[data-btn^="fase-"]').forEach((b) => {
      b.setAttribute('aria-label', nivel.phases?.[Number(b.dataset.btn!.slice(5))]?.name ?? '');
    });
    carros.pausado = pausado;
    carros.montar(capas.carros, vias);
    if (paso) dibujarTutorial(paso, nivel, escena, capas, vias);
    else if (pausado) dibujarPausa(capas);
    opciones.alDibujar?.(capas);
  }

  /** La vía vibra y vuelve a su estado (toque no permitido). */
  function vibrar(id: string) {
    svg.querySelectorAll(`[data-via="${CSS.escape(id)}"]`).forEach((e) => {
      e.classList.remove('vibra');
      void (e as SVGElement).getBoundingClientRect(); // reinicia la animación
      e.classList.add('vibra');
    });
    navigator.vibrate?.(40);
  }

  /** Paso 3 del tutorial: se abre la vía de verdad y se ve el resultado en el paso 4. */
  function tocarEnTutorial(id: string) {
    if (paso !== 3 || id !== nivel.solucion[0]) return;
    estado.tocar(id);
    paso = 4;
    dibujar();
  }

  function terminarTutorial() {
    paso = 0;
    estado.reiniciar(); // ahora lo juega el jugador
    dibujar();
  }

  function tocar(id: string) {
    if (pausado) return;
    if (paso) return tocarEnTutorial(id);
    const r = estado.tocar(id);
    if (r === 'ok') {
      if (estado.resuelto && !ganado) {
        ganado = true;
        opciones.alGanar?.(estado);
      }
      dibujar();
    } else if (r === 'sin-ruta' || r === 'obra' || r === 'agotado') vibrar(id);
  }

  function boton(nombre: string) {
    if (paso) {
      if (nombre === 'saltar') terminarTutorial();
      else if (nombre === 'siguiente') {
        if (paso === 3) tocarEnTutorial(nivel.solucion[0]);
        else if (paso === PASOS_TUTORIAL) terminarTutorial();
        else {
          paso++;
          dibujar();
        }
      }
      return;
    }
    switch (nombre) {
      case 'reiniciar':
        estado.reiniciar();
        ganado = false;
        pausado = false;
        break;
      case 'pausa':
        pausado = true;
        break;
      case 'seguir':
        pausado = false;
        break;
      case 'bitacora':
      case 'plano':
      case 'inicio':
        opciones.alSalir?.(nombre);
        return;
      default:
        if (!nombre.startsWith('fase-')) return;
        estado.fase = Number(nombre.slice(5));
    }
    dibujar();
  }

  const alHacerClic = (ev: MouseEvent) => {
    const id = (ev.target as Element).closest<SVGElement>('[data-tocar]')?.dataset.tocar;
    if (id) tocar(id);
  };
  svg.addEventListener('click', alHacerClic);
  const dejarBotones = escucharBotones(svg, boton);
  dibujar();

  return {
    estado,
    tocar,
    cerrar() {
      carros.detener();
      svg.removeEventListener('click', alHacerClic);
      dejarBotones();
    },
  };
}
