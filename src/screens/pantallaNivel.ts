/**
 * Pantalla de un nivel: une estado (src/game), dibujo (src/render) y toques.
 * Un solo gesto: tocar una vía la abre o la cierra (con el teclado: Tab hasta la vía y Enter o Espacio).
 * Encima pueden ir el tutorial (solo nivel 01), el menú de pausa (botón Pausa o Esc)
 * o «Sin toques» (niveles con tope, al gastarlos todos sin llegar al óptimo).
 */
import type { Nivel } from '../engine/equilibrio';
import { Carros } from '../game/carros';
import { EstadoNivel } from '../game/estadoNivel';
import { escenaNivel } from '../render/nivel';
import { nf } from '../render/primitivas';
import { activarBotones, el, pintar, trazoRedondeado } from '../render/svg';
import { preferencias } from '../game/preferencias';
import { anunciar } from '../ui/anuncio';
import { sonar } from '../ui/sonido';
import { botonRedondo } from '../ui/iconos';
import { escucharBotones } from './montar';
import { dibujarPausa } from './pausa';
import { dibujarSinToques, MENSAJE_SIN_TOQUES } from './sinToques';
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
}

/** Lo que había antes de un toque, para animar el cambio. */
interface Antes {
  via: string;
  total: number;
  t: Record<string, number>;
  resuelto: boolean;
}

const DURACION = 260; // ms: el resultado de un toque se ve completo en menos de 300 ms
const quieto = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const HUD_X = 1074 + 24; // inicio de la barra de progreso del HUD (src/render/hud.ts)
const HUD_ANCHO = 282;

