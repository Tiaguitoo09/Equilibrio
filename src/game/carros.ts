/**
 * Carros animados: círculos tinta r5,5 con borde blanco 2,5 que recorren cada vía abierta.
 *  - cuántos: ≈ 1 por cada 650 carros, máximo 6
 *  - qué tan rápido: velocidad ∝ 1/tiempo de la vía (más lentos en una angosta llena)
 * La capa de carros va debajo de estaciones y pastillas, así que nunca se ven encima de la pastilla de costo.
 */
import { C } from '../render/colores';
import { el, trazoRedondeado } from '../render/svg';
import type { InfoVia } from '../render/nivel';

const CARROS_POR_PUNTO = 650;
const MAX_PUNTOS = 6;

/** px por segundo. 60 min → 80 px/s, 45 min → 100 px/s, 0 min (cable) → 400 px/s. */
const velocidad = (minutos: number) => 6000 / (Math.max(0, minutos) + 15);

interface Pista {
  id: string;
  path: SVGPathElement;
  largo: number;
  vel: number;
  puntos: SVGCircleElement[];
}

export class Carros {
  private pistas: Pista[] = [];
  /** avance de cada vía; se conserva al redibujar para que los carros no salten */
  private avance = new Map<string, number>();
  private ultimo = 0;
  private raf = 0;
  private quieto = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  pausado = false;

  /** Crea los carros de cada vía abierta dentro de la capa dada. */
  montar(capa: SVGGElement, vias: InfoVia[]) {
    this.pistas = [];
    for (const v of vias) {
      if (!v.abierta) continue;
      const n = Math.min(MAX_PUNTOS, Math.round(v.x / CARROS_POR_PUNTO));
      if (n <= 0) continue;
      const path = el('path', { d: trazoRedondeado(v.pts, v.rad), fill: 'none', stroke: 'none' });
      capa.append(path);
      const puntos: SVGCircleElement[] = [];
      for (let i = 0; i < n; i++) {
        const c = el('circle', { r: 5.5, fill: C.tinta, stroke: C.blanco, 'stroke-width': 2.5, 'data-n': 'carro' });
        capa.append(c);
        puntos.push(c);
      }
      this.pistas.push({ id: v.id, path, largo: path.getTotalLength(), vel: velocidad(v.t), puntos });
    }
    this.colocar();
    if (!this.raf && !this.quieto) {
      this.ultimo = performance.now();
      this.raf = requestAnimationFrame(this.cuadro);
    }
  }

  private cuadro = (ahora: number) => {
    const dt = Math.min(0.1, (ahora - this.ultimo) / 1000);
    this.ultimo = ahora;
    if (!this.pausado) {
      for (const p of this.pistas) this.avance.set(p.id, ((this.avance.get(p.id) ?? 0) + p.vel * dt) % p.largo);
      this.colocar();
    }
    this.raf = requestAnimationFrame(this.cuadro);
  };

  private colocar() {
    for (const p of this.pistas) {
      const a = this.avance.get(p.id) ?? 0;
      const n = p.puntos.length;
      p.puntos.forEach((c, i) => {
        const q = p.path.getPointAtLength((a + ((i + 0.5) * p.largo) / n) % p.largo);
        c.setAttribute('cx', q.x.toFixed(1));
        c.setAttribute('cy', q.y.toFixed(1));
      });
    }
  }

  detener() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.pistas = [];
  }
}
