/**
 * Sistema visual de Equilibrio (portado de reference/escena.js).
 * 5 capas de color; cada color tiene un solo trabajo.
 * Regla: las líneas NUNCA usan rojo, verde ni magenta (solo costo alto, meta y cable).
 */
export const C = {
  // 1 Territorio
  tierra: '#F2F1EC',
  agua: '#D3DEE6',
  parque: '#DDE6D3',
  // 2 Red (identidad de línea)
  amarilla: '#F0B429',
  naranja: '#E8772E',
  azul: '#2E62B5',
  lila: '#8565C4',
  cafe: '#8B5E3C',
  cian: '#2FA8D5',
  // 3 Estaciones
  tinta: '#1F2329',
  blanco: '#FFFFFF',
  // 4 Estados
  cerrada: '#B8BCC3',
  cable: '#D6338A',
  rojo: '#D93A35',
  verde: '#2E8B57',
  // 5 Información
  sec: '#5B616B',
  borde: '#D5D8DC',
  // Mismo tono, más oscuro, SOLO para texto pequeño (< 18 px): el verde y el magenta
  // de Figma dan 4,25:1 y 4,47:1 sobre blanco; estos pasan WCAG AA (≥ 4,5:1 sobre blanco y tierra).
  verdeTexto: '#297C4D',
  cableTexto: '#C52F7F',
} as const;

/** Color de una línea de la red (o tinta si no tiene). */
export function colorLinea(line: string | null): string {
  switch (line) {
    case 'amarilla':
      return C.amarilla;
    case 'naranja':
      return C.naranja;
    case 'azul':
      return C.azul;
    case 'lila':
      return C.lila;
    case 'cafe':
      return C.cafe;
    case 'cian':
      return C.cian;
    default:
      return C.tinta;
  }
}

/** Bloques de dificultad: nombre y color del círculo del título. */
export const BLOQUE: Record<1 | 2 | 3, [string, string]> = {
  1: ['Fácil', C.amarilla],
  2: ['Intermedio', C.naranja],
  3: ['Difícil', C.azul],
};

/** Códigos de fuente de escena.js → familia y peso. */
export type Fuente = 'EB' | 'B' | 'SB' | 'M' | 'C' | 'CB';
export const FUENTES: Record<Fuente, { familia: string; peso: number }> = {
  EB: { familia: 'Barlow', peso: 800 },
  B: { familia: 'Barlow', peso: 700 },
  SB: { familia: 'Barlow', peso: 600 },
  M: { familia: 'Barlow', peso: 500 },
  C: { familia: 'Barlow Condensed', peso: 600 },
  CB: { familia: 'Barlow Condensed', peso: 700 },
};

export function cssFuente(f: Fuente, z: number): string {
  const { familia, peso } = FUENTES[f];
  return `${peso} ${z}px "${familia}"`;
}
