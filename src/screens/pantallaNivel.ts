/**
 * Pantalla de un nivel: une estado (src/game), dibujo (src/render) y toques.
 * Un solo gesto: tocar una vía la abre o la cierra.
 */
import type { Nivel } from '../engine/equilibrio';
import { Carros } from '../game/carros';
import { EstadoNivel } from '../game/estadoNivel';
import { escenaNivel } from '../render/nivel';
import { el, pintar, trazoRedondeado } from '../render/svg';
import { botonRedondo } from '../ui/iconos';

export interface PantallaNivel {
  estado: EstadoNivel;
  tocar(id: string): void;
  cerrar(): void;
}

export function pantallaNivel(svg: SVGSVGElement, nivel: Nivel): PantallaNivel {
  const estado = new EstadoNivel(nivel);
  const carros = new Carros();
  let pausado = false;

  function dibujar() {
    const r = estado.resultadoFase;
    const { escena, vias } = escenaNivel(nivel, {
      abiertas: estado.abiertas,
      t: r.t,
      x: r.x,
      total: estado.total,
      resuelto: estado.resuelto,
      toques: estado.toques,
      fase: estado.fase,
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
    capas.inf.append(
      botonRedondo('reiniciar', 62, 838, 'reiniciar', 'Reiniciar'),
      botonRedondo('pausa', 116, 838, pausado ? 'reanudar' : 'pausa', pausado ? 'Seguir' : 'Pausa'),
    );
    carros.montar(capas.carros, vias);
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

  function tocar(id: string) {
    if (pausado) return;
    const r = estado.tocar(id);
    if (r === 'ok') dibujar();
    else if (r === 'sin-ruta' || r === 'obra' || r === 'agotado') vibrar(id);
  }

  function boton(nombre: string) {
    if (nombre === 'reiniciar') {
      estado.reiniciar();
      pausado = false;
      carros.pausado = false;
    } else if (nombre === 'pausa') {
      pausado = !pausado;
      carros.pausado = pausado;
    }
    dibujar();
  }

  const alHacerClic = (ev: MouseEvent) => {
    const objetivo = (ev.target as Element).closest<SVGElement>('[data-tocar],[data-btn]');
    if (!objetivo) return;
    if (objetivo.dataset.tocar) tocar(objetivo.dataset.tocar);
    else if (objetivo.dataset.btn) boton(objetivo.dataset.btn);
  };
  const alTeclear = (ev: KeyboardEvent) => {
    const b = (ev.target as Element).closest<SVGElement>('[data-btn]');
    if (b?.dataset.btn && (ev.key === 'Enter' || ev.key === ' ')) {
      ev.preventDefault();
      boton(b.dataset.btn);
    }
  };
  svg.addEventListener('click', alHacerClic);
  svg.addEventListener('keydown', alTeclear);
  dibujar();

  return {
    estado,
    tocar,
    cerrar() {
      carros.detener();
      svg.removeEventListener('click', alHacerClic);
      svg.removeEventListener('keydown', alTeclear);
    },
  };
}
