/**
 * Estado de un nivel en juego: vías abiertas, toques, fase mostrada y puntaje.
 * Sin DOM: se puede probar con `npm test`.
 */
import { abiertasIniciales, alternar, enEquilibrio, puntaje, type Nivel, type Puntaje } from '../engine/equilibrio';

/**
 * Resultado de tocar una vía:
 *  ok        → se abrió o cerró
 *  obra      → es una obra, no se toca
 *  sin-ruta  → dejaría a un grupo sin ruta (la vía vibra y no cambia)
 *  agotado   → ya no quedan toques (solo reiniciar)
 *  resuelto  → el nivel ya está en equilibrio
 */
export type ResultadoToque = 'ok' | 'obra' | 'sin-ruta' | 'agotado' | 'resuelto';

export class EstadoNivel {
  abiertas: Set<string>;
  toques = 0;
  puntaje: Puntaje;
  /** fase mostrada; por defecto la última (Hora pico) */
  fase: number;

  constructor(readonly nivel: Nivel) {
    this.abiertas = abiertasIniciales(nivel);
    this.puntaje = puntaje(nivel, this.abiertas)!;
    this.fase = this.puntaje.fases.length - 1;
  }

  /** TOTAL: minutos promedio por carro */
  get total(): number {
    return this.puntaje.promedio;
  }

  get resuelto(): boolean {
    return enEquilibrio(this.nivel, this.total);
  }

  /** toques que quedan (Infinity si el nivel no tiene tope) */
  get quedan(): number {
    return this.nivel.toques === undefined ? Infinity : this.nivel.toques - this.toques;
  }

  /** resultado del motor en la fase mostrada */
  get resultadoFase() {
    return this.puntaje.fases[this.fase];
  }

  tocar(id: string): ResultadoToque {
    if (this.resuelto) return 'resuelto';
    const via = this.nivel.links.find((l) => l.id === id);
    if (!via) return 'sin-ruta';
    if (via.locked) return 'obra';
    if (this.quedan <= 0) return 'agotado';
    const nuevas = alternar(this.nivel, this.abiertas, id);
    const p = puntaje(this.nivel, nuevas);
    if (!p) return 'sin-ruta';
    this.abiertas = nuevas;
    this.puntaje = p;
    this.toques++;
    return 'ok';
  }

  reiniciar() {
    this.abiertas = abiertasIniciales(this.nivel);
    this.puntaje = puntaje(this.nivel, this.abiertas)!;
    this.toques = 0;
  }
}