export function pantallaNivel(svg: SVGSVGElement, nivel: Nivel, opciones: OpcionesNivel = {}): PantallaNivel {
  const estado = new EstadoNivel(nivel);
  const carros = new Carros();
  let pausado = false;
  let paso = opciones.tutorial ? 1 : 0; // 0 = sin tutorial
  let ganado = false;
  let sinToques = false;
  let esperaSinToques = 0;
  let rafHud = 0;
  /** a dónde llevar el foco en el próximo dibujo (si no, se conserva el que había); al entrar, la primera vía */
  let focoPendiente: string | null = '.toque:not(.obra)';

  /** Selector del elemento con foco dentro del SVG, para devolvérselo después de redibujar. */
  function claveFoco(): string | null {
    const a = document.activeElement as SVGElement | null;
    if (!a || !svg.contains(a)) return null;
    if (a.dataset.tocar) return `[data-tocar="${CSS.escape(a.dataset.tocar)}"]`;
    if (a.dataset.btn) return `[data-btn="${CSS.escape(a.dataset.btn)}"]`;
    return null;
  }

  function dibujar(antes?: Antes) {
    cancelAnimationFrame(rafHud);
    const foco = focoPendiente ?? claveFoco();
    focoPendiente = null;
    const r = estado.resultadoFase;
    // en el tutorial no se muestran píldora ni leyenda: lo explica la tarjeta
    const lv = paso ? { ...nivel, msg: null, legend: null } : sinToques ? { ...nivel, msg: MENSAJE_SIN_TOQUES } : nivel;
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
    // zonas invisibles (30 px) para tocar cada vía; también se alcanzan con Tab
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
          role: 'button',
          tabindex: 0,
          'aria-label': v.etiqueta,
          'aria-disabled': v.locked ? 'true' : undefined,
        }),
      );
    }
    capas.inf.append(botonRedondo('reiniciar', 62, 838, 'reiniciar', 'Reiniciar'), botonRedondo('pausa', 116, 838, 'pausa', 'Pausa'));
    activarBotones(capas.inf);
    capas.inf.querySelectorAll<SVGElement>('[data-btn^="fase-"]').forEach((b) => {
      b.setAttribute('aria-label', nivel.phases?.[Number(b.dataset.btn!.slice(5))]?.name ?? '');
      b.setAttribute('aria-pressed', String(b.dataset.btn === `fase-${estado.fase}`));
    });
    carros.pausado = pausado;
    carros.montar(capas.carros, vias);
    if (antes && !quieto()) animarCambio(antes);

    if (paso) dibujarTutorial(paso, nivel, escena, capas, vias);
    else if (sinToques) dibujarSinToques(capas, nivel, estado.total);
    else if (pausado) dibujarPausa(capas, nivel, estado.total);

    // con el tutorial o la pausa abiertos, el teclado solo recorre la tarjeta
    const capaArriba = paso || pausado || sinToques ? capas.top : null;
    if (capaArriba) {
      svg.querySelectorAll<SVGElement>('[tabindex]').forEach((e) => {
        if (capaArriba.contains(e)) return;
        e.setAttribute('tabindex', '-1');
        e.setAttribute('aria-hidden', 'true');
      });
    }
    const destino =
      (foco && (capaArriba ?? svg).querySelector<SVGElement>(foco)) || (capaArriba ? capaArriba.querySelector<SVGElement>('[data-btn="siguiente"],[data-btn="seguir"],[data-btn="reintentar"]') : null);
    destino?.focus({ preventScroll: true });
  }

  /** Transición del toque: la vía que cambió aparece, las pastillas que cambiaron laten y el TOTAL corre hasta su valor. */
  function animarCambio(antes: Antes) {
    svg.querySelectorAll(`[data-capa="red"] [data-via="${CSS.escape(antes.via)}"]`).forEach((e) => e.classList.add('aparece'));
    const ahora = estado.resultadoFase.t;
    svg.querySelectorAll<SVGElement>('[data-n^="costo:"]').forEach((e) => {
      const id = e.dataset.n!.slice(6);
      if (id === antes.via || Math.round(antes.t[id] ?? -1) !== Math.round(ahora[id])) e.classList.add('late');
    });
    if (!antes.resuelto && estado.resuelto) svg.querySelectorAll('[data-n="hud:mensaje"],[data-btn="bitacora"]').forEach((e) => e.classList.add('aparece'));

    const texto = svg.querySelector('[data-n="hud:total"]');
    const punto = svg.querySelector('[data-n="progreso:punto"]');
    const de = antes.total;
    const a = estado.total;
    const enBarra = (v: number) => HUD_X + Math.max(0, Math.min(1, (nivel.start - v) / (nivel.start - nivel.optimo))) * HUD_ANCHO;
    const t0 = performance.now();
    const cuadro = (t: number) => {
      const k = Math.min(1, (t - t0) / DURACION);
      const v = de + (a - de) * (1 - (1 - k) ** 3);
      if (texto) texto.textContent = nf(k < 1 ? v : a);
      punto?.setAttribute('cx', enBarra(v).toFixed(1));
      if (k < 1) rafHud = requestAnimationFrame(cuadro);
    };
    rafHud = requestAnimationFrame(cuadro);
    cuadro(t0);
  }

  /** La vía vibra y vuelve a su estado (toque no permitido). */
  function vibrar(id: string) {
    svg.querySelectorAll(`[data-via="${CSS.escape(id)}"]`).forEach((e) => {
      e.classList.remove('vibra');
      void (e as SVGElement).getBoundingClientRect(); // reinicia la animación
      e.classList.add('vibra');
    });
    if (preferencias().vibracion) navigator.vibrate?.(40);
  }

  /** Paso 3 del tutorial: se abre la vía de verdad y se ve el resultado en el paso 4. */
  function tocarEnTutorial(id: string) {
    if (paso !== 3 || id !== nivel.solucion[0]) return;
    const antes = foto(id);
    estado.tocar(id);
    sonar('equilibrio');
    paso = 4;
    dibujar(antes);
  }

  function terminarTutorial() {
    paso = 0;
    estado.reiniciar(); // ahora lo juega el jugador
    focoPendiente = `[data-tocar="${CSS.escape(nivel.solucion[0])}"]`;
    dibujar();
  }

  const foto = (via: string): Antes => ({ via, total: estado.total, t: { ...estado.resultadoFase.t }, resuelto: estado.resuelto });

  function tocar(id: string) {
    if (pausado || sinToques) return;
    if (paso) return tocarEnTutorial(id);
    const antes = foto(id);
    const r = estado.tocar(id);
    if (r === 'ok') {
      if (estado.resuelto && !ganado) {
        ganado = true;
        opciones.alGanar?.(estado);
      }
      sonar(estado.resuelto && !antes.resuelto ? 'equilibrio' : 'tic');
      // se gastaron todos los toques sin llegar: «Sin toques», después de ver el resultado
      if (!estado.resuelto && nivel.toques !== undefined && estado.quedan <= 0) {
        esperaSinToques = window.setTimeout(() => {
          sinToques = true;
          dibujar();
          anunciar(`Se acabaron los toques. Quedaste en ${nf(estado.total)} minutos; la meta es ${nf(nivel.optimo)}.`);
        }, 600);
      }
      dibujar(antes);
      const t = estado.toques;
      anunciar(`TOTAL ${nf(estado.total)} minutos por carro.` + (estado.resuelto ? ` Equilibrio alcanzado en ${t} toque${t === 1 ? '' : 's'}.` : ''));
    } else if (r === 'sin-ruta' || r === 'obra' || r === 'agotado') {
      vibrar(id);
      sonar('no');
      anunciar(r === 'sin-ruta' ? 'No se puede: un grupo quedaría sin ruta.' : r === 'obra' ? 'Obra: no se toca.' : 'Ya no quedan toques. Reinicia para intentar otra vez.');
    }
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
      case 'reintentar':
        clearTimeout(esperaSinToques);
        if (sinToques) focoPendiente = '.toque:not(.obra)';
        sinToques = false;
        estado.reiniciar();
        ganado = false;
        if (pausado) focoPendiente = '[data-btn="reiniciar"]';
        pausado = false;
        anunciar(`Nivel reiniciado. TOTAL ${nf(estado.total)} minutos por carro.`);
        break;
      case 'pausa':
        pausado = true;
        break;
      case 'seguir':
        pausado = false;
        focoPendiente = '[data-btn="pausa"]';
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
  const alTeclear = (ev: KeyboardEvent) => {
    const id = (ev.target as Element).closest<SVGElement>('[data-tocar]')?.dataset.tocar;
    if (id && (ev.key === 'Enter' || ev.key === ' ')) {
      ev.preventDefault();
      tocar(id);
    }
  };
  // Esc abre y cierra la pausa (no durante el tutorial)
  const alEsc = (ev: KeyboardEvent) => {
    if (ev.key !== 'Escape' || paso || sinToques) return;
    boton(pausado ? 'seguir' : 'pausa');
  };
  svg.addEventListener('click', alHacerClic);
  svg.addEventListener('keydown', alTeclear);
  document.addEventListener('keydown', alEsc);
  const dejarBotones = escucharBotones(svg, boton);
  dibujar();

  return {
    estado,
    tocar,
    cerrar() {
      cancelAnimationFrame(rafHud);
      clearTimeout(esperaSinToques);
      carros.detener();
      svg.removeEventListener('click', alHacerClic);
      svg.removeEventListener('keydown', alTeclear);
      document.removeEventListener('keydown', alEsc);
      dejarBotones();
    },
  };
}
