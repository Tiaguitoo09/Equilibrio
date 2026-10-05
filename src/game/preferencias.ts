/**
 * Preferencias del jugador (pantalla de Ajustes), guardadas en localStorage.
 * Como en el diseño: sonido apagado y vibración encendida por defecto.
 */
export interface Preferencias {
  sonido: boolean;
  vibracion: boolean;
}

const CLAVE = 'equilibrio.preferencias.v1';
const PORDEFECTO: Preferencias = { sonido: false, vibracion: true };

function cargar(): Preferencias {
  try {
    const d = JSON.parse(globalThis.localStorage?.getItem(CLAVE) ?? 'null');
    return {
      sonido: typeof d?.sonido === 'boolean' ? d.sonido : PORDEFECTO.sonido,
      vibracion: typeof d?.vibracion === 'boolean' ? d.vibracion : PORDEFECTO.vibracion,
    };
  } catch {
    return { ...PORDEFECTO };
  }
}

let actuales = cargar();

export function preferencias(): Readonly<Preferencias> {
  return actuales;
}

export function cambiarPreferencias(cambio: Partial<Preferencias>) {
  actuales = { ...actuales, ...cambio };
  try {
    globalThis.localStorage?.setItem(CLAVE, JSON.stringify(actuales));
  } catch {
    // sin almacenamiento: dura solo esta sesión
  }
}
