/**
 * Sonidos muy cortos hechos con Web Audio API (sin archivos):
 *   tic        → tocar una vía
 *   no         → el toque no se permite (sin ruta, obra, sin toques)
 *   equilibrio → acorde corto al llegar al óptimo
 * Respetan el interruptor de Ajustes (apagado por defecto). El AudioContext se crea en el primer
 * sonido, que siempre viene de un toque del jugador; así el navegador no lo bloquea.
 */
import { preferencias } from '../game/preferencias';

export type Sonido = 'tic' | 'no' | 'equilibrio';

let ctx: AudioContext | null = null;

function contexto(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Una nota: frecuencia (Hz) que puede deslizarse a `hasta`, con ataque rápido y caída suave. */
function nota(c: AudioContext, inicio: number, duracion: number, frecuencia: number, volumen: number, tipo: OscillatorType, hasta?: number) {
  const osc = c.createOscillator();
  const vol = c.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(frecuencia, inicio);
  if (hasta) osc.frequency.exponentialRampToValueAtTime(hasta, inicio + duracion);
  vol.gain.setValueAtTime(0.0001, inicio);
  vol.gain.exponentialRampToValueAtTime(volumen, inicio + 0.008);
  vol.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
  osc.connect(vol).connect(c.destination);
  osc.start(inicio);
  osc.stop(inicio + duracion + 0.02);
}

export function sonar(s: Sonido) {
  if (!preferencias().sonido) return;
  const c = contexto();
  if (!c) return;
  const t = c.currentTime + 0.01;
  if (s === 'tic') nota(c, t, 0.07, 1250, 0.08, 'sine', 820);
  else if (s === 'no') {
    nota(c, t, 0.09, 190, 0.07, 'triangle', 150);
    nota(c, t + 0.1, 0.11, 160, 0.06, 'triangle', 120);
  } else {
    // do – mi – sol, apenas escalonados
    [523.25, 659.25, 783.99].forEach((f, i) => nota(c, t + i * 0.05, 0.55 - i * 0.05, f, 0.06, 'triangle'));
  }
}
