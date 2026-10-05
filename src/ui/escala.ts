/**
 * Escala de los íconos (igual que en Figma). Siempre proporcional, nunca estirado.
 *   s (24): junto a texto — píldoras, chips, HUD, estaciones, grupos, leyenda, candado, cifras
 *   m (32): botones redondos (44 px) e íconos de títulos
 *   l (72): protagonistas — ingeniero en Inicio y en la bitácora, logro en Fin del juego
 * El logo va aparte: 104 en Inicio y 120 en la carga.
 * (Está separado de iconos.ts para que las pruebas en Node no carguen los SVG.)
 */
export const TAM = { s: 24, m: 32, l: 72 } as const;

/** Aire entre ícono y texto (5–8 px). */
export const AIRE = 6;

/** Radio de los botones redondos (44 px de diámetro). */
export const R_BOTON = 22;
